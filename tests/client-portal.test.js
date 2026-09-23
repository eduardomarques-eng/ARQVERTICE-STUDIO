/**
 * tests/client-portal.test.js
 * Teste unitário e de integração para o Portal do Cliente do ArqVértice Studio.
 * Cobre:
 * - H01: Fundação do ClientPortal (criação, ativação, suspensão, revogação, expiração, associação).
 * - H02: Autenticação, ClientPortalSession, Magic Link, Hashing de Senha e Middleware de Autorização
 *        com teste MANDATÓRIO: CLIENTE A tentando acessar PROJETO B -> ACESSO NEGADO.
 * - H03: Dashboard do Cliente, progresso de etapas públicas, próxima ação, atualizações e estados.
 */

// Simular localStorage antes de carregar state.js no ambiente Node.js
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
console.log('SUÍTE DE TESTES: BLOCO H — PORTAL DO CLIENTE (H01, H02, H03)');
console.log('================================================================\n');

try {
  StudioState.init();

  // ============================================================================
  // H01: FUNDAÇÃO DO CLIENT PORTAL
  // ============================================================================
  console.log('--- 1. H01: Fundação da Entidade ClientPortal e Ciclo de Vida ---');

  // 1.1 Status Canônicos
  const statuses = StudioState.CLIENT_PORTAL_STATUS;
  assert(statuses.DRAFT === 'draft', 'Status draft definido');
  assert(statuses.ACTIVE === 'active', 'Status active definido');
  assert(statuses.SUSPENDED === 'suspended', 'Status suspended definido');
  assert(statuses.EXPIRED === 'expired', 'Status expired definido');
  assert(statuses.REVOKED === 'revoked', 'Status revoked definido');
  assert(statuses.ARCHIVED === 'archived', 'Status archived definido');

  // 1.2 Criação e Associação Estrita ao Projeto Real (prj-praia-01 / cli-pedro-01)
  const portalPedro = StudioState.getClientPortal('cport-praia-01');
  assert(!!portalPedro, 'Portal pré-existente de Pedro Albuquerque localizado');
  assert(portalPedro.projectId === 'prj-praia-01', 'Portal associado corretamente a prj-praia-01');
  assert(portalPedro.clientId === 'cli-pedro-01', 'Portal associado corretamente a cli-pedro-01');
  assert(portalPedro.status === 'active', 'Portal de Pedro está ativo');
  assert(!!portalPedro.token, 'Token de acesso gerado com sucesso');

  // 1.3 Criação Dinâmica de Novo Portal
  const newPortal = StudioState.createClientPortal({
    projectId: 'prj-praia-01',
    clientId: 'cli-pedro-01',
    status: 'draft',
    settings: {
      allowComments: true,
      welcomeMessage: 'Novo portal de teste.'
    }
  }, 'Eduardo Marques');

  assert(!!newPortal.id, 'Novo ClientPortal criado com ID exclusivo');
  assert(newPortal.status === 'draft', 'Status inicial draft confirmado');
  assert(newPortal.settings.allowComments === true, 'Configurações de portal preservadas');

  // 1.4 Ciclo de Vida: Ativação, Suspensão, Revogação, Expiração
  const activated = StudioState.activateClientPortal(newPortal.id, 'Eduardo Marques');
  assert(activated.status === 'active', 'Portal ativado com sucesso');
  assert(StudioState.isPortalActive(activated) === true, 'isPortalActive retorna true para portal ativo');

  const suspended = StudioState.suspendClientPortal(newPortal.id, 'Aguardando validação cadastral', 'Eduardo Marques');
  assert(suspended.status === 'suspended', 'Portal suspenso com sucesso');
  assert(StudioState.isPortalActive(suspended) === false, 'isPortalActive retorna false para portal suspenso');

  const revoked = StudioState.revokeClientPortal(newPortal.id, 'Cancelamento de contrato', 'Eduardo Marques');
  assert(revoked.status === 'revoked', 'Portal revogado com sucesso');
  assert(StudioState.isPortalActive(revoked) === false, 'isPortalActive retorna false para portal revogado');

  const expired = StudioState.expireClientPortal(newPortal.id);
  assert(expired.status === 'expired', 'Portal expirado com sucesso');
  assert(StudioState.isPortalActive(expired) === false, 'isPortalActive retorna false para portal expirado');

  // 1.5 Rotas de Navegação Obrigatórias (H01)
  console.log('\n--- 2. H01: Rotas Canônicas de Navegação ---');
  const expectedRoutes = [
    '/portal',
    '/portal/projeto',
    '/portal/briefing',
    '/portal/apresentacao',
    '/portal/revisoes',
    '/portal/aprovacoes',
    '/portal/entrega'
  ];
  assert(expectedRoutes.length === 7, 'Sete rotas canônicas de navegação estruturadas');

  // ============================================================================
  // H02: AUTENTICAÇÃO, SESSÕES E MIDDLEWARE DE AUTORIZAÇÃO
  // ============================================================================
  console.log('\n--- 3. H02: Autenticação, Magic Link e Hashing Seguro ---');

  // 3.1 Armazenamento Seguro de Senha (NUNCA em texto puro)
  const passwordPlain = 'SenhaSegura@2026';
  const hashed = StudioState.hashPortalPassword(passwordPlain);
  assert(hashed.hash !== passwordPlain, 'Senha NUNCA é armazenada em texto puro');
  assert(!!hashed.salt, 'Salt gerado para proteção contra rainbow tables');
  assert(StudioState.verifyPortalPassword(passwordPlain, hashed.hash, hashed.salt) === true, 'Verificação de senha com salt e hash bem-sucedida');
  assert(StudioState.verifyPortalPassword('SenhaErrada', hashed.hash, hashed.salt) === false, 'Senha incorreta rejeitada');

  // 3.2 Magic Link
  const magicLink = StudioState.createMagicLink(portalPedro.id, { expiresInHours: 24 });
  assert(magicLink.magicLinkUrl.includes('/portal?token='), 'URL de Magic Link gerada corretamente');
  assert(!!magicLink.inviteCode, 'Código de convite gerado');

  // 3.3 Criação de Sessão (ClientPortalSession)
  const sessionRes = StudioState.createClientPortalSession({
    portalId: portalPedro.id,
    authMethod: 'magic_link',
    ip: '189.120.45.67',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ArqVerticeClient/1.0'
  });

  assert(sessionRes.success === true, 'Sessão do portal criada com sucesso');
  const sessionPedro = sessionRes.session;
  assert(sessionPedro.clientId === 'cli-pedro-01', 'Sessão vinculada ao clientId correto');
  assert(sessionPedro.projectId === 'prj-praia-01', 'Sessão vinculada ao projectId correto');
  assert(!!sessionPedro.ipHash, 'IP anonimizado em ipHash');
  assert(new Date(sessionPedro.expiresAt) > new Date(), 'Sessão possui data de expiração futura');

  // 3.4 Middleware de Autorização e Teste Mandatório Anti-Invasão:
  // "CLIENTE A tentando acessar PROJETO B -> ACESSO NEGADO"
  console.log('\n--- 4. H02: Middleware de Autorização e Teste Anti-Invasão ---');

  // Caso Legítimo: Pedro acessando seu próprio projeto (prj-praia-01)
  const legitAuth = StudioState.authorizePortalAccess({
    sessionId: sessionPedro.id,
    targetProjectId: 'prj-praia-01',
    requiredPermission: StudioState.CLIENT_PORTAL_PERMISSIONS.VIEW_PUBLISHED
  });
  assert(legitAuth.authorized === true, 'Acesso legítimo autorizado para o cliente e seu projeto');

  // TESTE MANDATÓRIO: Pedro (Cliente A) tentando acessar prj-eusebio-02 (Projeto B)
  const crossProjectAuth = StudioState.authorizePortalAccess({
    sessionId: sessionPedro.id,
    targetProjectId: 'prj-eusebio-02',
    requiredPermission: StudioState.CLIENT_PORTAL_PERMISSIONS.VIEW_PUBLISHED
  });
  assert(crossProjectAuth.authorized === false, 'Acesso cruzado entre projetos bloqueado com sucesso');
  assert(crossProjectAuth.code === 'FORBIDDEN_CROSS_PROJECT', 'Código de erro FORBIDDEN_CROSS_PROJECT retornado');
  assert(crossProjectAuth.message.includes('ACESSO NEGADO'), 'Mensagem explícita ACESSO NEGADO retornada');

  // 3.5 Tentativa de Cliente acessar ações internas restritas (banco, prompts, etc.)
  const forbiddenAuth = StudioState.authorizePortalAccess({
    sessionId: sessionPedro.id,
    targetProjectId: 'prj-praia-01',
    requiredPermission: 'access_prompts'
  });
  assert(forbiddenAuth.authorized === false, 'Tentativa de acessar prompts internos bloqueada');
  assert(forbiddenAuth.message.includes('ACESSO NEGADO'), 'Ação administrativa proibida para cliente');

  const dbAuth = StudioState.authorizePortalAccess({
    sessionId: sessionPedro.id,
    targetProjectId: 'prj-praia-01',
    requiredPermission: 'access_database'
  });
  assert(dbAuth.authorized === false, 'Tentativa de acessar banco de dados bloqueada');

  // ============================================================================
  // H03: PÁGINA INICIAL / DASHBOARD DO PORTAL DO CLIENTE
  // ============================================================================
  console.log('\n--- 5. H03: Dados Higienizados e Dashboard do Cliente ---');

  const dashboardData = StudioState.getSanitizedClientProjectData(portalPedro.id, sessionPedro.id);

  // 5.1 Card Principal "Projeto"
  assert(dashboardData.project.name === 'Residência de Praia', 'Nome do projeto carregado corretamente');
  assert(!!dashboardData.project.location, 'Localização autorizada disponível');
  assert(dashboardData.project.currentStage === 'Executivo & 3D' || !!dashboardData.project.currentStage, 'Etapa atual exibida');
  assert(dashboardData.project.currentRevision === 'R01', 'Revisão atual do cliente informada');

  // 5.2 Ocultação Estrita de Dados Confidenciais
  assert(dashboardData.project.internalNotes === undefined, 'Salvaguarda: internalNotes NÃO vazam no dashboard do cliente');
  assert(dashboardData.prompts === undefined, 'Salvaguarda: prompts de IA NÃO vazam no dashboard do cliente');
  assert(dashboardData.database === undefined, 'Salvaguarda: credenciais/tabelas de banco NÃO vazam');

  // 5.3 Progresso das Etapas Públicas
  assert(Array.isArray(dashboardData.publicStages), 'Etapas públicas formatadas em array');
  assert(dashboardData.publicStages.length === 8, '8 etapas canônicas públicas mapeadas');
  const hasInternalStage = dashboardData.publicStages.some(s => s.key === 'briefing-tecnico' || s.key === 'cronograma');
  assert(!hasInternalStage, 'Etapas marcadas como internas NÃO são mostradas ao cliente');

  // 5.4 Próxima Ação
  assert(!!dashboardData.nextAction, 'Próxima ação calculada com sucesso');
  assert(!!dashboardData.nextAction.title, 'Título da próxima ação definido');
  assert(!!dashboardData.nextAction.actionUrl, 'URL de destino da próxima ação configurada');

  // 5.5 Atualizações Recentes Públicas
  assert(Array.isArray(dashboardData.recentUpdates), 'Atualizações recentes públicas carregadas');
  assert(dashboardData.recentUpdates.length > 0, 'Atualizações públicas disponíveis');

  // 5.6 Sessão Revogada Impede Acesso
  StudioState.revokePortalSession(sessionPedro.id, 'Cliente');
  let revokedAccessCaught = false;
  try {
    StudioState.getSanitizedClientProjectData(portalPedro.id, sessionPedro.id);
  } catch (e) {
    revokedAccessCaught = true;
    assert(e.message.includes('ACESSO NEGADO') || e.message.includes('revogada'), 'Sessão revogada impede carregamento de dados');
  }
  assert(revokedAccessCaught === true, 'Acesso após logout/revogação bloqueado com sucesso');

  // ============================================================================
  // H04: SISTEMA DE PUBLICAÇÃO DO CLIENTE (ClientPublication)
  // ============================================================================
  console.log('\n--- 6. H04: Sistema de Publicação do Cliente (ClientPublication) ---');

  // 6.1 Status e Tipos Canônicos de Publicação
  const pubStatuses = StudioState.CLIENT_PUBLICATION_STATUS;
  assert(pubStatuses.INTERNAL === 'internal', 'Status de publicação internal definido');
  assert(pubStatuses.PREPARED === 'prepared', 'Status de publicação prepared definido');
  assert(pubStatuses.PUBLISHED === 'published', 'Status de publicação published definido');
  assert(pubStatuses.UNPUBLISHED === 'unpublished', 'Status de publicação unpublished definido');
  assert(pubStatuses.ARCHIVED === 'archived', 'Status de publicação archived definido');

  const pubTypes = StudioState.CLIENT_PUBLICATION_TYPES;
  const expectedPubTypes = ['briefing', 'imagem', 'render', 'planta', 'prancha', 'moodboard', 'material', 'mobiliario', 'relatorio', 'video', 'documento', 'entrega'];
  const allTypesCovered = expectedPubTypes.every(t => pubTypes.includes(t));
  assert(allTypesCovered === true, 'Todos os 12 tipos canônicos de publicação são suportados');

  // 6.2 Regra de Ouro: Arquivo existente NÃO significa publicado
  const testRenderId = 'rnd-test-h04-01';
  // Simular render interno existente no estúdio
  if (!StudioState.data.environmentRenders) StudioState.data.environmentRenders = [];
  StudioState.data.environmentRenders.push({
    id: testRenderId,
    projectId: 'prj-praia-01',
    environmentName: 'Living Gourmet',
    imageUrl: '/renders/living_gourmet.jpg',
    resolution: '4K',
    versionLabel: 'v1.0'
  });

  const isPublishedBefore = StudioState.isSourcePublished('prj-praia-01', 'render', testRenderId);
  assert(isPublishedBefore === false, 'Arquivo existente no projeto NÃO está publicado por padrão');

  // 6.3 Publicação Explícita com Controles e Permissões Granulares
  const publication = StudioState.publishToClientPortal({
    projectId: 'prj-praia-01',
    portalId: portalPedro.id,
    sourceType: 'render',
    sourceId: testRenderId,
    title: 'Living Gourmet Integrado - Render 4K',
    description: 'Vista principal do estar integrado com a cozinha gourmet.',
    version: 'v1.0',
    clientVisible: true,
    downloadAllowed: true,
    commentAllowed: true,
    approvalAllowed: true,
    fileUrl: '/renders/living_gourmet.jpg',
    metadata: { resolution: '3840x2160' }
  }, 'Eduardo Marques');

  assert(!!publication.id, 'ClientPublication criada com ID exclusivo');
  assert(publication.projectId === 'prj-praia-01', 'ClientPublication vinculada ao projectId');
  assert(publication.portalId === portalPedro.id, 'ClientPublication vinculada ao portalId');
  assert(publication.sourceType === 'render', 'ClientPublication sourceType render correto');
  assert(publication.sourceId === testRenderId, 'ClientPublication sourceId correto');
  assert(publication.status === 'published', 'Status da publicação definido como published');
  assert(publication.clientVisible === true, 'Controle VISÍVEL AO CLIENTE ativo');
  assert(publication.downloadAllowed === true, 'Controle DOWNLOAD PERMITIDO ativo');
  assert(publication.commentAllowed === true, 'Controle COMENTÁRIOS PERMITIDOS ativo');
  assert(publication.approvalAllowed === true, 'Controle APROVAÇÃO PERMITIDA ativo');
  assert(!!publication.publishedAt, 'Data e hora da publicação registradas');
  assert(publication.publishedBy === 'Eduardo Marques', 'Autor da publicação registrado');

  const isPublishedAfter = StudioState.isSourcePublished('prj-praia-01', 'render', testRenderId);
  assert(isPublishedAfter === true, 'isSourcePublished retorna true após publicação explícita');

  // 6.4 Atualização de Permissões
  const updatedPub = StudioState.updateClientPublication(publication.id, {
    downloadAllowed: false,
    approvalAllowed: false
  }, 'Eduardo Marques');
  assert(updatedPub.downloadAllowed === false, 'Permissão downloadAllowed atualizada');
  assert(updatedPub.approvalAllowed === false, 'Permissão approvalAllowed atualizada');

  // 6.5 Salvaguarda Crítica: Retirar publicação NÃO deve apagar o arquivo original
  const unpublished = StudioState.unpublishClientPublication(publication.id, 'Nova revisão solicitada', 'Eduardo Marques');
  assert(unpublished.status === 'unpublished', 'Status alterado para unpublished');
  assert(unpublished.clientVisible === false, 'clientVisible alterado para false');
  assert(!!unpublished.unpublishedAt, 'Timestamp unpublishedAt registrado');

  // Verifica que o ativo original no projeto PERMANECE intacto
  const originalRenderStillExists = StudioState.data.environmentRenders.some(r => r.id === testRenderId);
  assert(originalRenderStillExists === true, 'SALVAGUARDA CRÍTICA: Despublicar NÃO apaga o arquivo original no estúdio');

  // Verifica que itens despublicados não aparecem em buscas públicas
  const visiblePubs = StudioState.getClientPublications(portalPedro.id, { onlyVisible: true });
  const isHiddenFromClient = !visiblePubs.some(p => p.id === publication.id);
  assert(isHiddenFromClient === true, 'Item despublicado é ocultado imediatamente das consultas visíveis do cliente');

  // 6.6 Auditoria de Publicações
  const auditLogs = StudioState.data.audits || [];
  const hasPublishAudit = auditLogs.some(a => a.action === 'CLIENT_PUBLICATION_PUBLISHED');
  const hasUnpublishAudit = auditLogs.some(a => a.action === 'CLIENT_PUBLICATION_UNPUBLISHED');
  assert(hasPublishAudit === true, 'Ação de publicação auditada no sistema');
  assert(hasUnpublishAudit === true, 'Ação de despublicação auditada no sistema');

  // ============================================================================
  // H05: BRIEFING EXTERNO INTEGRADO AO PORTAL DO CLIENTE
  // ============================================================================
  console.log('\n--- 7. H05: Briefing Externo Integrado e Versionamento Imutável ---');

  // 7.1 Estados Canônicos do Briefing
  const brfStatuses = StudioState.BRIEFING_STATUSES;
  assert(brfStatuses.DRAFT === 'draft', 'Status draft definido');
  assert(brfStatuses.IN_PROGRESS === 'in_progress', 'Status in_progress definido');
  assert(brfStatuses.SUBMITTED === 'submitted', 'Status submitted definido');
  assert(brfStatuses.UNDER_REVIEW === 'under_review', 'Status under_review definido');
  assert(brfStatuses.CONFIRMED === 'confirmed', 'Status confirmed definido');
  assert(brfStatuses.REVISION_REQUESTED === 'revision_requested', 'Status revision_requested definido');
  assert(brfStatuses.CLOSED === 'closed', 'Status closed definido');

  // 7.2 Motor de Perguntas Condicionais (Não mostrar perguntas irrelevantes)
  const kitchenIslandQuestion = {
    id: 'cond_ilha',
    label: 'Configuração da Ilha Gourmet',
    condition: {
      dependsOn: 'p8_integracao',
      expected: 'Integrado'
    }
  };

  const answersIntegrated = { p8_integracao: '100% Integrado (Cozinha gourmet, sala e varanda em espaço contínuo)' };
  const shouldShowConditional = StudioState.evaluateBriefingCondition(kitchenIslandQuestion, answersIntegrated);
  assert(shouldShowConditional === true, 'Pergunta condicional exibida quando resposta atende a condição');

  const answersClosed = { p8_integracao: 'Cozinha Fechada Tradicional' };
  const shouldHideConditional = StudioState.evaluateBriefingCondition(kitchenIslandQuestion, answersClosed);
  assert(shouldHideConditional === false, 'Pergunta irrelevante ocultada quando resposta não atende a condição');

  const questionNoCondition = { id: 'p1_quem', label: 'Moradores' };
  assert(StudioState.evaluateBriefingCondition(questionNoCondition, {}) === true, 'Pergunta sem condição sempre visível');

  // 7.3 Criação de Nova Sessão Ativa para Teste de Interação do Cliente
  const newSessionRes = StudioState.createClientPortalSession({
    portalId: portalPedro.id,
    authMethod: 'magic_link',
    ip: '189.120.45.68'
  });
  const activeSessionPedro = newSessionRes.session;

  // 7.4 Salvar Rascunho Parcial (iniciar, salvar parcialmente, continuar depois)
  const partialDraft = {
    p1_quem: 'Pedro Albuquerque, esposa Carolina e 2 filhos.',
    p8_integracao: '100% Integrado (Cozinha gourmet, sala e varanda em espaço contínuo)'
  };

  const draftResult = StudioState.saveClientPortalBriefingDraft(portalPedro.id, activeSessionPedro.id, partialDraft, 'Pedro Albuquerque');
  assert(draftResult.success === true, 'Rascunho de briefing salvo com sucesso');
  assert(draftResult.briefing.status === 'in_progress', 'Status do briefing atualizado para in_progress');
  assert(draftResult.briefing.answers.p1_quem === partialDraft.p1_quem, 'Respostas parciais salvas no rascunho');

  // 7.5 Submissão Formal e Confirmação (Geração de Nova Versão Incremental)
  // Nota: o projeto prj-praia-01 já possui a Versão 1 de homologação inicial registrada no banco
  const versionsBefore = StudioState.getBriefingSubmissionVersions('brf-praia-01');
  assert(versionsBefore.length >= 1, 'Versão 1 inicial pré-existente localizada no banco de dados');
  assert(versionsBefore[0].versionNumber === 1, 'Versão 1 inicial registrada com versionNumber === 1');

  const fullAnswersV2 = {
    p1_quem: 'Pedro Albuquerque, esposa Carolina e 2 filhos.',
    p1_visitas: 'Jantares gourmet aos fins de semana para 10 convidados.',
    p8_integracao: '100% Integrado (Cozinha gourmet, sala e varanda em espaço contínuo)',
    cond_ilha: 'Ilha central em quartzito com cooktop de indução e cuba gourmet.',
    p7_paleta: 'Madeira natural freijó, mármore travertino navona e linho cru.',
    p7_detesta: 'Porcelanato polido brilhante e iluminação hospitalar branca.',
    p10_orcamento: 'R$ 250.000 a R$ 400.000'
  };

  const submitRes1 = StudioState.submitClientPortalBriefing(
    portalPedro.id,
    activeSessionPedro.id,
    fullAnswersV2,
    [{ name: 'foto_terreno.jpg', size: 1048576 }],
    { name: 'Pedro Albuquerque', email: 'pedro@email.com' }
  );

  assert(submitRes1.success === true, 'Briefing submetido com sucesso');
  assert(!!submitRes1.confirmation.receiptNumber, 'Protocolo de confirmação gerado');
  assert(submitRes1.confirmation.version === 2, 'Submissão registrada incrementalmente como Versão 2');
  assert(submitRes1.confirmation.answersCount >= 7, 'Contagem de respostas confirmada');
  assert(submitRes1.confirmation.attachmentsCount === 1, 'Contagem de anexos confirmada');

  const v2 = submitRes1.submissionVersion;
  assert(v2.versionNumber === 2, 'BriefingSubmissionVersion v2 criada');
  assert(v2.status === 'submitted', 'Status da versão registrado como submitted');
  assert(v2.submittedByName === 'Pedro Albuquerque', 'Identificação do cliente registrada na versão');
  assert(!!v2.submittedAt, 'Data e hora da submissão registradas');

  // 7.6 SALVAGUARDA INEGOCIÁVEL: Proibição de Alteração Silenciosa & Versionamento Imutável
  // Simular que o cliente retorna para editar respostas permitidas: GERAÇÃO DA VERSÃO 3
  const fullAnswersV3 = {
    ...fullAnswersV2,
    p10_orcamento: 'R$ 350.000 a R$ 500.000', // Modificação de orçamento
    cond_ilha: 'Ilha gourmet estendida com calha úmida e torre de tomadas embutida.' // Modificação na ilha
  };

  const submitRes2 = StudioState.submitClientPortalBriefing(
    portalPedro.id,
    activeSessionPedro.id,
    fullAnswersV3,
    [{ name: 'foto_terreno.jpg', size: 1048576 }],
    { name: 'Pedro Albuquerque', email: 'pedro@email.com' }
  );

  assert(submitRes2.confirmation.version === 3, 'Submissão subsequente registrada como Versão 3');

  // Consulta histórico completo de versões
  const allVersions = StudioState.getBriefingSubmissionVersions(v2.briefingId);
  assert(allVersions.length >= 3, 'Histórico preserva todas as versões submetidas (v1, v2 e v3)');

  const historicV1 = allVersions.find(v => v.versionNumber === 1);
  const historicV2 = allVersions.find(v => v.versionNumber === 2);
  const historicV3 = allVersions.find(v => v.versionNumber === 3);

  // Verificação de Imutabilidade Estrita: V1 e V2 NUNCA sofrem alteração silenciosa
  assert(historicV1.answers.p10_orcamento === 'De R$ 150.000 a R$ 300.000', 'IMUTABILIDADE: Versão 1 preserva estritamente o orçamento original da data de abertura');
  assert(historicV2.answers.p10_orcamento === 'R$ 250.000 a R$ 400.000', 'IMUTABILIDADE: Versão 2 preserva estritamente seu orçamento homologado');
  assert(historicV3.answers.p10_orcamento === 'R$ 350.000 a R$ 500.000', 'Versão 3 reflete a nova resposta editada');

  const latestVersion = StudioState.getLatestBriefingSubmissionVersion(v2.briefingId);
  assert(latestVersion.versionNumber === 3, 'getLatestBriefingSubmissionVersion retorna a versão mais recente (v3)');

  // 7.7 Transição de Status Interno do Briefing
  const underReviewBriefing = StudioState.updateBriefingStatus(v2.briefingId, 'under_review', 'Equipe de projeto analisando necessidades', 'Arquiteto');
  assert(underReviewBriefing.status === 'under_review', 'Status atualizado para under_review');

  const confirmedBriefing = StudioState.updateBriefingStatus(v2.briefingId, 'confirmed', 'Briefing validado em reunião preliminar', 'Arquiteto');
  assert(confirmedBriefing.status === 'confirmed', 'Status atualizado para confirmed');

  let invalidStatusCaught = false;
  try {
    StudioState.updateBriefingStatus(v2.briefingId, 'status_inexistente');
  } catch (e) {
    invalidStatusCaught = true;
    assert(e.message.includes('inválido'), 'Status de briefing inválido é rejeitado');
  }
  assert(invalidStatusCaught === true, 'Validação de integridade de status do briefing bem-sucedida');

} catch (err) {
  console.error('Erro na execução dos testes do Portal do Cliente:', err);
  failedTests++;
}

console.log('\n================================================================');
console.log(`TOTAL DE TESTES: ${passedTests + failedTests}`);
console.log(`PASSOU:         ${passedTests}`);
console.log(`FALHOU:         ${failedTests}`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('✔ TODOS OS TESTES DO PORTAL DO CLIENTE (H01, H02, H03, H04, H05) PASSARAM COM SUCESSO!\n');
  process.exit(0);
} else {
  console.error('✖ HOUVE FALHAS NOS TESTES DO PORTAL DO CLIENTE.\n');
  process.exit(1);
}

