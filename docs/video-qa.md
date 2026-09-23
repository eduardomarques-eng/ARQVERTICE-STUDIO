# Video QA Engine — Controle de Qualidade Audiovisual (Bloco G14)

## Visão Geral

O **Video QA Engine (Bloco G14)** do ArqVertice Studio é a camada mandatória de controle de qualidade, inspeção analítica e auditoria técnica e cinematográfica da pipeline de produção audiovisual.

Ele atua como um inspetor inteligente que valida cada tomada, clipe, proporção e especificação de projeto antes da renderização final e entrega ao cliente, garantindo que o vídeo gerado por modelos generativos de IA respeite com rigor absoluto as decisões de projeto homologadas.

---

## Princípio Fundamental: Inviolabilidade e Não-Alteração Automática

> [!IMPORTANT]
> **DIRETRIZ ÉTICA E TÉCNICA DE SALVAGUARDA (INVIOLABILIDADE)**:
> 1. A inteligência artificial **pode analisar** cenas, modelos, textos, iluminação, materiais e timelines.
> 2. A inteligência artificial **NÃO pode alterar automaticamente o projeto**.
> 3. É **terminantemente proibido corrigir arquivos silenciosamente**.
> 4. Toda e qualquer inconsistência detectada deve ser comunicada com clareza ao arquiteto, expondo obrigatoriamente:
>    - **PROBLEMA**
>    - **CENA**
>    - **EVIDÊNCIA**
>    - **RECOMENDAÇÃO**
> 5. A decisão de resolução é **exclusivamente humana**, cabendo ao arquiteto optar por uma das três ações guiadas:
>    - **Corrigir manualmente**
>    - **Regenerar asset**
>    - **Substituir cena**

---

## Os 13 Checkpoints Canônicos de Verificação

A auditoria cobre exatamente **13 critérios** multidisciplinares divididos entre integridade arquitetural, cinematografia digital, especificações e montagem:

| # | Checkpoint | Categoria | Severidade Padrão | Escopo da Verificação |
|---|------------|-----------|-------------------|-----------------------|
| 1 | **continuidade** | Montagem | `WARNING` | Fluidez sequencial entre tomadas adjacentes, coerência estética, progressão espacial lógica e prevenção de saltos narrativos abruptos. |
| 2 | **ambiente** | Arquitetura | `BLOCKED` | Vinculação estrita de cada cena ao ambiente cadastrado no projeto. Cenas com ambientes inexistentes ou contradições de cômodo bloqueiam a produção. |
| 3 | **geometria** | Arquitetura | `ERROR` | Alinhamento ortogonal, verticalidade de paredes, pilares, aberturas, esquadrias e proporcionalidade volumétrica do pé-direito. |
| 4 | **materiais** | Especificação | `ERROR` | Correspondência com o catálogo canônico de materiais (pisos, madeiras, pedras, tecidos, tintas) homologados para o ambiente. |
| 5 | **mobiliário** | Especificação | `ERROR` | Fidelidade total ao mobiliário e marcenaria do render aprovado (ex: sofás, mesas, cadeiras, marcenaria sob medida). |
| 6 | **iluminação** | Cinematografia | `WARNING` | Coerência da fonte luminosa (sol direto, luz difusa, horário do dia, temperatura de cor em Kelvin) entre tomadas consecutivas do mesmo espaço. |
| 7 | **câmera** | Cinematografia | `WARNING` | Estabilidade do movimento, ausência de câmera instável/brusca, enquadramento balanceado e controle de distorção de lente (evitando fish-eye não planejado). |
| 8 | **duração** | Ritmo | `WARNING` | Tempo de permanência de cada cena (faixa ótima: 1.5s a 12s) e aderência à duração total pretendida no plano de vídeo. |
| 9 | **resolução** | Técnico | `ERROR` | Homogeneidade dimensional entre clipes gerados por múltiplos providers de IA (ex: Luma 720p vs Runway 1080p) e compatibilidade com o master final. |
| 10 | **proporção** | Técnico | `BLOCKED` | Uniformidade estrita do *aspect ratio* (16:9 widescreen vs 9:16 vertical reels). Clipes divergentes causam *pillarbox/letterbox* espúrio e bloqueiam exportação. |
| 11 | **cortes** | Montagem | `WARNING` | Qualidade dos cortes secos, ritmo temporal e prevenção de *jump cuts* no mesmo eixo focal (< 30 graus de variação angular). |
| 12 | **transições** | Montagem | `WARNING` | Adequação do estilo de transição (cortes secos, fusões, fades), duração razoável (< 2.0s) e ausência de efeitos dissonantes. |
| 13 | **identidade visual** | Branding | `WARNING` | Presença de carimbo ArqVértice, letreiro de identificação do projeto/cliente, tipografia corporativa padronizada e *color grading*. |

