# REGISTRO DE DECISÕES DE ARQUITETURA (ADR)
## ARQVERTICE STUDIO — DECISÕES ESTRATÉGICAS FUNDAMENTADAS
**Status Geral:** Aprovado  
**Documento:** ARCHITECTURE_DECISIONS.md  

---

### ADR-001: Adoção do Next.js (App Router) e TypeScript como Plataforma Unificada
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** A auditoria (`docs/AUDITORIA_ATUAL.md`) revelou que o código atual em Vanilla JS possui acoplamento no DOM, ausência de tipagem e dificuldade para suportar rotas dinâmicas por ambiente, upload de arquivos pesados e chamadas seguras a modelos de IA.
- **Decisão:** Adotar **Next.js 15+ (App Router)** com **TypeScript** estrito como a plataforma full-stack unificada.
- **Consequências:**
  - *Positivas:* Elimina a separação entre front e back; tipagem de ponta a ponta; páginas públicas rápidas via SSR; segurança de credenciais e chaves de IA no servidor via Server Actions; excelente compatibilidade com a Vercel.
  - *Negativas:* Introduz etapa obrigatória de build e curva de aprendizado para a distinção entre Server Components e Client Components.

---

### ADR-002: Adoção do Drizzle ORM sobre PostgreSQL
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** O backend atual utiliza consultas SQL em strings puras via driver `pg`. Para suportar 22 domínios relacionais complexos com integridade referencial, faz-se necessário um mapeador de dados tipado, mantendo alta performance em ambiente serverless.
- **Decisão:** Adotar **Drizzle ORM** com suporte a migrations versionadas e tipagem estática inferida dos schemas SQL.
- **Consequências:**
  - *Positivas:* Zero overhead em runtime comparado ao Prisma (gera queries SQL diretas e leves); excelente inicialização a frio (cold start) em funções serverless; suporte nativo a colunas geradas e enums do PostgreSQL.
  - *Negativas:* Exige escrita declarativa do schema em TypeScript antes da geração de migrations.

---

### ADR-003: Separação Estrita entre Metadados (PostgreSQL) e Binários (Storage de Objetos)
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** Arquivos de arquitetura e engenharia (DWG, RVT, IFC, pranchas em alta resolução e renders 4K) variam de dezenas de megabytes a gigabytes. Armazenar binários no banco de dados esgotaria o disco e encareceria a infraestrutura rapidamente; trafegar esses arquivos pelas funções serverless da Vercel estouraria o limite de payload de 4.5MB da Vercel.
- **Decisão:** O banco de dados PostgreSQL armazenará estritamente **metadados** (tamanho, hash SHA-256, MIME type, categoria, ambiente, projeto e versão). Os **arquivos binários** residirão em um bucket de objetos compatível com S3 (Supabase Storage / Cloudflare R2 / AWS S3). O upload será realizado diretamente do navegador do usuário para o bucket via **URLs pré-assinadas (Presigned Upload URLs)**.
- **Consequências:**
  - *Positivas:* Zero carga de tráfego de mídia nos servidores da Vercel; uploads rápidos e escaláveis; suporte a arquivos de qualquer tamanho (plantas do Revit e renders pesados).
  - *Negativas:* Exige endpoint para assinatura prévia de permissão de upload antes do envio do arquivo.

---

### ADR-004: Camada Agnóstica de Provedores de Inteligência Artificial
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** A IA no ARQVERTICE STUDIO deve interpretar o projeto com memória multicamada. Acoplar a lógica de negócio diretamente à API do Google Gemini criaria risco de lock-in tecnológico caso novos modelos especializados em arquitetura se tornem superiores.
- **Decisão:** Criar a interface abstrata `IAProvider` no núcleo de domínio (`src/core/services/IAProvider.ts`). O sistema interagirá exclusivamente com essa interface. O Google Gemini (modelo 1.5 Pro / Flash) será implementado como o primeiro adaptador concreto (`GeminiAdapter`), localizado em `src/infrastructure/ai/`.
- **Consequências:**
  - *Positivas:* Troca de modelos ou provedores (OpenAI, Claude, Midjourney API, ControlNet local) com zero impacto nas regras de negócio; rastreamento unificado de custo de tokens e latência.
  - *Negativas:* Necessidade de normalizar parâmetros de entrada e saída em uma estrutura comum.

---

