# ArqVértice Studio — Interface de Provedor de Geração Visual

## 0. Objetivo

Desacoplar totalmente as regras de negócio de arquitetura de interiores do ArqVértice Studio de serviços comerciais de inteligência artificial ou render engines externos.

---

## 1. Definição da Classe Abstrata `VisualGenerationProvider`

```javascript
class VisualGenerationProvider {
  constructor(config = {}) {
    this.name = config.name || 'unnamed-provider';
    this.config = config;
  }

  /**
   * Operação principal de geração a partir do pacote compilado
   */
  async generateImage(job, compiledContext, options = {}) {
    throw new Error('generateImage() deve ser implementado pelo provedor.');
  }

  /**
   * Edição com inpainting ou ajustes finos preservando contexto
   */
  async editImage(job, compiledContext, baseImageUrl, options = {}) {
    throw new Error('editImage() deve ser implementado pelo provedor.');
  }

  /**
   * Variação estética a partir de render base homologado
   */
  async createVariation(job, compiledContext, baseImageUrl, options = {}) {
    throw new Error('createVariation() deve ser implementado pelo provedor.');
  }

  /**
   * Capacidades técnicas suportadas
   */
  getCapabilities() {
    return {
      providerName: this.name,
      supportedModels: [],
      supportsInpainting: false,
      supportsVariations: false,
      supportsWeighting: false,
      maxResolution: '4K',
      requiresBackendProxy: true
    };
  }
}
```

---

## 2. Contrato de Retorno (`ProviderOutput`)

Toda chamada bem-sucedida deve resolver um objeto padronizado com os seguintes campos:

```json
{
  "imageUrl": "https://.../render-final.jpg",
  "thumbnailUrl": "https://.../render-thumb.jpg",
  "seed": 42001,
  "tokensUsed": 1850,
  "estimatedCostUsd": 0.040,
  "currency": "USD",
  "providerResponseId": "gemini-resp-42001",
  "resolution": "4K UHD (3840x2160)",
  "aspectRatio": "16:9",
  "modelUsed": "imagen-3.0-generate-002",
  "providerUsed": "gemini",
  "generatedAt": "2026-09-21T15:28:00Z",
  "metadata": {
    "generationEngine": "Gemini Imagen 3 via ArqVértice Gateway",
    "guidanceScale": 8.0,
    "qualityScore": 0.99
  }
}
```

---

## 3. Gestão de Custos e Rastreabilidade do Modelo

1. **Transparência de Modelo**: É terminantemente proibido omitir ou mascarar qual modelo e provider geraram uma imagem. O campo `modelUsed` e `providerUsed` são persistidos permanentemente no `RENDER_JOB` e em `environment_renders`.
2. **Custos & Tokens**: Caso o provedor forneça consumo de tokens ou créditos, estes são computados em `estimatedCostUsd` e `tokensUsed`. Se não fornecer, a aplicação registra `0` sem bloquear a renderização.

---

## 4. Registro Central (`RenderProviderRegistry`)

Permite registrar novos provedores em tempo de execução (ex: Stable Diffusion XL, Flux Pro, Midjourney API, Enscape Cloud):

```javascript
RenderProviderRegistry.register('flux-pro', new FluxProVisualProvider());
const provider = RenderProviderRegistry.get('flux-pro');
```