---

## Modelo de Dados: `VideoQAResult`

Toda execução de QA produz uma entidade imutável de auditoria:

```json
{
  "id": "vqares-1774300000000-abc12",
  "videoProjectId": "vid-praia-01",
  "projectId": "prj-praia-01",
  "evaluatedAt": "2026-09-22T16:20:00.000Z",
  "overallStatus": "ERROR",
  "confidenceScore": 0.94,
  "summary": "Detectadas 1 inconsistência(s) severa(s) de especificação ou montagem. Correção manual ou regeneração recomendada.",
  "counts": {
    "total": 13,
    "pass": 11,
    "warning": 1,
    "error": 1,
    "blocked": 0,
    "unresolvedFindings": 2
  },
  "isExportAllowed": true,
  "canFinalize": false,
  "aiAnalysisOnly": true,
  "projectModifiedByAI": false,
  "executedBy": "IA Audiovisual QA",
  "checks": [
    {
      "id": "mobiliario",
      "number": 5,
      "name": "Mobiliário",
      "status": "ERROR",
      "score": 0.65,
      "summary": "Divergência de mobiliário em relação ao render aprovado.",
      "findingsCount": 1
    }
  ],
  "findings": [
    {
      "id": "vqaf-1774300000000-1-xyz",
      "checkpointId": "mobiliario",
      "checkpointName": "Mobiliário",
      "checkpointNumber": 5,
      "status": "ERROR",
      "problem": "Cena 04 utiliza mobiliário diferente do render aprovado da Sala.",
      "sceneId": "vscene-04",
      "sceneNumber": 4,
      "sceneTitle": "Sala de Estar — Ângulo Aberto",
      "evidence": "O render homologado (RND-02) possui Sofá Curvo em Linho Cru e mesa de centro orgânica em nogueira, enquanto o asset gerado apresenta sofá modular retilíneo cinza.",
      "recommendation": "Substituir a cena pelo render homologado da Sala ou regenerar o asset reforçando o mobiliário aprovado.",
      "allowedActions": ["manual_fix", "regenerate_asset", "replace_scene"],
      "isResolved": false,
      "resolvedAt": null,
      "resolvedBy": null,
      "resolution": null
    }
  ]
}
```

---

## Escala de Severidade

O sistema emprega quatro níveis canônicos de status:

### 1. `PASS`
O critério foi verificado e encontra-se em conformidade integral com os dados do projeto. Não requer nenhuma ação.

### 2. `WARNING`
Alerta técnico para atenção do arquiteto. Não impede a renderização nem a exportação, mas é registrado no dossiê de QA (ex: transição ligeiramente longa, duração curta de clipe, corte em jump cut).

### 3. `ERROR`
Inconsistência de projeto grave que contraria decisões homologadas (ex: mobiliário divergente do render aprovado, revestimento em desacordo com catálogo, clipe 720p em master 1080p). Requer atenção prioritária antes da entrega formal.

