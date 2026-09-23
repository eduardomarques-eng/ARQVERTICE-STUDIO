# ARQVERTICE STUDIO
## BLOCO 00 — INTRODUÇÃO, CONTEXTO, PAPEL DA IDE E REGRAS MESTRAS

Você está trabalhando no desenvolvimento completo do sistema interno da
ARQVERTICE ARQUITETURA E INTERIORES.

Este projeto NÃO deve ser tratado como uma aplicação nova construída do zero
sem considerar o que já existe.

Existe uma aplicação funcional já desenvolvida para gerenciamento de
cronograma e acompanhamento de projetos, hospedada no GitHub e implantada
na Vercel. Ela será a base operacional a ser preservada, analisada,
modernizada e ampliada.

======================================================================
1. FONTES PRIMÁRIAS DO PROJETO
======================================================================

Repositório principal atual:

https://github.com/eduardomarques-eng/cronograma-residencia-praia.git

Aplicação atualmente publicada:

https://cronograma-residencia-praia-mlym.vercel.app/

Existe também uma aplicação separada de briefing da ArqVertice.
O endereço exato dela será fornecido nos arquivos de contexto deste projeto
quando disponível.

IMPORTANTE:

Os arquivos locais presentes nesta pasta, os repositórios indicados e os
materiais de referência posteriormente adicionados pelo proprietário do
projeto são fontes primárias.

Não invente estruturas que não foram observadas.

Não substitua automaticamente uma funcionalidade existente por outra apenas
porque a segunda parece tecnicamente mais moderna.

Primeiro compreenda.
Depois documente.
Depois proponha.
Depois implemente.

======================================================================
2. AUTORIZAÇÃO PARA TRABALHAR NO REPOSITÓRIO
======================================================================

Você está autorizado a:

- inspecionar todo o código;
- editar arquivos;
- criar arquivos;
- reorganizar módulos;
- criar novas estruturas;
- alterar banco de dados;
- criar APIs;
- melhorar frontend;
- corrigir bugs;
- modernizar a arquitetura;
- integrar funcionalidades;
- preparar o projeto para produção;
- executar testes;
- executar build;
- corrigir problemas encontrados;
- preparar o deploy na Vercel.

Porém:

NÃO apague funcionalidades existentes simplesmente para simplificar o
código.

NÃO exclua arquivos antigos antes de identificar sua função.

NÃO substitua código sem compreender suas dependências.

NÃO faça uma grande reescrita sem antes registrar o que foi encontrado.

NÃO altere produção de forma destrutiva.

NÃO exponha secrets, tokens, senhas ou DATABASE_URL no código.

NÃO coloque chaves de API no frontend.

======================================================================
3. OBJETIVO GERAL
======================================================================

Transformar a aplicação atual em uma plataforma completa da
ARQVERTICE ARQUITETURA E INTERIORES para:

CLIENTE
→ BRIEFING
→ ANÁLISE
→ ESTUDOS
→ PROJETO
→ AMBIENTES
→ VISUALIZAÇÃO
→ MATERIAIS
→ MÓVEIS
→ MOODBOARDS
→ APRESENTAÇÃO
→ REVISÕES
→ RELATÓRIOS
→ ENTREGA
→ CRONOGRAMA
→ ACOMPANHAMENTO

O sistema deverá servir como núcleo de gerenciamento e apresentação dos
projetos da ArqVertice.

======================================================================
4. PAPEL DO REVIT
======================================================================

O Revit continuará sendo o ambiente principal para:

- modelagem arquitetônica;
- desenvolvimento técnico;
- detalhamento;
- documentação arquitetônica;
- elaboração das plantas técnicas;
- cortes;
- fachadas;
- elevações;
- informações construtivas;
- projeto técnico completo.

A aplicação NÃO deve tentar substituir o Revit.

A aplicação receberá materiais provenientes do Revit, como:

- plantas;
- perspectivas;
- vistas;
- elevações;
- cortes;
- imagens;
- arquivos de apoio;
- referências.

