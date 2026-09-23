# Prompt Engine Audiovisual — ArqVertice Studio (Bloco G07)

## 1. Visão Geral e Objetivo

O **Prompt Engine (Bloco G07)** é o subsistema do ArqVertice Studio responsável por sintetizar e compilar prompts cinematográficos de altíssima fidelidade arquitetônica para ferramentas externas de geração audiovisual.

### Princípio Fundamental de Liberdade Tecnológica:
O ArqVertice Studio **não fica preso a um único fornecedor**. A arquitetura é estritamente **provider-agnostic**, permitindo o direcionamento de tomadas para múltiplos modelos de IA, ferramentas externas ou geradores locais, sem reescrever a inteligência de projeto.

---

## 2. Matriz de Provedores e Capacidades (Provider-Agnostic)

Diferentes APIs e ferramentas de vídeo possuem capacidades distintas. O sistema expõe uma matriz de capacidades (`getCapabilities`) para cada modelo, evitando premissas cegas de paridade funcional:

| Provedor | Modelos Típicos | Negative Prompt | Controle de Câmera | Força de Movimento | Duração Máx | Modo de Execução |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Gemini** | `gemini-2.0-flash`, `gemini-1.5-pro-vision` | Embutido (NLP) | Sim | Natural | 60s | Nuvem (API Multimodal) |
| **Google Flow / Veo** | `veo-2.0`, `veo-1.0` | Nativo | Sim (Tokens) | Sim (1-10) | 60s | Nuvem (Direct Video) |
| **Modelos Comerciais** | `runway-gen3-alpha`, `luma-dream-machine`, `kling-v1.5` | Nativo | Sim | Sim (1-10) | 10s | Nuvem (Direct Video) |
| **Ferramentas Externas** | `midjourney-v6-video`, `comfyui-workflow`, `controlnet` | Nativo | Descritivo | Parâmetros CLI | 30s | Manifesto / Export |
| **Geração Local Futura** | `wan-2.1-i2v-14b`, `svd-xt-1.1`, `animatediff-v3` | Nativo | Sim | Bucket ID / Steps | 15s | Local (API Local/GPU) |

---

## 3. Estrutura de Dados: `VideoPrompt`

Cada prompt compilado possui os seguintes campos canônicos:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `VARCHAR` | Identificador unívoco do prompt (`vp-...`) |
| `sceneId` | `VARCHAR` | Vínculo com a cena narrativa (`NarrativeScene` - G04) |
| `provider` | `VARCHAR` | Identificador do provedor (`gemini`, `google_veo`, etc.) |
| `model` | `VARCHAR` | Identificador do modelo do provedor (`veo-2.0`, etc.) |
| `prompt` | `TEXT` | Prompt principal gerado para o modelo |
| `negativePrompt` | `TEXT` | Restrições e termos a evitar |
| `referenceAssets` | `JSONB` | Lista de URLs e metadados de imagens de referência |
| `parameters` | `JSONB` | Parâmetros técnicos (aspectRatio, duration, motionStrength, fps) |
| `version` | `INTEGER` | Número incremental da versão (1, 2, 3...) |
| `versionLabel` | `VARCHAR` | Rótulo formatado da versão (`V01`, `V02`, `V03`) |
| `status` | `VARCHAR` | Status do prompt (`draft`, `compiled`, `ready_for_dispatch`, `dispatched`) |

---

## 4. O Compilador de Prompt (Prompt Compiler)

O compilador processa de forma determinística **11 fontes canônicas de contexto**:

1. **PROJETO**: Nome, tipologia, objetivos e diretrizes gerais.
2. **AMBIENTE**: Nome do cômodo, área útil, pé-direito e funcionalidade.
3. **ESTILO**: Partido arquitetônico (ex: Modernista, Tropical Litorâneo), atmosfera e paleta cromática.
4. **REFERÊNCIAS**: Ativos curados com prioridade `PRIMARY` (Bloco D02).
5. **IMAGEM BASE**: Render aprovado do storyboard (G06) ou perspectiva de referência.
6. **CÂMERA**: Enquadramento, altura em relação ao piso e distância focal da lente.
7. **MOVIMENTO**: Movimento cinemático de câmera (`STORYBOARD_MOVEMENTS`).
8. **ILUMINAÇÃO**: Orientação solar natural e projeto luminotécnico (temperatura 2700K, luz difusa).
9. **MATERIAIS**: Relação de materiais e revestimentos homologados no projeto.
10. **LOCKS**: Travamentos visuais e espaciais ativos (Bloco D07).
11. **OBJETIVO DA CENA**: Função dramática no arco narrativo (G04 / G05).

---

## 5. Os 8 Componentes Gerados na Saída

O compilador gera 8 blocos estruturados:

1. **Prompt Principal**: Diretriz cinematográfica mestre detalhando geometria, materiais, iluminação e ambiência.
2. **Restrições**: Termos proibidos, distorções de lente a evitar e artefatos de IA.
3. **Elementos a Preservar**: Declaração explícita de todos os locks vigentes.
4. **Movimento**: Instrução de cinética de câmera (velocidade constante, sem solavancos).
5. **Câmera**: Especificação de lente, altura e ângulo visual.
6. **Duração**: Tempo nominal da tomada em segundos.
7. **Formato**: Aspect ratio e taxa de quadros (ex.: `16:9 @ 24fps`).
8. **Observações**: Instruções operacionais para o despachador ou renderizador.

---

## 6. Regra Fundamental de Preservação de Locks

> [!IMPORTANT]
> **REGRA FUNDAMENTAL**:
> Não alterar:
> - geometria;
> - layout;
> - proporções;
> - aberturas;
> - materiais aprovados;
> - mobiliário aprovado;
> 
> quando esses itens estiverem bloqueados.
> O prompt compilado declara explicitamente essas restrições como salvaguarda inegociável.

---

## 7. Versionamento Não-Destrutivo

- **Política de Não-Apagar**: Prompts gerados anteriormente **nunca são excluídos**.
- Toda alteração, refinamento ou reprocessamento gera uma nova versão incremental (`V01` &rarr; `V02` &rarr; `V03`).
- As versões históricas são salvas na tabela `video_prompt_versions` com registro de autor, data e justificativa da mudança.
- O sistema permite comparar versões lado a lado (`compareVideoPromptVersions`).

---

## 8. Interface do Usuário

O módulo [`js/video-prompt-engine-module.js`](file:///c:/Users/erick/ARQVERTICE-STUDIO/js/video-prompt-engine-module.js) oferece:
- Seletor interativo de provedores e modelos com visualização das capacidades;
- Seletor de cenas e quadros de storyboard;
- Painel de exibição dos 8 blocos do prompt com destaque tipográfico;
- Botão de cópia rápida para a área de transferência (`📋 Copiar Prompt`);
- Modal de histórico de versões e comparador;
- Salvaguarda visual com lista de locks ativos em destaque âmbar.

---

*Módulo homologado no Bloco G07. Aguardando Bloco G08.*
