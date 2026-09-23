/**
 * tests/client-portal-h06-h12.test.js
 * Suíte de testes automatizados para os blocos H06 a H12 do Portal do Cliente.
 * Cobre:
 * - H06: Confirmação do Briefing (BriefingConfirmation, 7 tópicos de resumo, botões, comentário obrigatório na correção, distinção jurídica)
 * - H07: Galeria de Apresentações do Cliente integrada com Bloco F (apenas publicadas, versões REV01/REV02/REV03, filtros, permissões)
 * - H08: Visualizador Profissional de Documentos (autorização backend, PDF/imagem/prancha, zoom/pan/páginas, metadados)
 * - H09: Galeria Visual de Renders e Imagens (modos, distinção "Apresentação"/"Estudo"/"Imagem de referência", imutabilidade)
 * - H10: Área de Materiais, Mobiliário e Moodboards integrada com Bloco E (ocultação de preço/fornecedor interno, clientVisible)
 * - H11: Sistema Estruturado de Comentários (ClientComment por objeto, threads, status open/replied/resolved/reopened, arquitetura posicional)
 * - H12: Solicitação Formal de Alteração (ChangeRequest, prioridades, statuses, mensagem padronizada, vínculo com revisão)
 */

const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const StudioState = require('../js/state.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✖ [FAIL] ${message}`);
    failedTests++;
  }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: BLOCO H — PORTAL DO CLIENTE (H06 A H12)');
console.log('================================================================\n');