A aplicação será responsável principalmente pela interpretação,
organização, apresentação, visualização, ambientação e documentação
complementar.

======================================================================
5. FOCO CENTRAL DA VISUALIZAÇÃO
======================================================================

O usuário poderá trabalhar ambiente por ambiente.

Exemplo:

PROJETO
└── Residência Pedro
    ├── Sala
    ├── Cozinha
    ├── Suíte
    ├── Banheiro
    ├── Área Gourmet
    └── Deck

Cada ambiente deve possuir contexto próprio.

Cada ambiente pode possuir:

- planta;
- perspectivas;
- vistas;
- referências;
- materiais;
- mobiliário;
- câmeras;
- renders;
- versões;
- aprovações;
- observações;
- locks;
- decisões.

A IA deve compreender o ambiente dentro do projeto e não tratar uma imagem
isolada como se fosse o projeto inteiro.

======================================================================
6. MEMÓRIA E CONSISTÊNCIA
======================================================================

A memória do sistema é um dos requisitos centrais.

A inteligência deverá trabalhar com:

MEMÓRIA DO PROJETO
MEMÓRIA DO AMBIENTE
MEMÓRIA DA IMAGEM
MEMÓRIA DA VERSÃO
MEMÓRIA DAS DECISÕES
MEMÓRIA DOS ELEMENTOS BLOQUEADOS

A cada nova geração, o contexto relevante deverá ser recuperado.

A IA deve preservar, quando não solicitado o contrário:

- geometria;
- layout;
- proporções;
- aberturas;
- materiais;
- cores;
- iluminação;
- mobiliário;
- decoração;
- paisagismo;
- composição;
- estilo;
- identidade visual do projeto.

Exemplo:

Se o usuário disser:

"Troque somente o sofá."

o sistema deve interpretar que todo o restante deverá permanecer
inalterado, salvo impossibilidade técnica do modelo utilizado.

======================================================================
7. RENDERS E PERSPECTIVAS
======================================================================

A aplicação deverá permitir a criação de imagens a partir das referências
do Revit.

Objetivos principais:

- planta humanizada de apresentação;
- perspectiva humanizada;
- ambientação;
- renderização;
- estudo visual;
- apresentação profissional;
- múltiplas câmeras;
- diferentes enquadramentos;
- consistência entre imagens do mesmo ambiente;
- consistência entre ambientes do mesmo projeto.

A IA NÃO deverá tratar uma nova geração como um novo projeto sem contexto.

======================================================================
8. PLANTA HUMANIZADA
======================================================================

A planta humanizada é uma peça de apresentação visual.

Ela pode receber:

- cores;
- materiais;
- sombras;
- mobiliário;
- decoração;
- vegetação;
- ambientação;
- acabamento visual.

Porém:

A planta técnica original continuará vindo do Revit.

A aplicação não deverá assumir que uma imagem gerada por IA substitui uma
planta técnica ou um desenho CAD/BIM.

======================================================================
9. BRIEFING DO CLIENTE
======================================================================

O sistema deverá possuir um briefing público que possa ser enviado ao
cliente através de um link privado/único.

Fluxo:

ARQVERTICE cria briefing
→ sistema gera link
→ cliente acessa
→ cliente responde
→ cliente envia
→ dados entram no projeto
→ ArqVertice recebe
→ sistema consolida
→ ArqVertice revisa
→ gera relatório
→ relatório é enviado ao cliente
→ cliente confirma ou solicita alteração
→ briefing é aprovado
→ projeto segue.

O cliente NÃO deve receber acesso à área administrativa interna.

======================================================================
10. BRIEFING INTERNO
======================================================================

Depois do briefing do cliente existir, haverá um briefing técnico interno
para a ArqVertice.

Esse briefing deve transformar as informações do cliente em uma estrutura
de trabalho para:

- arquitetura;
- interiores;
- estudos;
- visualização;
- materiais;
- móveis;
- apresentação;
- acompanhamento.

======================================================================
11. ESTUDOS E PROJETO
======================================================================

