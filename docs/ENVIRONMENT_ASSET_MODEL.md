# ARQVERTICE STUDIO — MODELO DE ATIVOS DO AMBIENTE (C02)
## Estrutura do ENVIRONMENT_CONTEXT e Diretrizes Antialucinação da IA

---

### 1. O Pacote Consolidado `ENVIRONMENT_CONTEXT`

O objetivo final do Bloco C02 é fornecer ao motor de visualização e modelagem futura uma base limpa, estruturada e unificada por ambiente: o **`ENVIRONMENT_CONTEXT`**.

Este objeto reúne:
1. **Identificação Espacial:** Projeto, ambiente, pavimento, área útil e pé-direito.
2. **Planta Baixa Vigente (`floorPlan`):** Planta técnica com escala, orientação e versão congelada.
3. **Perspectivas e Câmeras Revit (`perspectives` / `cameras`):** Ângulos e vistas de câmera validadas.
4. **Conjuntos de Referências (`referenceSets`):** Agrupamentos homologados.
5. **Referências Aprovadas (`approvedReferences`):** Materiais, mobiliário e iluminação com prioridade `PRIMARY` ou `SECONDARY`.
6. **Referências Rejeitadas (`rejectedReferences`):** Restrições negativas a serem evitadas.
7. **Restrições Arquitetônicas (`restrictions`):** Mapeadas a partir do Briefing Técnico (C01).
8. **Status do Checklist (`checklistStatus`):** Percentual de maturidade e validação dos 8 itens.
9. **Sinalizadores de Incerteza (`unconfirmedFlags`):** Elementos que a base documental ainda não confirma.

---

### 2. Princípio da IA: Não Inventar Geometria

> [!WARNING]
> **REGRA CRÍTICA DE INTEGRIDADE GEOMÉTRICA:**
> A IA nunca deve inventar cotas, alvenarias, aberturas ou detalhes construtivos não comprovados pelas plantas técnicas ou perspectivas oficiais.

Se determinado dado não puder ser atestado formalmente na base de dados do levantamento, o sistema e a IA devem registrar o campo como:

- `UNKNOWN` (Desconhecido)
- ou `NOT_CONFIRMED` (Não Confirmado)

#### Exemplos de Aplicação:
- Se não houver planta cotada aprovada para o ambiente: `floorPlan: { status: "UNKNOWN" }`.
- Se as aberturas de esquadrias ainda não tiverem sido confirmadas em checklist: `unconfirmedFlags: ["OPENINGS_DOORS_WINDOWS_NOT_CONFIRMED"]`.
- Se o pé-direito não constar em corte ou elevação técnica: `ceilingHeightM: "NOT_CONFIRMED"`.

---

### 3. Exemplo do Payload JSON Gerado

```json
{
  "projectId": "prj-praia-01",
  "projectName": "Residência de Praia",
  "environmentId": "amb-sala-01",
  "environmentName": "Sala de Estar e Jantar Integrada",
  "floorLevel": "Térreo",
  "areaM2": 54.5,
  "ceilingHeightM": 3.2,
  "floorPlan": {
    "assetId": "asset-praia-planta-01",
    "title": "Planta Baixa Arquitetônica — Pavimento Térreo",
    "scale": "1:50",
    "orientation": "Norte Verdadeiro",
    "version": "PLANTA V01"
  },
  "perspectives": [
    {
      "camera": "Cam_Living_01",
      "phase": "Nova Construção",
      "approval": "APROVADA"
    }
  ],
  "referenceSets": [
    {
      "setId": "refset-praia-01",
      "name": "Sala — Referências Principais",
      "priority": "PRIMARY"
    }
  ],
  "approvedReferences": [
    {
      "title": "Linguagem Resort: Mármore Travertino e Forro de Gesso Liso",
      "category": "ESTILO",
      "priority": "PRIMARY"
    }
  ],
  "rejectedReferences": [
    {
      "title": "Piso em Porcelanato Alto Brilho Branco 120x120",
      "rejectionReason": "Cliente possui aversão expressa a revestimentos polidos e escorregadios em ambiente de praia com cão."
    }
  ],
  "checklistStatus": {
    "totalItems": 8,
    "completedItems": 8,
    "isFullyVerified": true
  },
  "unconfirmedFlags": [],
  "generatedAt": "2026-09-21T16:30:00Z"
}
```

