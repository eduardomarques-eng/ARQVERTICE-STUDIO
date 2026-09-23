# Sistema de Apresentação de Perspectivas e Renders — ArqVértice Studio

> **Documentação Técnica Oficial — Bloco F07**  
> **Status:** Implementado e Homologado (11/11 testes aprovados, 100% de cobertura)  
> **Integração:** Conectado nativamente ao Motor de Pranchas (F02) e Formatos Físicos ABNT/NBR (F03)

---

## 1. Visão Geral e Fluxo Canônico

O Bloco **F07** implementa a gestão, consistência, governança e apresentação de perspectivas fotorrealistas e renders no **ArqVértice Studio**. O fluxo de trabalho é estritamente sequencial e rastreável:

$$\text{PROJETO} \longrightarrow \text{AMBIENTE} \longrightarrow \text{REFERÊNCIAS} \longrightarrow \text{CÂMERA} \longrightarrow \text{ESTUDO} \longrightarrow \text{RENDER} \longrightarrow \text{REVISÃO} \longrightarrow \text{APROVAÇÃO} \longrightarrow \text{PRANCHA}$$

O arquiteto trabalha cada ambiente **individualmente**, garantindo isolamento de contexto, fidelidade às especificações e coerência compositiva.

---

## 2. Isolamento de Imagens por Ambiente

* Cada ambiente possui sua própria coleção independente de imagens e renders em `StudioState.data.environmentRenders`.
* Renders de um ambiente (ex.: `Cozinha Gourmet`) **nunca se misturam** nem vazam para outro ambiente (ex.: `Living Integrado`).
* Filtros de recuperação: `StudioState.getEnvironmentPresentationRenders(projectId, environmentId)`.

---

## 3. Câmeras e Enquadramentos Canônicos

### 3.1 Os 10 Campos Obrigatórios da Câmera
Toda câmera registrada no sistema armazena os 10 parâmetros canônicos:

| # | Parâmetro | Campo Técnico | Descrição |
| :-: | :--- | :--- | :--- |
| **1** | **CameraId** | `id` / `cameraId` | Identificador único da câmera |
| **2** | **Ambiente** | `ambiente` / `environmentId` | Nome e ID do ambiente vinculado |
| **3** | **Nome** | `nome` / `name` | Nomenclatura normalizada |
| **4** | **Posição** | `posicao` / `position` | Posição física tridimensional ou descritiva no espaço |
| **5** | **Direção** | `direcao` / `direction` | Alvo/direção do olhar no ambiente |
| **6** | **Tipo** | `tipo` / `type` | Finalidade: `PERSPECTIVA`, `AMPLO`, `DETALHE`, `AXONOMETRICA` |
| **7** | **Enquadramento** | `enquadramento` / `framing` | Proporção visual: `HORIZONTAL_AMPLO`, `VERTICAL`, etc. |
| **8** | **Descrição** | `descricao` / `description` | Notas técnicas de composição e lente |
| **9** | **Referência** | `referencia` / `reference` | Imagem ou link de enquadramento base |
| **10**| **Versão** | `versao` / `version` | Versão de enquadramento (`V01`, `V02`, etc.) |

### 3.2 Nomenclatura Padronizada
O sistema gera e valida automaticamente a convenção canônica `{Ambiente}_Cam{NN}`:
* `Sala_Cam01`, `Sala_Cam02`
* `Cozinha_Cam01`
* `Suíte_Cam01`
* `Banho_Cam01`

---

## 4. Imagens e Metadados Canônicos

Cada imagem de perspectiva/render registrada no estúdio armazena:

1. **Original (`original`):** URL do estudo preliminar ou imagem base original.
2. **Render (`render`):** URL da imagem renderizada em alta definição.
3. **Versão (`version`):** Rótulo de versão (`V01`, `V02`, `V03`...).
4. **Modelo (`modelo`):** Motor de renderização ou IA generativa (ex.: `Corona 11`, `Imagen 3 Architecture Pro`).
5. **Provider (`provider`):** Provedor de execução (`GEMINI_ARQ_PRO`, `CORONA`, `MOCK`).
6. **Prompt (`prompt`):** Prompt contextual compilado enviado para renderização.
7. **Referências (`referencias`):** Lista de IDs e URLs de referências visuais vinculadas.
8. **Data (`data`):** Timestamp ISO da emissão do render.
9. **Aprovação (`approval`):** Status formal (`DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`).