### 4. `BLOCKED`
Inconsistência fatal e crítica que **bloqueia automaticamente a renderização e exportação** no Video Render Engine (G13).
- **Exemplos**: cena vinculada a ambiente inexistente, ausência de clipe de vídeo na timeline, ou proporção vertical (9:16) misturada sem enquadramento num vídeo horizontal (16:9).
- Enquanto houver apontamentos `BLOCKED` não resolvidos, `isExportAllowed` permanece `false` e qualquer tentativa de compilação gera exceção explícita.

---

## Apresentação Canônica de Inconsistências

Toda inconsistência identificada é formatada para o arquiteto com quatro blocos obrigatórios:

```
┌────────────────────────────────────────────────────────────────────────┐
│ STATUS: [ERROR]  |  CHECKPOINT: Mobiliário  |  CENA: 04                │
├────────────────────────────────────────────────────────────────────────┤
│ PROBLEMA:                                                              │
│ Cena 04 utiliza mobiliário diferente do render aprovado da Sala.       │
│                                                                        │
│ CENA:                                                                  │
│ Cena 04 — Sala de Estar (Ângulo Aberto)                                │
│                                                                        │
│ EVIDÊNCIA:                                                             │
│ O render homologado (RND-02) possui Sofá Curvo em Linho Cru e mesa de  │
│ centro orgânica em nogueira, enquanto o asset gerado apresenta sofá    │
│ modular retilíneo cinza e mesa metálica.                               │
│                                                                        │
│ RECOMENDAÇÃO:                                                          │
│ Substituir a cena pelo render homologado da Sala ou regenerar o asset  │
│ reforçando o mobiliário aprovado no prompt descritivo.                 │
│                                                                        │
│ AÇÕES DISPONÍVEIS:                                                     │
│ [ 🛠 Corrigir Manualmente ]  [ 🔄 Regenerar Asset ]  [ ⇄ Substituir Cena ]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## As 3 Ações de Resolução

O usuário tem à disposição três fluxos de resolução explícitos:

### 1. Corrigir Manualmente (`manual_fix`)
- Utilizado quando o arquiteto decide manter a cena mediante ajustes de parâmetros técnicos (duração, enquadramento, notas de cena) ou validação expressa com justificativa técnica.
- Abre modal onde o autor insere notas de auditoria e confirma a intervenção.

### 2. Regenerar Asset (`regenerate_asset`)
- Utilizado quando o conceito visual está correto, mas a inteligência artificial alucinou elementos (móveis, texturas ou geometria).
- Abre modal de ajuste de prompt que adiciona descritores restritivos e agenda nova geração com preservação de seed e referências.

### 3. Substituir Cena (`replace_scene`)
- Utilizado quando já existe um render ou asset homologado de qualidade superior no banco de dados do projeto.
- Abre catálogo de renders aprovados do ambiente e permite troca imediata sem necessidade de nova geração via IA.

---

## Auditoria e Relatório Executivo

O método `StudioState.generateVideoQAReport(qaId)` formata o dossiê formal de auditoria audiovisual contendo:
1. Cabeçalho com identificação do projeto, vídeo, data e auditor responsável.
2. Status geral e contadores consolidados.
3. Tabela de conformidade dos 13 checkpoints.
4. Lista completa de apontamentos pendentes e resolvidos com histórico de autor e justificativa.
5. Declaração explícita de inviolabilidade e conformidade com as diretrizes do estúdio.

---

## Integração na Pipeline

```
[G01-G05] Concepção, Roteiro & Storyboard
    ↓
[G06-G11] Seleção de Assets, Câmeras & Prompts
    ↓
[G12] Video Timeline Editor (Montagem Multi-Faixa)
    ↓
[G14] VIDEO QA ENGINE (Controle de Qualidade em 13 Pontos)
    ├── PASS / WARNING ──> Liberado para Render
    └── BLOCKED / ERROR ──> Bloqueio & Ações Humanas
                                (Corrigir / Regenerar / Substituir)
    ↓
[G13] Video Render Engine (Exportação MP4)
    ↓
[G15] (Aguardando próxima etapa da pipeline)
```
