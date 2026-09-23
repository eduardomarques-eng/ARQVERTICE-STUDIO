# Modelo de Dados: Sistema de Materiais e Revestimentos (MATERIAL_DATA_MODEL.md)

## 1. Estrutura de Tabelas e Relacionamentos

O esquema de dados em `database/schema/24_materials_and_coatings_system.sql` organiza o ecossistema de materiais:

### 1.1. `project_materials`
Entidade central de especificação por ambiente e projeto.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | VARCHAR(64) PK | Identificador único (`mat-...`) |
| `project_id` | VARCHAR(64) FK | Vínculo com projeto |
| `environment_id` | VARCHAR(64) FK | Vínculo com ambiente (opcional se diretriz global) |
| `category` | ENUM | 21 categorias canônicas |
| `name` | VARCHAR(255) | Nome descritivo do material |
| `description` | TEXT | Memorial descritivo |
| `application` | ENUM | Aplicação arquitetônica |
| `color` | VARCHAR(128) | Cor / tonalidade |
| `finish` | VARCHAR(128) | Acabamento superficial |
| `texture` | VARCHAR(128) | Textura aparente |
| `quantity_value` | NUMERIC(10,2) | Quantitativo estimado ou levantado |
| `quantity_unit` | ENUM | `M2`, `M`, `UN`, `M3`, `KG`, `L`, `KIT`, `OUTRA` |
| `is_conceptual` | BOOLEAN | `TRUE` se for conceito; `FALSE` se vinculado a produto |
| `product_id` | VARCHAR(64) FK | Chave estrangeira para `catalog_products` |
| `image_url` | TEXT | Imagem principal da amostra |
| `texture_url` | TEXT | Textura para motor de render |
| `product_photo_url` | TEXT | Foto de estúdio do produto |
| `applied_reference_url` | TEXT | Foto em ambiente real aplicado |
| `reference_text` | TEXT | Anotação de referência |
| `status` | ENUM | `DRAFT`, `SUGGESTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `SUPERSEDED` |
| `origin` | ENUM | 9 origens canônicas |
| `scope` | ENUM | `ENVIRONMENT_SPECIFIC`, `PROJECT_GUIDELINE`, `REPLICABLE` |
| `version_code` | VARCHAR(16) | Código de versão: `V01`, `V02`, `V03`... |
| `parent_material_id` | VARCHAR(64) FK | Material ancestral versionado |

---

## 2. Categorias Canônicas (21)

1. `PISO`: Pisos cerâmicos, porcelanatos, tacos, vinílicos, pedras para piso.
2. `PAREDE`: Alvenaria, drywall, revestimentos tridimensionais, tijolinhos.
3. `REVESTIMENTO`: Cerâmicas, azulejos, lastras e revestimentos gerais.
4. `TETO_FORRO`: Forro de gesso, forro mineral, forro ripado de madeira.
5. `PEDRA`: Mármores, granitos, quartzitos, limestones e pedras naturais.
6. `MADEIRA`: Madeiras maciças estruturais ou decorativas.
7. `MARCENARIA`: Lâminas naturais, MDF naval, compensados e fórmicas.
8. `PINTURA`: Tintas acrílicas, textura projetada, cimento queimado, cal.
9. `TECIDO`: Linho, veludo, couro natural, lona náutica.
10. `TAPETE`: Fibras naturais, sisal, nylon sob medida.
11. `METAL`: Perfis de alumínio, aço corten, inox, latão escovado.
12. `VIDRO`: Vidro float incolor, canelado, reflecta, temperado.
13. `LOUCA`: Cubas, bacias, tanques e louças de apoio.
14. `METAIS_SANITARIOS`: Torneiras, misturadores, chuveiros, válvulas.
15. `BANCADA`: Superfícies sólidas, silestone, dekton, granito levigado.
16. `RODAPE`: Rodapés em poliestireno, embutidos ou invertidos.
17. `DECK`: Decks modulares em cumaru, itaúba ou madeira plástica.
18. `EXTERNO`: Pedras para calçadas, fulget, drenantes e fachadas.
19. `PAISAGISMO`: Seixos, terra vegetal, casca de pinus, grama natural.
20. `ILUMINACAO`: Perfis de alumínio difusores, acrílicos leitosos.
21. `OUTRO`: Demais especificações especiais.

---

## 3. Aplicações e Unidades Canônicas

### 3.1. Aplicações (`material_application_enum`)
`PISO`, `PAREDE`, `PAINEL`, `BANCADA`, `FORRO`, `MARCENARIA`, `ELEMENTO_EXTERNO`, `RODAPE`, `DECK`, `TETO`, `OUTRA`.

### 3.2. Unidades (`material_unit_enum`)
`UN`, `M`, `M2`, `M3`, `KG`, `L`, `KIT`, `OUTRA`.