### 4.1 Qualidade e Resolução
* **Preservação Original:** A URL master e a resolução original (4K / 3840×2160) são mantidas intocadas nos metadados.
* **Thumbnail Otimizada:** Para carregamento fluido da interface, o sistema utiliza o campo `thumbnailUrl`, evitando overhead de banda sem degradar a imagem entregue na prancha.

---

## 5. Recuperação Automática de Consistência

O método `StudioState.compilePerspectiveConsistency(projectId, environmentId, cameraId)` recupera automaticamente e de forma unificada:

* **Briefing:** Tipologia, cliente, responsável técnico e premissas gerais.
* **Ambiente:** Área, pé-direito, estilo e objetivo sensorial.
* **Estilo:** Diretrizes estilísticas consolidadas no projeto.
* **Materiais:** Lista de acabamentos e revestimentos especificados para o ambiente.
* **Mobiliário:** Catálogo de peças de design e marcenaria vinculadas.
* **Referências:** Referências ativas com prioridade de estilo e enquadramento.
* **Decisões Anteriores:** Histórico de aprovações e decisões já validadas.
* **Imagens Aprovadas:** Galeria de versões homologadas para referência mútua.
* **Locks Ativos:** Estado de travamento dos 7 componentes visuais.

---

## 6. Governança de Locks (Sem Alteração Silenciosa)

O sistema monitora 7 componentes canônicos:
1. `geometry` (Geometria / Alvenarias)
2. `camera` (Câmera / Posição do observador)
3. `layout` (Layout / Distribuição espacial)
4. `materials` (Materiais / Texturas homologadas)
5. `lighting` (Iluminação natural e artificial)
6. `decor` (Decoração e adornos)
7. `landscape` (Paisagismo e área externa)

> **REGRA DE OURO:** Se um lock estiver ativo para um componente, o fluxo e o prompt **não podem solicitar nem executar alteração silenciosa** daquele item. A função `StudioState.validatePerspectiveLockIntegrity()` intercepta qualquer tentativa e emite violação formal.

---

## 7. Ciclo de Vida e Variações

O arquiteto conta com ações formais de ciclo de vida:
* **Gerar Nova Versão:** Cria V+1 herdando metadados e permitindo refinamento incremental.
* **Duplicar:** Cria cópia de trabalho com ID próprio sem afetar o histórico.
* **Aprovar:** Homologa a imagem como oficial do ambiente (`approvalStatus: 'APPROVED'`). Apenas uma versão por ambiente permanece como `isCurrentApproved: true`.
* **Rejeitar:** Marca como rejeitada exigindo **justificativa obrigatória** para auditoria.
* **Arquivar:** Remove do fluxo ativo mantendo integridade histórica.

---

## 8. Blindagem de Imagens Aprovadas

* Imagens com status `APPROVED` são **estritamente protegidas contra alterações automáticas ou sobrescrita silenciosa**.
* O método `StudioState.canModifyPerspectiveRender(renderId)` retorna `false` para qualquer imagem aprovada.
* Caso sejam necessários ajustes em uma imagem aprovada, o arquiteto deve gerar uma nova versão (`V+1`), preservando a versão homologada intocada no histórico.

---

## 9. Motor de Comparação

O modal de comparação interativa oferece dois modos fundamentais:

### 9.1 Antes / Depois (`BEFORE_AFTER`)
Compara o estudo volumétrico preliminar (`original`) contra o render final de alta fidelidade (`render`), permitindo inspecionar a evolução técnica do projeto.

### 9.2 Versão A / Versão B (`VERSION_A_B`)
Compara duas alternativas simultâneas (ex.: V01 com madeira clara × V02 com ripado escuro), exibindo métricas lado a lado e diferenças nos prompts.

