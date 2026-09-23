# ArqVertice Studio — Conjuntos de Referência e Contexto Visual para IA (D02)

## 1. Visão Geral
O **VISUAL_REFERENCE_SET** (Conjunto de Referências Visuais) é o contêiner estruturado que agrupa e versiona a curadoria visual de um ambiente para geração e apresentação. Ele fornece à IA generativa o payload padronizado **`VISUAL_CONTEXT`**, garantindo que o renderizador compreenda exatamente o que reproduzir, o que considerar e o que ignorar.

---

## 2. Estrutura de Dados: `VISUAL_REFERENCE_SET`

Cada conjunto de referência é representado pelo seguinte esquema:

```typescript
interface VisualReferenceSet {
  id: string;                      // Identificador único (ex: 'vset-sala-01')
  projectId: string;               // ID do Projeto (ex: 'prj-praia-01')
  environmentId: string;           // ID do Ambiente (ex: 'amb-sala-01')
  name: string;                    // Nome do Conjunto (ex: 'Curadoria Principal - Living & Jantar')
  version: string;                 // Versão do Conjunto (ex: 'V01', 'V02')
  objective: string;               // Objetivo específico da curadoria
  priority: 'PRIMARY' | 'SECONDARY' | 'OPTIONAL'; // Prioridade do conjunto
  description: string;             // Descrição arquitetônica detalhada
  isActive: boolean;               // Indicador se é o conjunto ativo atual do ambiente
  itemIds: string[];               // Lista ordenada de IDs dos itens de referência
  metadata: Record<string, any>;   // Parâmetros adicionais (resolução alvo, estilo de render)
  createdAt: string;               // Timestamp ISO
  updatedAt: string;               // Timestamp ISO
}
```

---

## 3. Estrutura de Dados: Itens Curados (`visual_reference_items`)

Cada referência visual vinculada a um conjunto possui atributos enriquecidos:

```typescript
interface VisualReferenceItem {
  id: string;                      // ID do item curado
  setId: string;                   // ID do VISUAL_REFERENCE_SET pai
  assetId?: string;                // ID do asset original de levantamento (se houver)
  title: string;                   // Título da referência
  url: string;                     // URL do arquivo de imagem
  thumbnailUrl?: string;           // URL da miniatura
  referenceType:                   // 1 das 8 categorias canônicas
    | 'GEOMETRY_REFERENCE'
    | 'CAMERA_REFERENCE'
    | 'STYLE_REFERENCE'
    | 'MATERIAL_REFERENCE'
    | 'FURNITURE_REFERENCE'
    | 'LIGHTING_REFERENCE'
    | 'COMPOSITION_REFERENCE'
    | 'AESTHETIC_REFERENCE';
  priority:                        // Nível de prioridade na curadoria
    | 'PRIMARY'
    | 'SECONDARY'
    | 'OPTIONAL'
    | 'REJECTED';
  scopeNotes: string;              // Anotações de escopo ("Use somente material.", etc.)
  notes: string;                   // Observações arquitetônicas livres
  isExcludedFromGeneration: boolean;// Exclusão não-destrutiva
  exclusionReason?: string;        // Justificativa do arquiteto para exclusão
  sortOrder: number;               // Ordem relativa na apresentação e injeção
  
  // Metadados específicos para CAMERA_REFERENCE:
  cameraMeta?: {
    environment: string;           // Ambiente de aplicação
    direction: string;             // Direção do olhar
    framing: string;               // Enquadramento e lente
    origin: string;                // Origem (ex: Câmera Revit 01)
    description: string;           // Descrição da tomada
  };

  // Sugestões de IA assistida:
  aiSuggestions?: {
    suggestedType: string;
    detectedObjects: string[];
    detectedMaterials: string[];
    suggestedStyle: string;
    suggestedScope: string;
    confidence: number;
  };
}
```

---

## 4. O Payload Estruturado: `VISUAL_CONTEXT`

A função `StudioState.buildVisualContext(projectId, environmentId, setId)` sintetiza dinamicamente o contexto visual completo pronto para injeção em prompts ou APIs de IA generativa:

```json
{
  "projectId": "prj-praia-01",
  "environmentId": "amb-sala-01",
  "environmentName": "Living & Jantar Integrados",
  "version": "V01",
  "generatedAt": "2026-09-21T20:30:00.000Z",
  "visualReferenceSet": {
    "id": "vset-sala-01",
    "name": "Curadoria Principal - Living & Jantar",
    "objective": "Geração fotorrealista com atmosfera mediterrânea e luz natural abundante",
    "priority": "PRIMARY"
  },
  "geometry_references": [
    {
      "id": "vref-sala-01-geom",
      "title": "Planta Baixa Humanizada e Layout - Sala",
      "url": "assets/renders/sala_planta.png",
      "priority": "PRIMARY",
      "scopeNotes": "Gabarito dimensional estrito; manter vãos e aberturas exatamente como cotado."
    }
  ],
  "camera_references": [
    {
      "id": "vref-sala-02-cam",
      "title": "Perspectiva Revit - Ângulo da Entrada",
      "priority": "PRIMARY",
      "camera": {
        "environment": "Living & Jantar Integrados",
        "direction": "Norte-Noroeste voltada para o terraço",
        "framing": "Lente 24mm, 16:9, altura dos olhos 1.50m",
        "origin": "Revit 2026 - Câmera 01"
      }
    }
  ],
  "style_references": [
    {
      "id": "vref-sala-03-style",
      "title": "Referência de Estilo — Minimalismo Quente",
      "priority": "SECONDARY",
      "scopeNotes": "Essa imagem serve apenas para linguagem visual; não copiar arquitetura."
    }
  ],
  "material_references": [
    {
      "id": "vref-sala-04-mat",
      "title": "Pedra Quartzito Mont Blanc e Carvalho",
      "priority": "PRIMARY",
      "scopeNotes": "Usar textura e aparência da pedra no painel e carvalho natural na marcenaria; não reproduzir mobiliário."
    }
  ],
  "furniture_references": [
    {
      "id": "vref-sala-05-furn",
      "title": "Sofá Orgânico e Poltronas de Linho",
      "priority": "SECONDARY",
      "scopeNotes": "Referência do sofá curvo e poltronas; ignorar piso e iluminação da imagem de referência."
    }
  ],
  "lighting_references": [
    {
      "id": "vref-sala-06-light",
      "title": "Iluminação Difusa e Rasgo Linear no Gesso",
      "priority": "PRIMARY",
      "scopeNotes": "Use somente iluminação indireta a 2700K; sol da tarde entrando a 45 graus."
    }
  ],
  "composition_references": [
    {
      "id": "vref-sala-07-comp",
      "title": "Composição Editorial com Ponto de Fuga no Horizonte",
      "priority": "SECONDARY",
      "scopeNotes": "Usar composição com regra dos terços valorizando a integração living-varanda."
    }
  ],
  "approved_outputs": [
    {
      "id": "rend-sala-01",
      "title": "Render Aprovado V01",
      "url": "assets/renders/sala_render_final_v1.png",
      "status": "APPROVED",
      "approvalNotes": "Aprovado pelo cliente Pedro em 18/09/2026."
    }
  ],
  "restrictions": [
    "Não usar revestimento polido ou reflexivo no piso.",
    "Não alterar a posição dos pilares de concreto aparente.",
    "Não adicionar rebaixamento de gesso na área do pé-direito duplo."
  ],
  "decisions": [
    {
      "title": "Definição do Quartzito Mont Blanc",
      "category": "MATERIAL",
      "status": "APPROVED",
      "summary": "Mármore polido substituído por quartzito escovado por durabilidade e estética fosca."
    }
  ]
}
```

---

## 5. Auditoria de Categorização
Toda alteração de tipo (`referenceType`) ou prioridade (`priority`) aciona a função `logVisualReferenceAudit`:
* Registra o usuário que realizou a mudança.
* Registra o valor anterior e o novo valor.
* Garante integridade histórica e transparência em caso de regressão de qualidade no render.
