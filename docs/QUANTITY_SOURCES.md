# Taxonomia de Origens e Fontes de Dados (Bloco E03)

Para assegurar a rastreabilidade e evitar que estimativas preliminares sejam tratadas como dados de produção executiva, o ArqVértice Studio implementa uma taxonomia rigorosa de origens e fontes.

---

## 1. Tipos de Origem (`origin_type`)

| Tipo | Descrição | Nível de Confiabilidade |
| :--- | :--- | :--- |
| `MEASURED` | Medição direta confirmada em planta executiva, as-built ou levantamento topográfico/in loco. | **Máximo (Homologado)** |
| `CALCULATED` | Valor deduzido por fórmula matemática exata (ex.: perímetro da sala $\times$ altura do pé-direito). | **Alto** |
| `IMPORTED` | Dado proveniente de modelo BIM externo estruturado (ex.: Autodesk Revit Material Takeoff). | **Alto (Auditável)** |
| `MANUAL` | Entrada direta realizada pelo usuário sem vínculo com modelo ou fórmula matemática. | **Médio (Depende de revisão)** |
| `ESTIMATED_BY_AI` | Estimativa preliminar aproximada via visão computacional ou inferência visual de IA. | **Provisório (Exige Homologação)** |
| `UNKNOWN` | Dado herdado sem metadados comprovados de origem. | **Indeterminado** |

---

## 2. Tipos de Fonte Específica (`source_type`)

- `PROJECT_DATA`: Extraído do banco de dados oficial cadastrado no ArqVértice Studio (áreas cadastradas no Bloco A04 / Levantamento C02).
- `USER_MEASUREMENT`: Medição informada diretamente pelo arquiteto com trena a laser ou conferência física.
- `REVIT_IMPORT`: Importado de arquivo de projeto do Autodesk Revit (`.rvt`, `.txt`, `.csv`), retendo o ID do elemento e o arquivo de procedência.
- `SPREADSHEET_IMPORT`: Importado de planilhas orçamentárias externas de obra (`.xlsx`, `.csv`).
- `CALCULATED_FORMULA`: Deduzido a partir de relacionamentos espaciais internos.
- `VISUAL_ESTIMATE`: Estimativa baseada em render, fotografia ou estudo volumétrico preliminar.
- `MANUAL_INPUT`: Digitação avulsa do especificador.

---

## 3. Origem Autodesk Revit (Item 15)

Quando dados são importados do Revit:
1. A fonte é registrada indelevelmente como `sourceType = REVIT_IMPORT`.
2. O arquivo de procedência (`sourceFileRef`, ex.: `Residencia_Praia_Executivo_R03.rvt`) é preservado no registro.
3. Os metadados de categoria BIM (`revitCategory`, ex.: `Floors`, `Walls`) e o ID do elemento (`revitElementId`) são salvos, facilitando a compatibilização bidirecional.