try {
  StudioState.init();

  const projectId = 'prj-praia-01';
  const portalId = 'cport-praia-01';
  const clientId = 'cli-pedro-01';
  const briefingId = 'brf-praia-01';

  // Cria uma sessão ativa para os testes de autorização
  const sessionResult = StudioState.createClientPortalSession({
    portalId,
    authMethod: 'magic_link',
    ip: '127.0.0.1',
    userAgent: 'Test Agent'
  });
  const sessionId = sessionResult.session.id;

  // ============================================================================
  // H06: CONFIRMAÇÃO DO BRIEFING
  // ============================================================================
  console.log('--- 1. H06: Sistema de Confirmação do Briefing (BriefingConfirmation) ---');

  // 1.1 Status Canônicos de BriefingConfirmation
  const bconfStatuses = StudioState.BRIEFING_CONFIRMATION_STATUS;
  assert(bconfStatuses.PENDING === 'pending', 'Status pending definido');
  assert(bconfStatuses.CONFIRMED === 'confirmed', 'Status confirmed definido');
  assert(bconfStatuses.CORRECTION_REQUESTED === 'correction_requested', 'Status correction_requested definido');
  assert(bconfStatuses.SUPERSEDED === 'superseded', 'Status superseded definido');

  // 1.2 Declaração Legal e Técnica Inegociável
  assert(StudioState.BRIEFING_LEGAL_DISCLAIMER.includes('Estas informações representam corretamente o briefing fornecido'), 'Declaração atesta conformidade do briefing');
  assert(StudioState.BRIEFING_LEGAL_DISCLAIMER.includes('não significa aprovação do projeto arquitetônico'), 'Declaração explicita que NÃO significa aprovação do projeto arquitetônico');

  // 1.3 Criação de Síntese de Briefing Consolidada
  const newConf = StudioState.createBriefingConfirmation(projectId, briefingId, {
    necessidades: 'Residência para veraneio e home office híbrido.',
    ambientes: 'Living integrado, varanda gourmet e piscina com deck.',
    preferencias: 'Iluminação quente indireta e ventilação cruzada.',
    referencias: 'Deck em madeira cumaru e pedra travertino.',
    estilo: 'Contemporâneo com toque praiano e matérias-primas naturais.',
    prioridades: 'Integração visual e durabilidade contra maresia.',
    observacoes: 'Atenção aos afastamentos regulamentares.'
  }, 2, 'Eduardo Marques');

  assert(!!newConf.id, 'BriefingConfirmation criado com ID exclusivo');
  assert(newConf.projectId === projectId, 'Vinculado ao projectId correto');
  assert(newConf.briefingId === briefingId, 'Vinculado ao briefingId correto');
  assert(newConf.version === 2, 'Versão consolidada registrada como v2');
  assert(newConf.status === 'pending', 'Status inicial é pending');
  assert(!!newConf.summary.necessidades, 'Resumo contém campo necessidades');
  assert(!!newConf.summary.ambientes, 'Resumo contém campo ambientes');
  assert(!!newConf.summary.preferencias, 'Resumo contém campo preferencias');
  assert(!!newConf.summary.referencias, 'Resumo contém campo referencias');
  assert(!!newConf.summary.estilo, 'Resumo contém campo estilo');
  assert(!!newConf.summary.prioridades, 'Resumo contém campo prioridades');
  assert(!!newConf.summary.observacoes, 'Resumo contém campo observacoes');

  // 1.4 Solicitar Correção: EXIGÊNCIA MANDATÓRIA DE COMENTÁRIO
  let caughtNoComment = false;
  try {
    StudioState.requestBriefingCorrection(newConf.id, 'Pedro Albuquerque', '');
  } catch (err) {
    caughtNoComment = true;
    assert(err.message.includes('Comentário obrigatório'), 'Solicitação de correção sem comentário é rejeitada');
  }
  assert(caughtNoComment === true, 'Validação de comentário obrigatório aprovada');

  // 1.5 Solicitar Correção com Comentário Válido
  const correctedConf = StudioState.requestBriefingCorrection(newConf.id, 'Pedro Albuquerque', 'Gostaríamos de incluir uma bancada de maquiagem na suíte master.');
  assert(correctedConf.status === 'correction_requested', 'Status transicionado para correction_requested');
  assert(correctedConf.comments.includes('maquiagem'), 'Comentário registrado com sucesso');

  // 1.6 Confirmação Formal das Informações
  const confirmedConf = StudioState.confirmBriefingInformation(newConf.id, 'Pedro Albuquerque', 'Todas as informações agora conferem perfeitamente.');
  assert(confirmedConf.status === 'confirmed', 'Status transicionado para confirmed');
  assert(confirmedConf.confirmedBy === 'Pedro Albuquerque', 'Identificação do confirmante registrada');
  assert(!!confirmedConf.confirmedAt, 'Timestamp de confirmação registrado');

  // 1.7 Consulta de Confirmações
  const allConfs = StudioState.getBriefingConfirmations(projectId);
  assert(allConfs.length >= 2, 'Histórico de confirmações preservado');
  const latestConf = StudioState.getLatestBriefingConfirmation(projectId);
  assert(latestConf.id === newConf.id, 'getLatestBriefingConfirmation retorna a versão mais recente');

  // ============================================================================
  // H07: GALERIA DE APRESENTAÇÕES DO CLIENTE (Bloco F)
  // ============================================================================
  console.log('\n--- 2. H07: Galeria de Apresentações do Cliente Integrada com Bloco F ---');

  const presentationsAll = StudioState.getPublishedPresentations(portalId, 'todas');
  assert(presentationsAll.length >= 1, 'Apresentações publicadas carregadas com sucesso');

  const samplePres = presentationsAll[0];
  assert(!!samplePres.coverImage, 'Apresentação possui capa');
  assert(!!samplePres.title, 'Apresentação possui nome');
  assert(!!samplePres.environmentOrProject, 'Apresentação possui ambiente/projeto');
  assert(!!samplePres.revision, 'Apresentação indica revisão (ex: REV01)');
  assert(samplePres.isPublishedVersion === true, 'Indicação clara de que esta versão está publicada');
  assert(!!samplePres.date, 'Apresentação possui data de publicação');
  assert(!!samplePres.status, 'Apresentação possui status');
  assert(samplePres.pageCount >= 1, 'Apresentação informa quantidade de páginas');
  assert(typeof samplePres.downloadAllowed === 'boolean', 'Permissão de download configurada');
  assert(typeof samplePres.commentAllowed === 'boolean', 'Permissão de comentário configurada');
  assert(typeof samplePres.approvalAllowed === 'boolean', 'Permissão de aprovação configurada');

  // 2.2 Filtros da Galeria
  const filterRecentes = StudioState.getPublishedPresentations(portalId, 'recentes');
  assert(filterRecentes.length >= 1, 'Filtro recentes operacional');
  const filterAprovadas = StudioState.getPublishedPresentations(portalId, 'aprovadas');
  assert(Array.isArray(filterAprovadas), 'Filtro aprovadas retorna array');
  const filterAguardando = StudioState.getPublishedPresentations(portalId, 'aguardando_revisao');
  assert(Array.isArray(filterAguardando), 'Filtro aguardando_revisao retorna array');

  // 2.3 Rastreabilidade de Versões (Não substituição silenciosa)
  const presVersions = StudioState.getPresentationVersions(projectId, samplePres.sourceId);
  assert(presVersions.length >= 1, 'Histórico de versões de publicação preservado sem sobrescrita silenciosa');

  // ============================================================================
  // H08: VISUALIZADOR PROFISSIONAL DE DOCUMENTOS PUBLICADOS
  // ============================================================================
  console.log('\n--- 3. H08: Visualizador Profissional de Documentos Publicados ---');

  // 3.1 Autorização de Documento Publicado
  const authDocResult = StudioState.authorizeDocumentView(portalId, sessionId, samplePres.id);
  assert(authDocResult.authorized === true, 'Acesso autorizado para documento publicado');
  assert(!!authDocResult.document.fileUrl, 'URL do arquivo disponível para renderização no canvas');
  assert(!!authDocResult.document.metadata.sheetFormat, 'Metadado de formato da prancha informado');
  assert(!!authDocResult.document.metadata.scale, 'Metadado de escala informado');

  // 3.2 Bloqueio Rigoroso de Documentos Não Publicados / Privados
  const unpub = StudioState.unpublishClientPublication(samplePres.id, 'Teste de segurança H08', 'Arquiteto');
  let caughtPrivateAccess = false;
  try {
    StudioState.authorizeDocumentView(portalId, sessionId, unpub.id);
  } catch (err) {
    caughtPrivateAccess = true;
    assert(err.message.includes('Acesso negado'), 'Tentativa de carregar documento não publicado é bloqueada');
  }
  assert(caughtPrivateAccess === true, 'Controle de acesso no backend impede visualização de arquivos privados');

  // Restaura publicação para os próximos testes
  StudioState.updateClientPublication(samplePres.id, { clientVisible: true, status: 'published' });

  // 3.3 Bloqueio de Acesso Cruzado Entre Projetos
  let caughtCrossDoc = false;
  try {
    StudioState.authorizeDocumentView('cport-marina-02', sessionId, samplePres.id);
  } catch (err) {
    caughtCrossDoc = true;
    assert(err.message.includes('Acesso negado'), 'Acesso cruzado de documento entre projetos bloqueado');
  }
  assert(caughtCrossDoc === true, 'Isolamento de documentos entre clientes confirmado');

  // ============================================================================
  // H09: GALERIA VISUAL DE RENDERS E IMAGENS APROVADAS
  // ============================================================================
  console.log('\n--- 4. H09: Galeria Visual de Renders e Imagens Aprovadas ---');

  const renders = StudioState.getPublishedRenders(portalId);
  assert(renders.length >= 1, 'Renders publicados recuperados com sucesso');

  const sampleRender = renders[0];
  assert(!!sampleRender.environmentName, 'Render informa ambiente associado');
  assert(!!sampleRender.title, 'Render informa nome');
  assert(!!sampleRender.revision, 'Render informa revisão');
  assert(!!sampleRender.date, 'Render informa data');
  assert(!!sampleRender.type, 'Render possui categoria classificada');
  assert(!!sampleRender.description, 'Render possui descrição');

  // 4.2 Distinção Obrigatória de Categorias ("Apresentação", "Estudo", "Imagem de referência")
  const validTypes = Object.values(StudioState.RENDER_CLIENT_TYPES);
  assert(validTypes.includes('Apresentação'), 'Tipo Apresentação definido');
  assert(validTypes.includes('Estudo'), 'Tipo Estudo definido');
  assert(validTypes.includes('Imagem de referência'), 'Tipo Imagem de referência definido');
  assert(validTypes.includes(sampleRender.type), 'Render classificado estritamente em uma das 3 categorias canônicas');

  // ============================================================================
  // H10: MATERIAIS, ACABAMENTOS, MOBILIÁRIO E MOODBOARD (Bloco E)
  // ============================================================================
  console.log('\n--- 5. H10: Materiais, Acabamentos, Mobiliário e Moodboard (Bloco E) ---');

  // 5.1 Materiais Publicados
  const materials = StudioState.getPublishedMaterials(projectId);
  assert(materials.length >= 1, 'Materiais publicados carregados');
  const sampleMat = materials[0];
  assert(!!sampleMat.imageUrl, 'Material exibe imagem');
  assert(!!sampleMat.name, 'Material exibe nome');
  assert(!!sampleMat.category, 'Material exibe categoria');
  assert(!!sampleMat.fabricante, 'Material exibe fabricante');
  assert(!!sampleMat.codigo, 'Material exibe código');
  assert(!!sampleMat.acabamento, 'Material exibe acabamento');
  assert(!!sampleMat.cor, 'Material exibe cor');
  assert(!!sampleMat.ambiente, 'Material exibe ambiente');

  // 5.2 Salvaguarda: Ocultação de Preço e Fornecedor Interno
  assert(sampleMat.price === undefined, 'SALVAGUARDA: Preço do material NUNCA vaza para o cliente');

  // Simular material com fornecedor interno marcado
  const internalMat = StudioState.data.projectMaterials[0];
  internalMat.isInternalSupplier = true;
  const publishedInternalMat = StudioState.getPublishedMaterials(projectId).find(m => m.id === internalMat.id);
  assert(publishedInternalMat.fornecedor === null, 'SALVAGUARDA: Fornecedor marcado como interno é estritamente ocultado (null)');

  // 5.3 Mobiliário Publicado
  const furniture = StudioState.getPublishedFurniture(projectId);
  assert(furniture.length >= 1, 'Mobiliário publicado carregado');
  const sampleFurn = furniture[0];
  assert(!!sampleFurn.imageUrl, 'Móvel exibe imagem');
  assert(!!sampleFurn.name, 'Móvel exibe nome');
  assert(!!sampleFurn.category, 'Móvel exibe categoria');
  assert(!!sampleFurn.referencia, 'Móvel exibe referência');
  assert(!!sampleFurn.dimensoes, 'Móvel exibe dimensões');
  assert(!!sampleFurn.ambiente, 'Móvel exibe ambiente');
  assert(sampleFurn.price === undefined, 'SALVAGUARDA: Preço de mobiliário NUNCA vaza para o cliente');

  // 5.4 Moodboards Publicados
  const moodboards = StudioState.getPublishedMoodboards(projectId);
  assert(moodboards.length >= 1, 'Moodboards publicados carregados');
  const sampleMb = moodboards[0];
  assert(!!sampleMb.imageUrl, 'Moodboard exibe imagem');
  assert(!!sampleMb.title, 'Moodboard exibe nome');
  assert(!!sampleMb.ambiente, 'Moodboard exibe ambiente');

  // ============================================================================
  // H11: SISTEMA ESTRUTURADO DE COMENTÁRIOS (ClientComment)
  // ============================================================================
  console.log('\n--- 6. H11: Sistema Estruturado de Comentários (ClientComment) ---');

  // 6.1 Status Canônicos de Comentário
  const ccomStatuses = StudioState.CLIENT_COMMENT_STATUS;
  assert(ccomStatuses.OPEN === 'open', 'Status open definido');
  assert(ccomStatuses.REPLIED === 'replied', 'Status replied definido');
  assert(ccomStatuses.RESOLVED === 'resolved', 'Status resolved definido');
  assert(ccomStatuses.REOPENED === 'reopened', 'Status reopened definido');
  assert(ccomStatuses.ARCHIVED === 'archived', 'Status archived definido');

  // 6.2 Alvos Canônicos
  const validTargets = StudioState.CLIENT_COMMENT_TARGET_TYPES;
  ['Projeto', 'Ambiente', 'Imagem', 'Prancha', 'Material', 'Mobiliário', 'Vídeo', 'Documento'].forEach(t => {
    assert(validTargets.includes(t), `Alvo suportado: ${t}`);
  });

  // Rejeição de alvo inválido (não transformar em chat genérico)
  let caughtInvalidTarget = false;
  try {
    StudioState.createClientComment({
      projectId,
      targetType: 'ChatGenericoInvalido',
      targetId: 'xyz',
      text: 'Olá mundo'
    });
  } catch (e) {
    caughtInvalidTarget = true;
    assert(e.message.includes('targetType inválido'), 'Alvo inválido rejeitado com sucesso');
  }
  assert(caughtInvalidTarget === true, 'Comentário sem vínculo com objeto é estritamente proibido');

  // 6.3 Criação de Comentário em Objeto Real (ex: Imagem do Living)
  const comment = StudioState.createClientComment({
    projectId,
    portalId,
    clientId,
    targetType: 'Imagem',
    targetId: 'rnd-sala-01',
    text: 'A tonalidade da marcenaria do painel está perfeita!',
    authorName: 'Pedro Albuquerque',
    authorRole: 'client',
    position: { x: 45.0, y: 70.0, page: 1 } // Arquitetura para pin posicional
  });

  assert(!!comment.id, 'ClientComment criado com ID exclusivo');
  assert(comment.status === 'open', 'Status inicial do comentário é open');
  assert(comment.targetType === 'Imagem', 'Vinculado ao targetType correto');
  assert(comment.targetId === 'rnd-sala-01', 'Vinculado ao targetId correto');
  assert(comment.position.x === 45.0, 'Suporte arquitetural a coordenada X');
  assert(comment.position.y === 70.0, 'Suporte arquitetural a coordenada Y');

  // 6.4 Resposta em Thread (reply)
  const reply = StudioState.replyClientComment(comment.id, {
    text: 'Obrigado Pedro! Optamos pelo Carvalho Americano natural.',
    authorName: 'Eduardo Marques',
    authorRole: 'architect'
  });
  assert(!!reply.id, 'Resposta criada com sucesso');
  assert(reply.parentId === comment.id, 'Resposta vinculada ao comentário pai via parentId');
  assert(comment.status === 'replied', 'Comentário pai atualizado para status replied');

  // 6.5 Resolver e Reabrir Comentário
  const resolved = StudioState.resolveClientComment(comment.id, 'Eduardo Marques');
  assert(resolved.status === 'resolved', 'Comentário resolvido com sucesso');
  assert(!!resolved.resolvedAt, 'Data de resolução gravada');
  assert(resolved.resolvedBy === 'Eduardo Marques', 'Responsável pela resolução gravado');

  const reopened = StudioState.reopenClientComment(comment.id, 'Pedro Albuquerque');
  assert(reopened.status === 'reopened', 'Comentário reaberto com sucesso');
  assert(reopened.resolvedAt === null, 'resolvedAt resetado após reabertura');

  // 6.6 Histórico e Consulta por Alvo
  const targetComments = StudioState.getClientCommentsByTarget(projectId, 'Imagem', 'rnd-sala-01');
  assert(targetComments.length >= 2, 'Histórico completo preservado (comentário e resposta)');

  // ============================================================================
  // H12: SOLICITAÇÃO FORMAL DE ALTERAÇÃO (ChangeRequest)
  // ============================================================================
  console.log('\n--- 7. H12: Sistema Formal de Solicitação de Alteração (ChangeRequest) ---');

  // 7.1 Prioridades Canônicas
  const crPriorities = StudioState.CHANGE_REQUEST_PRIORITY;
  assert(crPriorities.BAIXA === 'baixa', 'Prioridade baixa definida');
  assert(crPriorities.NORMAL === 'normal', 'Prioridade normal definida');
  assert(crPriorities.ALTA === 'alta', 'Prioridade alta definida');

  // 7.2 Status Canônicos de ChangeRequest
  const crStatuses = StudioState.CHANGE_REQUEST_STATUS;
  assert(crStatuses.ENVIADA === 'enviada', 'Status enviada definido');
  assert(crStatuses.RECEBIDA === 'recebida', 'Status recebida definido');
  assert(crStatuses.EM_ANALISE === 'em análise', 'Status em análise definido');
  assert(crStatuses.ACEITA === 'aceita', 'Status aceita definido');
  assert(crStatuses.REJEITADA === 'rejeitada', 'Status rejeitada definido');
  assert(crStatuses.EM_PRODUCAO === 'em produção', 'Status em produção definido');
  assert(crStatuses.CONCLUIDA === 'concluída', 'Status concluída definido');
  assert(crStatuses.ENCERRADA === 'encerrada', 'Status encerrada definido');

  // 7.3 Criação de Solicitação Formal pelo Cliente
  const crRes = StudioState.createChangeRequest({
    projectId,
    clientId,
    portalId,
    targetType: 'Ambiente',
    targetId: 'amb-sala-01',
    description: 'Solicitamos avaliar a ampliação da porta de correr em vidro para 4 folhas em vez de 3.',
    priority: 'alta',
    submitterName: 'Pedro Albuquerque'
  });

  assert(crRes.success === true, 'Solicitação formal criada com sucesso');
  assert(crRes.message === 'Solicitação recebida. A alteração será analisada pela equipe.', 'MENSAGEM OBRIGATÓRIA: "Solicitação recebida. A alteração será analisada pela equipe."');
  
  const cr = crRes.changeRequest;
  assert(!!cr.id, 'ChangeRequest possui ID exclusivo');
  assert(cr.status === 'enviada', 'Status inicial é enviada');
  assert(cr.priority === 'alta', 'Prioridade alta registrada');
  assert(cr.description.includes('porta de correr'), 'Descrição registrada com exatidão');

  // 7.4 Workflow do Arquiteto: Em Análise e Aceitação
  const inAnalysisCr = StudioState.updateChangeRequestStatus(cr.id, 'em análise', 'Verificando interferência estrutural com o pilar P3.', 'Arquiteto');
  assert(inAnalysisCr.status === 'em análise', 'Status atualizado para em análise');
  assert(inAnalysisCr.architectNotes.includes('pilar P3'), 'Notas técnicas do arquiteto registradas');

  const acceptedCr = StudioState.updateChangeRequestStatus(cr.id, 'aceita', 'Viabilidade técnica confirmada. Será incorporada na nova revisão.', 'Arquiteto');
  assert(acceptedCr.status === 'aceita', 'Status atualizado para aceita');

  // 7.5 Vínculo Obrigatório com Nova Revisão de Projeto
  const linkedCr = StudioState.linkChangeRequestToRevision(cr.id, 'REV02', 'Arquiteto');
  assert(linkedCr.linkedRevisionId === 'REV02', 'Solicitação aceita vinculada com sucesso à Revisão de Projeto REV02');

  // 7.6 Listagem de Solicitações do Projeto
  const projectCrs = StudioState.getChangeRequests(projectId);
  assert(projectCrs.length >= 2, 'Histórico de solicitações formais catalogado');

} catch (err) {
  console.error('Erro na execução dos testes H06 a H12:', err);
  failedTests++;
}

console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${passedTests + failedTests}`);
console.log(`PASSOU:         ${passedTests}`);
console.log(`FALHOU:         ${failedTests}`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('✔ TODOS OS TESTES DOS BLOCOS H06 A H12 PASSARAM COM 100% DE SUCESSO!\n');
  process.exit(0);
} else {
  console.error('✖ HOUVE FALHAS NOS TESTES DOS BLOCOS H06 A H12.\n');
  process.exit(1);
}