---

### 4. Extensões do Bloco D01: Visualização, Câmeras e Renders

No Bloco D01, o `ENVIRONMENT_CONTEXT` é ampliado para suportar o pipeline completo de apresentação visual e integração com o Revit.

#### 4.1. Entidades Integradas

1. **`environment_visualizations`:**
   - `status`: `NOT_STARTED`, `PREPARING`, `READY`, `GENERATING`, `IN_REVIEW`, `APPROVED`, `SUPERSEDED`.
   - `active_version`: Versão ativa em trabalho (`V01`, `V02`...).
   - `primary_reference_id`: Ponteiro explícito para a referência estética mandatória (`PRIMARY`).
   - `approved_render_id`: Ponteiro para o render oficial homologado.
   - `is_generating`: Flag booleano de bloqueio contra disparos concorrentes.

2. **`environment_cameras`:**
   - Câmeras físicas e enquadramentos do Revit.
   - Parâmetros: `focal_length_mm`, `eye_height_m`, `target_height_m`, `aspect_ratio`, `is_approved`.

3. **`environment_renders`:**
   - Renders gerados ou exportados.
   - Metadados: `view_type`, `version`, `render_engine`, `resolution`, `status`, `approved_by`.

#### 4.2. Estrutura do Payload Consolidado de Visualização (`getEnvironmentVisualization`)

```json
{
  "visualization": {
    "environmentId": "amb-sala-01",
    "status": "APPROVED",
    "activeVersion": "V03",
    "isGenerating": false,
    "primaryReferenceId": "ref-sala-travertino",
    "approvedRenderId": "render-sala-02"
  },
  "primaryReference": {
    "id": "ref-sala-travertino",
    "title": "Mármore Travertino Navona e Forro de Gesso",
    "priority": "PRIMARY",
    "category": "MATERIAL"
  },
  "approvedRender": {
    "id": "render-sala-02",
    "imageUrl": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
    "version": "V03",
    "viewType": "Perspectiva Frontal Integrada",
    "approvedBy": "Eduardo Marques (Arquiteto Titular)"
  },
  "base": {
    "floorPlan": { "title": "Planta Baixa Oficial", "scale": "1:50", "orientation": "Norte" },
    "revitFiles": [
      { "fileName": "Residencia_Pedro_Sala_V02.rvt", "fileFormat": "RVT" }
    ],
    "perspectives": [
      { "title": "Perspectiva Sala / Varanda", "camera": "Cam_Living_01" }
    ],
    "conceptSummary": { "name": "Minimalismo Quente Praiano" },
    "guidelines": ["Integração visual com varanda gourmet"],
    "restrictions": ["Sem pisos polidos ou escorregadios"]
  },
  "visualContext": {
    "estilo": "Minimalismo acolhedor e atemporal",
    "paleta": "Tons areia, linho, bege e madeira freijó natural",
    "materiais": "Madeira carvalho e mármore travertino",
    "mobiliario": "Design brasileiro contemporâneo",
    "iluminacao": "Luz difusa 2700K com aberturas naturais",
    "elementosPreservados": "Vãos estruturais das esquadrias da fachada",
    "elementosEvitar": "Porcelanato polido de alto brilho"
  },
  "cameras": [
    { "cameraName": "Cam_Living_01", "focalLengthMm": 24, "eyeHeightM": 1.55 }
  ],
  "renders": [
    { "id": "render-sala-01", "version": "V01", "status": "SUPERSEDED" },
    { "id": "render-sala-02", "version": "V03", "status": "APPROVED" }
  ]
}
```

