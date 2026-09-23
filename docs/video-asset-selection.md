# Sistema de Seleção e Curadoria de Conteúdo Audiovisual (Bloco G03)

## 1. Visão Geral e Objetivo

O **Sistema de Seleção de Conteúdo para Vídeo (Video Asset Selection & Curation System)** é o módulo responsável por alimentar o pipeline de produção audiovisual do **ArqVertice Studio**. Ele agrega ativos visuais e informativos previamente desenvolvidos nas etapas do projeto (levantamento, estudos preliminares, conceito, visualização 3D, especificações e pranchas executivas), permitindo curadoria refinada antes da geração do roteiro (G04).

---

## 2. Governança e Regras Críticas de Negócio

1. **Seleção Automática Estrita**:
   - Somente conteúdo formalmente **AUTORIZADO / APROVADO** (`status = 'APROVADO'`) é pré-selecionado automaticamente pelo sistema (`selected = true`).
2. **Exclusão de Itens Não Homologados do Fluxo Automático**:
   - Itens nos seguintes estados **NÃO** entram automaticamente:
     - `RASCUNHO`
     - `EM REVISÃO`
     - `ARQUIVADO`
   - O usuário pode, se julgar necessário, marcar manualmente esses itens, com alerta consultivo emitido pela interface.
3. **Preservação de Dados e Histórico**:
   - **Não excluir automaticamente imagens**: O sistema de seleção do vídeo cria referências e nunca deleta arquivos do repositório do projeto.
   - **Não substituir imagens aprovadas**: A substituição de ativos ocorre apenas na ordem/composição da timeline do vídeo; os arquivos originais aprovados permanecem íntegros no banco de dados e no storage.
4. **Autonomia do Usuário**:
   - O sistema de recomendação por IA sugere os melhores papéis e enquadramentos, mas a **decisão final pertence exclusivamente ao arquiteto/usuário**.

---

## 3. Fontes de Conteúdo Integradas (15 Fontes)

O seletor conecta-se a 15 fontes canônicas de dados do projeto:

| # | Fonte | Descrição Técnica |
|---|---|---|
| 1 | `briefing` | Diretrizes, perfil do cliente, necessidades e restrições do projeto |
| 2 | `conceito` | Narrativa conceitual, atmosfera e partido arquitetônico |
| 3 | `ambientes` | Renders homologados e fotos principais dos ambientes |
| 4 | `plantas` | Plantas baixas técnicas do levantamento arquitetônico |
| 5 | `plantas humanizadas` | Plantas humanizadas 2D coloridas com layout de mobiliário |
| 6 | `perspectivas` | Estudos preliminares de volumetria e perspectivas 3D |
| 7 | `renders` | Renders fotorrealistas em alta resolução (1080p, 2K, 4K) |
| 8 | `referências` | Imagens e referências visuais curadas para o projeto |
| 9 | `materiais` | Moodboards de materiais, acabamentos e texturas minerais/madeiras |
| 10 | `mobiliário` | Peças de mobiliário e marcenaria detalhadas |
| 11 | `moodboards` | Painéis conceituais de estilo e paleta cromática |
| 12 | `pranchas` | Pranchas técnicas diagramadas (A0, A1, A2, A3) |
| 13 | `observações` | Pontos de atenção e diretrizes críticas registradas |
| 14 | `revisões` | Versões históricas de estudos e renders para comparação |
| 15 | `arquivos aprovados` | Documentos homologados, laudos técnicos e fotos de vistoria |

---

## 4. Papéis Narrativos Audiovisuais (11 Roles)

Cada ativo selecionado recebe um papel narrativo para direcionar o ritmo e a montagem na timeline:

1. `abertura`: Fachada principal, tomada aérea ou vista de impacto inicial.
2. `contexto`: Implantação, entorno, terreno e planta geral.
3. `planta`: Planta humanizada ou técnica demonstrando a distribuição espacial.
4. `ambiente`: Vistas amplas de living, suítes, gourmet e áreas sociais.
5. `perspectiva`: Ângulo tridimensional destacando volumetria e iluminação.
6. `detalhe`: Close-up de marcenaria, encaixes e detalhes construtivos.
7. `material`: Foco em texturas (mármores, pedras naturais, madeiras).
8. `mobiliário`: Destaque de mobiliário assinado e peças principais.
9. `transição`: Passagem visual entre áreas sociais e íntimas ou dia/noite.
10. `encerramento`: Vista noturna / pôr do sol ou tomada de despedida.
11. `CTA`: Call to action final, selo do escritório, contato e assinatura técnica.

---

## 5. Filtros do Acervo (7 Filtros Canônicos)

A interface e o estado oferecem 7 filtros simultâneos para curadoria rápida:
- **Projeto**: Filtra por ID do projeto ativo.
- **Ambiente**: Filtra por cômodo específico (ex.: Living, Deck, Suíte).
- **Tipo**: Filtra por qualquer uma das 15 fontes de conteúdo.
- **Aprovação**: Filtra por `APROVADO`, `EM REVISÃO`, `RASCUNHO` ou `ARQUIVADO`.
- **Revisão**: Filtra por versão do ativo (ex.: `V01`, `V02`, `V03`).
- **Resolução**: Filtra por resolução técnica (`1080p`, `2K`, `4K`).
- **Orientação**: Filtra por aspect ratio espacial (`horizontal`, `vertical`, `quadrado`).

---

## 6. Sistema de Recomendação por Inteligência Artificial

A IA analisa as dimensões, metadados espaciais e tags semânticas de cada imagem para recomendar o papel ideal:

- *"Esta imagem funciona melhor como abertura."* (para fachadas, vistas frontais ou aéreas)
- *"Esta imagem apresenta melhor o ambiente."* (para tomadas amplas de estar, gourmet ou deck)
- *"Esta imagem funciona melhor como encerramento."* (para vistas noturnas, sunset ou logotipo)
- *"Esta especificação funciona melhor destacando os materiais."*
- *"Esta imagem valoriza a composição do mobiliário."*
- *"Este detalhe destaca melhor a marcenaria e acabamentos finos."*

O usuário pode acatar a sugestão com um clique no botão **"Aceitar Sugestão"** ou atribuir manualmente qualquer outro papel da lista.

---

## 7. Ações Permitidas ao Usuário

- **Selecionar / Desmarcar**: Controle individual ou em lote de itens no vídeo.
- **Ordenar**: Ajustar posição numérica ou mover para cima/baixo na ordem de exibição.
- **Substituir**: Alternar um ativo na seleção por outro do acervo sem alterar o arquivo original.
- **Visualizar**: Modal com visualização ampliada e metadados técnicos.
- **Comparar Versões**: Comparação lado a lado (ex.: `V01` vs `V02`) avaliando evolução volumétrica e status de aprovação.

---

## 8. Estrutura de Banco de Dados

### Tabela `video_asset_selections`
```sql
CREATE TABLE video_asset_selections (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  asset_id VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(100),
  selected BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 1,
  role VARCHAR(50) NOT NULL DEFAULT 'ambiente',
  notes TEXT,
  title VARCHAR(255),
  preview_url TEXT,
  environment_id VARCHAR(100),
  approval_status VARCHAR(50) NOT NULL DEFAULT 'APROVADO',
  revision VARCHAR(20) DEFAULT 'V01',
  resolution VARCHAR(20) DEFAULT '1080p',
  orientation VARCHAR(20) DEFAULT 'horizontal',
  ai_recommended_role VARCHAR(50),
  ai_recommendation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