---

## 10. Apresentação em Prancha (5 Layouts Diagramados)

O método `StudioState.insertPerspectiveRendersToSheet(sheetId, renderIds, layoutType)` insere os renders diretamente no motor de pranchas (F02/F03), calculando dimensões que respeitam rigorosamente a `printableArea` da folha técnica:

| Layout | Identificador | Estrutura Diagramada |
| :--- | :--- | :--- |
| **1 Imagem** | `single` | 1 perspectiva hero ocupando 100% da área útil da folha com margem de respiro |
| **2 Imagens** | `two_horizontal` | 2 perspectivas lado a lado (50% / 50%) com espaçamento regular |
| **3 Imagens** | `three_grid` | 1 perspectiva principal ampla (60%) + 2 perspectivas secundárias empilhadas (40%) |
| **4 Imagens** | `four_grid` | Grid simétrico 2×2 equilibrado para visão panorâmica do ambiente |
| **Principal + Detalhes** | `hero_details` | 1 perspectiva hero dominante (70% altura) + 3 ou 4 miniaturas de detalhe em rodapé |

---

## 11. Validação e Testes Automatizados

A suíte de testes automatizados `tests/render-presentation.test.js` foi executada em ambiente Node.js:

```text
================================================================
 INICIANDO SUÍTE DE TESTES: BLOCO F07 - APRESENTAÇÃO DE RENDERS
================================================================

--- GRUPO 1: CONJUNTO INDEPENDENTE DE IMAGENS POR AMBIENTE ---
  ✔ [PASS] 1.1 Cada ambiente deve possuir seu conjunto independente e isolado de imagens

--- GRUPO 2 & 3: CÂMERAS CANÔNICAS E NOMENCLATURA PADRÃO ---
  ✔ [PASS] 2.1 Formatação e geração de nomes padronizados ({Ambiente}_Cam{NN})
  ✔ [PASS] 2.2 Registro de câmera com todos os 10 campos canônicos

--- GRUPO 4, 10 & 11: IMAGENS CANÔNICAS, QUALIDADE E METADADOS ---
  ✔ [PASS] 4.1 Registro de imagens com os 9 parâmetros canônicos e preservação de resolução

--- GRUPO 5: CONSISTÊNCIA AUTOMÁTICA ---
  ✔ [PASS] 5.1 Recuperação automática de briefing, ambiente, estilo, materiais, mobiliário, referências, decisões, imagens aprovadas e locks

--- GRUPO 6: LOCKS RIGOROSOS E BLOQUEIO DE MUTAÇÃO SILENCIOSA ---
  ✔ [PASS] 6.1 Respeito estrito aos 7 locks (geometria, câmera, layout, materiais, iluminação, decoração, paisagismo)

--- GRUPO 7: VARIAÇÕES (NOVA VERSÃO, DUPLICAR, APROVAR, REJEITAR, ARQUIVAR) ---
  ✔ [PASS] 7.1 Ciclo de vida completo de variações de render

--- GRUPO 8: COMPARAÇÃO ANTES/DEPOIS E VERSÃO A/B ---
  ✔ [PASS] 8.1 Motor de comparação suporta modos Antes/Depois e Versão A/B

--- GRUPO 9: APRESENTAÇÃO EM PRANCHA NOS 5 LAYOUTS CANÔNICOS ---
  ✔ [PASS] 9.1 Inserção diagramada na prancha respeitando printableArea em 5 layouts

--- GRUPO 12: BLINDAGEM DE IMAGENS APROVADAS ---
  ✔ [PASS] 12.1 Não alterar automaticamente imagens aprovadas

--- GRUPO 13: RENDERIZAÇÃO DA INTERFACE DO USUÁRIO ---
  ✔ [PASS] 13.1 Módulo RenderPresentationModule renderiza painel com todas as seções

================================================================
 RESULTADO FINAL: 11 PASSOU | 0 FALHOU (100% SUCESSO)
================================================================
```
