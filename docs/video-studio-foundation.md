# Fundação do Módulo de Produção Audiovisual (Video Studio Foundation) — Bloco G01

## 1. Visão Geral e Objetivo

O **Módulo de Produção Audiovisual** do ArqVértice Studio é o componente arquitetural responsável por transformar projetos concluídos ou parcialmente concluídos em apresentações audiovisuais de alto padrão, trailers arquitetônicos, walkthroughs imersivos e peças de mídia social para clientes e investidores.

### 1.1 Regra de Ouro: Produção Audiovisual Estritamente Opcional
A geração de vídeo **não é mandatória** para todos os projetos. O sistema preserva o fluxo ágil tradicional de pranchas, relatórios e entregas sem impor etapas de vídeo. Quando o arquiteto ou a equipe decide criar uma produção audiovisual para valorizar o projeto ou atender a uma demanda do cliente, o módulo é ativado sob demanda.

### 1.2 Fluxo Canônico Completo do Módulo Audiovisual

```
PROJETO
  ↓
AMBIENTES
  ↓
IMAGENS APROVADAS
  ↓
PLANTAS APROVADAS
  ↓
PERSPECTIVAS
  ↓
RENDERS
  ↓
MATERIAIS
  ↓
CONCEITO
  ↓
NARRATIVA
  ↓
ROTEIRO
  ↓
STORYBOARD
  ↓
PROMPTS
  ↓
ASSETS
  ↓
VÍDEO
  ↓
REVISÃO
  ↓
APROVAÇÃO
  ↓
ENTREGA
```

---

## 2. Modelo de Dados & Entidades

### 2.1 Entidade Principal: `VideoProject`

Campos canônicos implementados no banco (`video_projects`) e gerenciados pelo `StudioState`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | VARCHAR(100) | Identificador primário (`video-{timestamp}-{hash}`) |
| `projectId` | VARCHAR(100) | FK referenciando o projeto no ArqVértice Studio |
| `presentationId` | VARCHAR(100) | FK opcional referenciando a apresentação vinculada |
| `environmentId` | VARCHAR(100) | FK opcional referenciando ambiente específico ou escopo geral |
| `title` | VARCHAR(255) | Título descritivo da produção audiovisual |
| `description` | TEXT | Sinopse ou detalhamento do vídeo |
| `type` | ENUM | Tipo de vídeo (um dos 13 tipos canônicos) |
| `objective` | TEXT | Intenção de negócio ou comunicação do vídeo |
| `audience` | VARCHAR(255) | Público-alvo (cliente titular, investidores, redes sociais) |
| `duration` | VARCHAR(50) / INT | Duração formatada ou em segundos (ex: 90s, '01:30') |
| `aspectRatio` | VARCHAR(20) | Proporção da tela (`16:9`, `9:16`, `1:1`, `4:5`, `21:9`) |
| `resolution` | VARCHAR(20) | Resolução de renderização (`720p`, `1080p`, `2K`, `4K`) |
| `status` | ENUM | Ciclo de vida (um dos 9 status canônicos) |
| `revision` | VARCHAR(20) | Código de revisão sequencial (`V00`, `V01`, `V02`...) |
| `versionNumber` | INT | Índice inteiro da revisão (0, 1, 2...) |
| `isApproved` | BOOLEAN | Trava de homologação formal |
| `approvedAt` | TIMESTAMPTZ | Registro de data/hora da homologação |
| `approvedBy` | VARCHAR(255) | Responsável pela aprovação formal |
| `isArchived` | BOOLEAN | Indicador de arquivamento lógico |
| `metadata` | JSONB | Configurações estendidas e tags |
| `createdAt` | TIMESTAMPTZ | Registro de criação |
| `updatedAt` | TIMESTAMPTZ | Registro de última atualização |

### 2.2 Tipos Canônicos de Vídeo (13 Tipos)
1. `apresentação de projeto`
2. `apresentação de ambiente`
3. `apresentação para cliente`
4. `vídeo de conceito`
5. `vídeo de estudo`
6. `vídeo de walkthrough` (Tour cinemático)
7. `vídeo para redes sociais`
8. `vídeo institucional`
9. `vídeo vertical`
10. `vídeo horizontal`
11. `teaser`
12. `reel`
13. `short`

### 2.3 Status Canônicos de Vídeo (9 Status)
1. `rascunho` (10% de progresso)
2. `planejamento` (20% de progresso)
3. `roteiro` (35% de progresso)
4. `storyboard` (50% de progresso)
5. `produção` (65% de progresso)
6. `revisão` (80% de progresso)
7. `aprovado` (95% de progresso)
8. `finalizado` (100% de progresso)
9. `arquivado` (0% de progresso)

---

## 3. Estrutura Relacional Completa

