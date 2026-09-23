# ArqVértice Studio — Layout e Composição de Moodboard (E04)

## 1. Princípios do Motor de Blocos (Block Engine)

O layout do Moodboard no ArqVértice não busca emular ferramentas de desenho vetorial livre (como Canva ou Figma), mas sim fornecer um **editor de composição controlado, harmônico e rigorosamente alinhado à prática arquitetônica**.

Cada prancha é regida por uma malha modular baseada em CSS Grid com colunas configuráveis (padrão de 12 colunas) e proporções físicas estritas.

---

## 2. Tipos Canônicos de Blocos (`itemType`)

O sistema suporta 12 tipos canônicos de elementos:

| Tipo | Descrição | Comportamento Gráfico |
|---|---|---|
| `RENDER` | Perspectiva 3D fotorrealista aprovada | Destaque como imagem principal (*Hero*), selo visual "RENDER APROVADO". |
| `MATERIAL` | Amostra física de revestimento/acabamento | Foto da textura, nome, produto, código, acabamento, dimensões e fornecedor. |
| `FURNITURE` | Peça de mobiliário ou marcenaria | Foto de catálogo, nome, dimensões (L x P x A), fabricante e SKU. |
| `PRODUCT` | Equipamento, louça, metal sanitário ou eletrodoméstico | Foto, marca, modelo e especificações de instalação. |
| `COLOR` | Tom cromático da paleta | Swatch de cor, código de catálogo (Pantone, NCS, Suvinil, Coral) e uso sugerido. |
| `TEXTURE` | Detalhe de textura em macrofotografia | Foco táctil em tecidos, tramas e veios de pedra. |
| `REFERENCE` | Referência projetual ou imagem inspiracional | Tag de categoria de referência (iluminação, volumetria, paisagismo). |
| `TEXT` | Declaração conceitual ou notas do arquiteto | Bloco tipográfico elegante com citação de intenção projetual. |
| `QUANTITY` | Cartão de quantitativo numérico | Destaque numérico de área/volume com link "Ver Detalhamento" para E03. |
| `SUPPLIER` | Informações de contato e dados do fornecedor | Ficha comercial de compra e atendimento. |
| `OTHER` | Elemento livre complementar | Bloco genérico com imagem e texto. |

---

## 3. Dimensionamento e Alinhamento

Cada bloco define duas propriedades dimensionais essenciais:

### Largura na Grade (`gridWidth`)
- `FULL` (12 colunas): Ocupa a largura total da prancha.
- `TWO_THIRDS` (8 colunas): Bloco amplo de destaque.
- `HALF` (6 colunas): Metade da prancha (composição 50/50).
- `THIRD` (4 colunas): Um terço da prancha (composição clássica de 3 itens por linha).
- `QUARTER` (3 colunas): Um quarto da prancha (4 itens por linha, ideal para paletas e amostras).

### Altura do Cartão (`cardSize`)
- `HERO`: Altura ampliada (380px), reservada para a perspectiva aprovada.
- `LARGE`: Altura média-alta (280px).
- `MEDIUM`: Altura padrão (180px para imagem + ficha técnica).
- `SMALL`: Altura compacta (chips e cartões quantitativos).

---

## 4. Tipografia Centralizada (Item 16)

A identidade tipográfica é centralizada em configuração através de três temas estilísticos:

1. **`MODERN_SANS` (Padrão ArqVértice)**:
   - Fontes: *Inter*, *Segoe UI*, sem serifa, legibilidade cirúrgica, estética corporativa contemporânea.
2. **`ELEGANT_SERIF`**:
   - Fontes: *Playfair Display*, *Georgia*, serifada nobre, ideal para residências de altíssimo luxo e hotelaria boutique.
3. **`TECHNICAL_MONO`**:
   - Fontes: *JetBrains Mono*, *Fira Code*, monoespaçada, recomendada para pranchas de especificação executiva de obra.

---

## 5. Reordenação e Edição Interativa

Cada bloco não aprovado possui botões flutuantes para:
- Mover para a esquerda/acima (`moveBlock(mbId, itemId, -1)`).
- Mover para a direita/abaixo (`moveBlock(mbId, itemId, +1)`).
- Editar propriedades e atributos.
- Excluir bloco.