### ADR-005: Modelo de Autenticação Híbrida (RBAC + Links Públicos com Hash Criptográfico)
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** O sistema atende a dois públicos com necessidades opostas:
  1. Equipe interna da ArqVértice: necessita de controle total, governança e segurança;
  2. Clientes: necessitam de acesso simplificado para preencher briefings ou acompanhar o cronograma ("Estamos Aqui") pelo celular, sem atrito de cadastro ou criação de senhas complexas.
- **Decisão:** 
  - Para a equipe interna: Autenticação formal via sessão segura (Auth.js / Supabase Auth) com controle de acesso baseado em papéis (`ADMINISTRADOR`, `ARQUITETO`, `ENGENHEIRO`).
  - Para os clientes: Acesso público restrito por links com **tokens criptográficos não-previsíveis** (NanoID de 24 caracteres ou hash HMAC assinado com expiração). Exemplo: `/briefing/brf_9xK2mP4vL10...`. A rota pública tem acesso somente às tabelas estritamente necessárias e nunca expõe rotas de gerenciamento interno.
- **Consequências:**
  - *Positivas:* Elimina a chave de admin em texto claro no `localStorage`; garante segurança impecável para a área interna e fricção zero para o cliente externo.
  - *Negativas:* Exige gerenciamento de ciclo de vida e expiração de tokens públicos no banco de dados.

---

### ADR-006: Geração Server-Side de Relatórios e Documentos em PDF
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** Atualmente o cronograma utiliza `html2pdf.js`, que clona o DOM do navegador e gera o PDF via canvas. Isso gera falhas em celulares, quebras de página que cortam tabelas ao meio e falta de suporte para pranchas nos formatos A3, A2 ou A1.
- **Decisão:** Substituir a geração via canvas no navegador pela biblioteca **`@react-pdf/renderer`**, executada no servidor ou em Web Worker dedicado.
- **Consequências:**
  - *Positivas:* Controle milimétrico de diagramação gráfica; fidelidade vetorial absoluta de textos e logos; quebra de página programática inteligente; suporte a pranchas A4, A3, A2 e A1 com carimbo técnico.
  - *Negativas:* O layout dos relatórios deve ser codificado utilizando os componentes específicos do `@react-pdf/renderer` (`<Document>`, `<Page>`, `<View>`, `<Text>`).

---

### ADR-007: Estratégia de Preservação e Extensão Não-Destrutiva da Base de Dados
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** O banco de dados em produção possui 14 tarefas cadastradas da obra "Residência de Praia" e triggers ativos. A evolução para múltiplos projetos não pode apagar esses dados nem interromper o acompanhamento em produção.
- **Decisão:** A evolução relacional ocorrerá através de migrations aditivas (sem `DROP TABLE` destrutivo):
  1. Criar a tabela `clientes` e inserir o cliente padrão "Pedro";
  2. Remover a restrição `CHECK (id = 1)` da tabela `projeto` via `ALTER TABLE`;
  3. Criar a nova tabela `projetos` (UUID PK) ou expandir a existente, migrando a linha 1 da "Residência de Praia";
  4. Adicionar a coluna `projeto_id UUID` na tabela `tarefas`, com `DEFAULT` apontando para o ID da obra 1;
  5. Manter as colunas e a regra da coluna gerada `status` inalteradas.
- **Consequências:**
  - *Positivas:* Paridade de dados 100% garantida; histórico da obra preservado integralmente; zero risco de perda acidental.
  - *Negativas:* Exige script de migração com testes prévios em ambiente de homologação.

---

### ADR-008: Validação Estrita por Schemas Zod em Todas as Fronteiras
- **Status:** Aprovado
- **Data:** 2026-09-21
- **Contexto:** Dados inválidos inseridos em formulários ou mutações de API podem corromper cálculos de porcentagem ou datas de entrega do cronograma.
- **Decisão:** Toda entrada de dados (formulários de UI, payloads de Server Actions, query parameters e respostas de IA) será validada com schemas **Zod** centralizados em `src/shared/validations/`.
- **Consequências:**
  - *Positivas:* Tipagem estática inferida automaticamente do schema; mensagens de erro em português padronizadas; impossibilidade de payloads maliciosos ou incompletos atingirem a camada de banco de dados.
  - *Negativas:* Exige definição formal de schemas Zod para cada operação de entrada.