O sistema deverá suportar acompanhamento das etapas de desenvolvimento:

- briefing;
- levantamento;
- estudos preliminares;
- conceito;
- projeto;
- visualização;
- apresentação;
- revisão;
- documentação;
- entrega.

O conteúdo técnico continuará sendo desenvolvido nas ferramentas
profissionais apropriadas, principalmente no Revit.

======================================================================
12. MATERIAIS E MÓVEIS
======================================================================

O sistema deverá posteriormente possuir:

BIBLIOTECA DE MÓVEIS
BIBLIOTECA DE MATERIAIS
FORNECEDORES
PRODUTOS
CÓDIGOS
LINKS
IMAGENS
MEDIDAS
QUANTIDADES
OBSERVAÇÕES

Os dados deverão ser vinculados aos ambientes e aos projetos.

Quantitativos estimados pela IA devem ser claramente diferenciados de
quantitativos derivados de dados reais fornecidos pelo usuário.

======================================================================
13. MOODBOARD
======================================================================

O moodboard deverá funcionar como peça visual e também como ficha técnica.

Pode conter:

- imagem;
- material;
- móvel;
- produto;
- fabricante;
- fornecedor;
- código;
- acabamento;
- cor;
- quantidade;
- observação;
- link;
- ambiente relacionado.

======================================================================
14. APRESENTAÇÃO
======================================================================

O sistema deverá posteriormente permitir a criação de apresentações e
pranchas.

Formatos:

- A4;
- A3;
- A2;
- A1.

Orientações:

- retrato;
- paisagem.

Elementos:

- logo ArqVertice;
- carimbo;
- projeto;
- cliente;
- ambiente;
- título;
- data;
- revisão;
- escala;
- imagens;
- plantas;
- perspectivas;
- moodboards;
- informações técnicas.

======================================================================
15. CRONOGRAMA EXISTENTE
======================================================================

Não recrie o cronograma atual sem necessidade.

O cronograma existente deverá tornar-se um módulo integrado ao projeto.

As funcionalidades existentes precisam ser preservadas e melhoradas.

O novo sistema deverá permitir no futuro que eventos do projeto influenciem
o cronograma.

Exemplos:

- briefing aprovado;
- estudo preliminar aprovado;
- projeto iniciado;
- render aprovado;
- apresentação concluída;
- revisão aberta;
- entrega concluída.

======================================================================
16. FINALIZAÇÃO E VÍDEO
======================================================================

Quando o usuário finalizar um projeto, deverá existir posteriormente uma
ação equivalente a:

"FINALIZAR PROJETO"

Isso deverá criar uma versão final consolidada.

A partir dessa versão, o sistema poderá gerar:

- seleção de imagens finais;
- sequência de apresentação;
- storyboard;
- roteiro;
- ordem de cenas;
- movimentos;
- transições;
- textos;
- informações de ambiente;
- prompts para ferramentas externas de geração de vídeo.

A aplicação não precisa ficar presa a um único provedor de vídeo.

======================================================================
17. IA
======================================================================

A inteligência artificial não deverá receber apenas um prompt bruto.

Fluxo esperado:

ENTRADA DO USUÁRIO
→ CONTEXTO DO PROJETO
→ CONTEXTO DO AMBIENTE
→ REFERÊNCIAS
→ MEMÓRIA
→ LOCKS
→ DECISÕES
→ COMPILAÇÃO DA INTENÇÃO
→ MODELO DE IA
→ RESULTADO
→ REGISTRO
→ NOVA VERSÃO

A camada de inteligência deverá ser independente do provedor de IA sempre
que tecnicamente viável.

Gemini poderá ser utilizado inicialmente, mas a arquitetura não deve
ficar estruturalmente dependente de um único fornecedor.

======================================================================
18. FRAMEWORK E TECNOLOGIA
======================================================================

NÃO assuma automaticamente que o framework atual deverá permanecer.

NÃO migre automaticamente somente porque outra tecnologia é mais moderna.