O modelo implementa a hierarquia relacional mandatória:

```
Projeto
  └── VideoProject
        ├── Scenes (Cenas e sequências dramáticas do projeto)
        ├── Shots (Planos de câmera, enquadramentos e movimentos)
        ├── Assets (Imagens aprovadas, renders, plantas humanizadas vinculadas)
        ├── Audio (Trilha sonora ambiente, locução e efeitos sonoros)
        ├── Captions (Legendas técnicas, cotas informativas e títulos)
        └── Versions (Snapshots congelados e imutáveis de cada versão homologada)
```

### 3.1 Blindagem Contra Sobrescrita de Versão Aprovada
- Cada produção audiovisual inicia na revisão `V00`.
- Ao aprovar uma produção (`approveVideoProject`), o vídeo é formalmente homologado (`isApproved = true`, `status = 'aprovado'`).
- **É expressamente proibido alterar o conteúdo de uma versão aprovada.** Qualquer tentativa de mutação direta lança um erro impeditivo de integridade.
- Para aplicar novas modificações, o usuário deve acionar `createVideoVersion(id, notes)`, que:
  1. Cria um snapshot imutável completo em `video_versions` contendo toda a árvore de dados (cenas, shots, assets, audios, legendas);
  2. Incrementa a revisão (`V00` $\to$ `V01` $\to$ `V02`...);
  3. Desbloqueia a nova revisão (`isApproved = false`, `status = 'revisao'`).

---

## 4. Interface do Usuário ("Vídeo do Projeto")

A interface é implementada no componente `VideoStudioModule` (`js/video-studio-module.js`) e integrada à aba **"Vídeo"** do Workspace do Projeto (`js/projects.js`).

### 4.1 Painel de Produções
- **Cabeçalho**: Identificação do projeto, badge indicando caráter opcional e botão para criar novo vídeo.
- **Estado Vazio (Empty State)**: Explicita com clareza a opcionalidade do vídeo e convida o usuário a criar o primeiro vídeo apenas se desejar.
- **Card de Vídeo (Campos Obrigatórios Exibidos)**:
  - Projeto associado
  - Ambiente associado (ou escopo geral)
  - Tipo do vídeo com ícone correspondente
  - Duração estimada
  - Formato / Proporção de tela (`16:9`, `9:16`, etc.) e resolução
  - Status com badge estilizado
  - Código de revisão (`V00`, `V01`...)
  - Barra de progresso percentual calculada automaticamente
  - **Botões de Ação Imediata**:
    1. `Continuar`: Acessa a continuidade da produção
    2. `Duplicar`: Clona a estrutura do vídeo gerando uma nova cópia independente em `V00` e `rascunho`
    3. `Nova Versão`: Gera a versão sequencial congelando o histórico anterior
    4. `Arquivar / Restaurar`: Gerencia o ciclo de vida sem deleção destrutiva

---

## 5. APIs e Métodos Disponíveis no `StudioState`

```javascript
// Criação e Leitura
StudioState.createVideoProject(data, user);
StudioState.getVideoProject(id);
StudioState.getProjectVideos(projectId, options);

// Edição e Ciclo de Vida
StudioState.updateVideoProject(id, data, user);
StudioState.duplicateVideoProject(id, newTitle, user);
StudioState.archiveVideoProject(id, user);
StudioState.restoreVideoProject(id, user);

// Versionamento e Homologação
StudioState.createVideoVersion(id, notes, user);
StudioState.approveVideoProject(id, user, notes);
StudioState.setVideoStatus(id, newStatus, user);

// Associações
StudioState.linkVideoPresentation(id, presentationId, user);

// Entidades Filhas (Scenes, Shots, Assets, Audios, Captions)
StudioState.getVideoScenes(videoProjectId);
StudioState.addVideoScene(videoProjectId, data);
StudioState.getVideoShots(videoProjectId);
StudioState.addVideoShot(sceneIdOrVideoId, data);
StudioState.getVideoAssets(videoProjectId);
StudioState.addVideoAsset(videoProjectId, data);
StudioState.getVideoAudios(videoProjectId);
StudioState.addVideoAudio(videoProjectId, data);
StudioState.getVideoCaptions(videoProjectId);
StudioState.addVideoCaption(videoProjectId, data);
StudioState.getVideoVersions(videoProjectId);
StudioState.getVideoTimeline(videoProjectId);
```

---

## 6. Banco de Dados

- DDL de referência: `database/schema/28_video_studio_foundation.sql`
- Migração PostgreSQL: `database/migrations/0023_video_studio_foundation.sql`
- Tabelas adicionadas:
  - `video_projects`
  - `video_scenes`
  - `video_shots`
  - `video_assets`
  - `video_audios`
  - `video_captions`
  - `video_versions`
