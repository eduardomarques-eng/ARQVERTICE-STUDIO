# ARQVERTICE STUDIO — AI PROVIDERS DIRECTORY

> **Versão:** 1.0.0  
> **Status:** Ativo  
> **Camada:** Provider Adapters (`js/ai-foundation.js`, `js/render-providers.js`, `js/video-prompt-providers.js`)

---

## 1. Visão Geral

O ArqVértice Studio opera com múltiplos provedores de inteligência artificial categorizados de acordo com sua função e modelo de implantação (Cloud vs. Local). Nenhum provedor é chamado diretamente pelos componentes visuais; todas as solicitações são intermediadas pelo `AIRouter`.

---

## 2. Catálogo de Provedores Conectados

### 2.1. Visual Rendering Providers (Geração e Render de Imagens)

| Provedor ID | Nome Oficial | Tipo | Autenticação | Modelos Suportados | Propósito no ArqVértice |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gemini-imagen` | Google Cloud Vertex AI (Imagen 3) | Cloud (Backend) | Server-side API Key / ADC | `imagen-3.0-generate-002`, `imagen-3.0-fast-generate-001` | Renders conceituais fotorrealistas de arquitetura e interiores. |
| `mock-visual` | ArqVértice Mock Visual Engine | Local / Determinístico | Nenhuma | `mock-architectural-preview-v1` | Desenvolvimento local offline, suítes de teste de integração e fallback de emergência. |

### 2.2. Video Prompt Generation Providers (Direção Audiovisual)

| Provedor ID | Nome Oficial | Tipo | Formato de Saída | Modelos Suportados | Propósito no ArqVértice |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gemini-video-prompt` | Google DeepMind Gemini | Cloud | JSON / Texto Estruturado | `gemini-2.0-flash`, `gemini-1.5-pro` | Geração de prompts cinematográficos para vídeo com base no briefing BIM. |
| `veo-director` | Google Veo Provider | Cloud | Prompt Cinematográfico | `veo-2.0` | Câmera lenta, movimentos arquitetônicos suaves (dolly, tilt) e iluminação física. |
| `runway-director` | RunwayML Gen-3 Alpha | Cloud | Prompt Textual com Câmera | `gen-3-alpha` | Rotações de fachada e transições estéticas para apresentações com clientes. |
| `luma-director` | Luma Dream Machine | Cloud | Prompt com Parâmetros de Lente | `dream-machine-v1.5` | Planos aéreos amplos, drones virtuais e contextualização de entorno urbano. |
| `kling-director` | Kuaishou Kling AI | Cloud | Prompt Textual Multilíngue | `kling-1.5-pro` | Cenas de interiores com iluminação indireta e dinâmicas de pessoas no espaço. |
| `comfyui-director` | ComfyUI Workflow Bridge | Local / Auto-hospedado | Graph JSON / Prompt | Workflows Customizados (AnimateDiff, SVD) | Render e animação em estações locais com controle milimétrico de seeds. |
| `wan-director` | Wan 2.1 (Open Video Model) | Local / Auto-hospedado | Prompt com Parâmetros de Movimento | `wan-2.1-t2v-14b`, `wan-2.1-i2v-14b` | Geração de vídeo open-weights executada localmente sem custos de API por frame. |

### 2.3. Decision & Structural Guidance Providers

| Provedor ID | Nome Oficial | Tipo | Modelos Suportados | Propósito no ArqVértice |
| :--- | :--- | :--- | :--- | :--- |
| `jev-decision-foundation` | Jev Architectural Engine | Heurístico / Em Preparação | `jev-decision-foundation-v1` | Validação de fluxos de projeto, priorização de tarefas e compatibilização estrutural. |

---

## 3. Segurança e Governança de Chaves

1. **Isolamento de Secrets:** Nenhuma chave (`GEMINI_API_KEY`, `RUNWAY_API_SECRET`, etc.) é exposta no navegador ou em variáveis de ambiente com prefixo `NEXT_PUBLIC_` / `VITE_`.
2. **Proxy pelo Backend:** As requisições de clientes transitam por endpoints autenticados do `server.js` (porta 3000), onde são validadas as permissões e cotas antes do repasse às APIs externas.
3. **Auditoria de Requisições:** Cada chamada externa tem seu tempo de resposta e status registrados no `AIObservability`.