Primeiro faça auditoria técnica.

Depois avalie:

- complexidade futura;
- manutenção;
- desempenho;
- segurança;
- armazenamento;
- autenticação;
- banco;
- upload;
- IA;
- versionamento;
- escalabilidade;
- experiência do usuário;
- compatibilidade com Vercel;
- custo;
- produtividade na Antigravity.

Somente então escolha a arquitetura.

Como direção inicial para avaliação, considere uma arquitetura moderna
full-stack baseada em React/TypeScript/Next.js, PostgreSQL e armazenamento
externo apropriado, mas esta NÃO é uma decisão irrevogável antes da
auditoria.

======================================================================
19. PADRÃO DE DESENVOLVIMENTO
======================================================================

Prioridades:

1. preservar;
2. compreender;
3. estruturar;
4. testar;
5. melhorar;
6. integrar;
7. otimizar.

Não produzir código desnecessário.

Não criar abstrações apenas por estética.

Não criar dezenas de componentes ou serviços sem necessidade real.

Evitar duplicação.

Centralizar regras de negócio.

Separar claramente:

- apresentação;
- domínio;
- persistência;
- integrações;
- IA;
- arquivos;
- relatórios;
- cronograma.

======================================================================
20. QUALIDADE
======================================================================

Toda implementação deverá considerar:

- TypeScript quando aplicável;
- validação de dados;
- tratamento de erros;
- logs adequados;
- segurança;
- testes;
- responsividade;
- acessibilidade;
- performance;
- persistência;
- recuperação após erro;
- versionamento;
- documentação.

Não considerar uma tarefa concluída apenas porque "a tela abriu".

A implementação deverá ser validada funcionalmente.

======================================================================
21. INTERFACE
======================================================================

A aplicação deve manter identidade profissional da ArqVertice.

Deve ser:

- moderna;
- limpa;
- intuitiva;
- profissional;
- responsiva;
- visualmente coerente;
- rápida;
- confortável para uso diário.

Não transformar o aplicativo em um painel excessivamente complexo.

As informações devem ser organizadas por contexto.

======================================================================
22. PRINCÍPIO DE NÃO-PERDA
======================================================================

Durante todo o projeto:

NADA será descartado simplesmente porque parece antigo.

Antes de substituir:

1. identifique;
2. documente;
3. confirme dependências;
4. implemente substituto;
5. teste;
6. compare;
7. só então arquive.

Preserve histórico Git.

Não reescreva histórico.

Não apague dados de produção.

======================================================================
23. EXECUÇÃO POR BLOCOS
======================================================================

Você receberá prompts em blocos.

Não implemente fases futuras antecipadamente.

Quando um prompt disser:

"somente auditoria"

faça somente auditoria.

Quando disser:

"implementar"

implemente o escopo indicado.

Não invente funcionalidades adicionais para antecipar etapas.

Caso uma implementação presente exija uma decisão ainda não definida,
registre a dependência e siga apenas até o limite seguro.

======================================================================
24. RELATÓRIO DE CADA EXECUÇÃO
======================================================================

Ao terminar cada prompt, produza um relatório objetivo contendo:

- o que foi analisado;
- o que foi alterado;
- arquivos criados;
- arquivos modificados;
- banco alterado;
- APIs alteradas;
- dependências adicionadas;
- testes realizados;
- testes pendentes;
- problemas encontrados;
- decisões tomadas;
- decisões ainda necessárias;
- riscos;
- próximo passo recomendado.

======================================================================
25. REGRA FINAL
======================================================================

O objetivo não é criar "muita tecnologia".

O objetivo é construir uma ferramenta realmente utilizável pela
ArqVertice para conduzir projetos completos, desde a entrada do cliente até
a apresentação e acompanhamento final.

Priorize confiabilidade, consistência, memória, organização, velocidade de
trabalho e qualidade de apresentação.

Antes de qualquer grande alteração estrutural, consulte os arquivos de
contexto existentes nesta pasta e o estado real do repositório.

FIM DO BLOCO 00.
