# PLANTAS HUMANIZADAS NO SISTEMA DE APRESENTAÇÃO — ARQVERTICE STUDIO

## 1. Visão Geral
A integração de **Plantas Baixas Humanizadas** no motor de apresentação do ArqVertice Studio permite diagramar representações visuais ricas de ambientes, unindo o rigor métrico da geometria arquitetônica com acabamento estético fotorrealista e conceitual (texturas, pisos, mobiliário, sombras projetadas e ambientação).

---

## 2. Camadas de Renderização e Diagramação (Layer Stack)
As plantas humanizadas diagramadas nas pranchas técnicas respeitam a hierarquia de renderização:

1. **Camada 0 — Base Técnica**: Alvenarias, aberturas de vãos, esquadrias e delimitação de soleiras.
2. **Camada 1 — Paginação de Pisos e Acabamentos**: Texturas de alta resolução (madeira corrida, porcelanato acetinado, mármore Calacatta, granilite, grama e decks).
3. **Camada 2 — Mobiliário Humanizado (Top View)**: Blocos vetorizados ou texturizados de mobiliário em conformidade com o catálogo canônico F08.
4. **Camada 3 — Sombras e Oclusão**: Sombras suaves projetadas (Soft Shadows a 45°) para transmissão de profundidade volumétrica e pé-direito.
5. **Camada 4 — Textos, Cotas e Identificadores**: Identificadores de ambientes, cotas de nível e nomes de cômodos com contraste e legibilidade garantida.

---

## 3. Inserção em Pranchas Técnicas (Sheet Engine)
- **Tipo de Elemento**: `planta` / `humanized_plan`
- **Área Útil**: Respeita os limites da `printableArea` calculada pelo perfil de formato da folha (NBR 10068).
- **Proporção**: O aspect ratio do desenho é estritamente travado, impedindo deformações no eixo X ou Y.
- **Escala de Diagramação**: Vinculada ao viewport da prancha (ex.: 1:50, 1:25 ou 1:100).

---

## 4. Resoluções e Exportação
- **Tela**: Renderizado dinamicamente via canvas ou SVG vetorial a 96 DPI com interpolação bicúbica.
- **Impressão Técnica / PDF**: Exportado a 300 DPI nominais, garantindo nitidez nas tramas e texturas dos materiais.
- **Resoluções Canônicas**:
  - `THUMBNAIL`: 0.25x (visão geral e índices)
  - `OTIMIZADA`: 0.5x (visualização interativa fluida)
  - `ORIGINAL / ALTA`: 1.0x (impressão executiva final e pranchas A1/A0)

---

## 5. Auditoria de QA e Integridade (F11)
- O motor de QA verifica se todo elemento do tipo `planta` possui fonte de dados ou URI válida.
- Elementos desprovidos de arquivo de origem ou sem URL configurada geram status `ERROR` no checkpoint `IMAGENS`, bloqueando a emissão final no Centro de Entrega.
