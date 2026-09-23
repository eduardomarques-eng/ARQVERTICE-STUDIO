# ================================================================
# ARQVERTICE STUDIO — CONTEXTO PARA IA & HIERARQUIA (C04)
# PROJECT_DESIGN_CONTEXT.md
# ================================================================

VERSÃO: C04.1
DOCUMENTAÇÃO: ESTRUTURA CANÔNICA DE CONTEXTO E SISTEMA HIERÁRQUICO

---

## 1. HIERARQUIA DE RESOLUÇÃO EM 3 NÍVEIS

Para garantir consistência global e flexibilidade local, as diretrizes de projeto são resolvidas em 3 camadas de prioridade decrescente de especificidade:

```
                  ┌────────────────────────────────────────┐
NÍVEL 3 (MÁXIMO)  │              IMAGE_LEVEL               │  (Foco de câmera, luz da cena)
                  └───────────────────┬────────────────────┘
                                      │ herda com sobreposição pontual
                  ┌───────────────────▼────────────────────┐
NÍVEL 2 (MÉDIO)   │           ENVIRONMENT_LEVEL            │  (Sala de Estar, Suíte Master...)
                  └───────────────────┬────────────────────┘
                                      │ herda com sobreposição consciente
                  ┌───────────────────▼────────────────────┐
NÍVEL 1 (BASE)    │             PROJECT_LEVEL              │  (Conceito Geral, DNA do Projeto)
                  └────────────────────────────────────────┘
```

### Regras de Herança e Resolução:
1. **Herança Automática:** Um ambiente herda 100% das diretrizes do `PROJECT_LEVEL` a menos que defina sobreposições explícitas (`hasSpecificDirectives = true`).
2. **Sobreposição Consciente:** Apenas os campos explicitamente preenchidos no ambiente (ex: `materialOverrides`, `lightingOverrides`) sobrepõem os valores do projeto. Todos os demais campos continuam herdando do projeto.
3. **Nível de Imagem:** Utilizado em prompts de renderização pontual ou composições de câmeras específicas (ex: "plano detalhe da bancada ao entardecer").

---

## 2. ESTRUTURA CANÔNICA `PROJECT_DESIGN_CONTEXT`

O payload `PROJECT_DESIGN_CONTEXT` consolida todo o conhecimento validado até a fase C04 em uma estrutura JSON otimizada para ingestão por agentes de IA e renderizadores:

```json
{
  "project": {
    "id": "prj-praia-01",
    "name": "Residência Mar Aberto",
    "code": "RMA-01",
    "resolvedLevel": "ENVIRONMENT_LEVEL",
    "targetEnvironment": "Living & Varanda Integrada"
  },
  "concept": {
    "version": "V01",
    "status": "APPROVED",
    "name": "Refúgio Litorâneo Contemporâneo & Biofílico",
    "originalNarrative": "Texto completo autoral do arquiteto preservado sem alterações...",
    "keywords": ["biofilia", "madeira natural", "transparência", "luz rasante"],
    "structuredTags": {
      "spatial_character": "fluido e permeável",
      "lighting_mood": "caloroso e cênico",
      "material_tone": "autêntico e tátil"
    }
  },
  "style": {
    "primary": "Contemporâneo",
    "secondary": "Biofílico",
    "influences": "Brasileiro Modernista, Arquitetura Costeira"
  },
  "palette": [
    { "code": "AV-SAND-01", "name": "Areia Litorânea", "hex": "#E8E1D5", "role": "PREDOMINANTE" },
    { "code": "AV-TERRA-02", "name": "Terracota Queimada", "hex": "#B85D3B", "role": "ACENTO" }
  ],
  "materials": {
    "floor": "Granito escovado e assoalho de cumaru",
    "walls": "Pintura mineral mate e painéis em freijó",
    "countertops": "Quartzito natural Mont Blanc escovado"
  },
  "desired_elements": [
    "madeira natural maciça com veios visíveis",
    "vegetação tropical nativa integrada",
    "brises pivotantes de sombreamento"
  ],
  "avoid_elements": [
    "porcelanato brilhante polido espelhado",
    "cores fluorescentes ou primárias berrantes",
    "luz tubular fria de 6500K"
  ],
  "lighting": {
    "general": "Difusa indireta 2700K",
    "colorTemperature": "2700K",
    "notes": "Luz quente acolhedora valorizando texturas táteis"
  },
  "furniture": {
    "existing": ["Poltrona Mole Sergio Rodrigues em jacarandá"],
    "desired": ["Sofá modular em linho cru baixo"],
    "forbidden": ["Móveis com estrutura plástica brilhante"]
  },
  "environment_directives": {
    "environmentId": "env-living",
    "environmentName": "Living & Varanda Integrada",
    "specificDirectives": "Integração total do piso nivelado entre sala e deck de cumaru..."
  },
  "approved_studies": [
    {
      "id": "std-01-layout",
      "name": "Estudo de Layout Integrado",
      "type": "LAYOUT",
      "version": "V02",
      "status": "APPROVED"
    }
  ],
  "approved_references": [
    {
      "id": "srv-ref-01",
      "name": "Casa de Campo - Living Integrado",
      "category": "REFERENCIA_VISUAL",
      "isApproved": true
    }
  ]
}
```

---

## 3. DIRETRIZES DE CONSUMO PARA IA E RENDERERS

1. **Preservação Semântica Inviolável:** A IA **nunca altera o significado, tom ou autoria** dos textos originais do arquiteto. O texto do arquiteto é fonte primária inalterável.
2. **Transformação Estruturada:** A IA atua extraindo tags, palavras-chave e parâmetros numéricos de suporte a partir da narrativa (ex: `temperatura: 2700K`, `nível de brilho: mate`, `roughness: 0.85`).
3. **Filtragem por Status:** Somente conceitos com status `APPROVED` devem ser utilizados para automação ou rendering final, salvo quando o usuário selecionar explicitamente uma versão `DRAFT` ou `IN_REVIEW` para experimentação assistida.
