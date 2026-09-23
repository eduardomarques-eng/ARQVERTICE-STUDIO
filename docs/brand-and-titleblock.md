# Sistema de Identidade Visual e Carimbos Técnicos (Titleblock) — ArqVértice Studio

> **Documento Técnico Oficial — Bloco F05**  
> **Status:** Implementado e Homologado (13/13 testes automatizados aprovados)  
> **Compatibilidade:** Totalmente integrado ao Motor de Pranchas (F02) e Sistema de Formatos Físicos ABNT/NBR (F03)

---

## 1. Visão Geral e Princípios Fundamentais

O sistema de identidade visual das apresentações e pranchas do **ArqVértice Studio** foi concebido sob princípios estritos de preservação autoral e fidelidade à marca:

* 🚫 **NÃO INVENTAR LOGO:** O sistema não cria marcas fictícias nem substitui os símbolos gráficos estabelecidos.
* 🚫 **NÃO GERAR LOGO AUTOMATICAMENTE:** Nenhum gerador aleatório de imagem ou IA generativa substitui o logo da empresa.
* 🚫 **NÃO SUBSTITUIR O LOGO ENVIADO:** O logo oficial fornecido no workspace (`logo.png` e referências em `99_REFERENCIAS/logos/logo-arqvertice.png`) é a autoridade máxima e padrão primário do sistema.
* 🔒 **PROPORÇÃO INTOCÁVEL:** O logo e seus elementos derivados **nunca sofrem deformação** dimensional (`object-fit: contain` e cálculo estrito de aspect ratio).
* 🔄 **PRESERVAÇÃO E REUTILIZAÇÃO:** As identidades visuais são desacopladas como entidades independentes (`BrandProfile`), permitindo sua reutilização em múltiplos projetos e pranchas.

---

## 2. Brand Assets do Estúdio

O estúdio organiza os ativos visuais nos 6 tipos canônicos exigidos pela especificação:

| Asset Type | Campo Canônico | Descrição Técnica | Asset Padrão |
| :--- | :--- | :--- | :--- |
| **Logo Principal** | `logoPrincipal` | Versão horizontal completa oficial para cabeçalhos e carimbos principais | `logo.png` (Aspect ratio 4:1) |
| **Logo Monocromático**| `logoMonocromatico` | Versão em preto e branco ou vetor vazado para plantas técnicas de alto contraste | `logo.png` (Normalizado em tons escuros) |
| **Símbolo** | `simbolo` | Ícone/isótipo quadrado reduzido para marcas d'água, carimbos compactos e avatares | `logo.png` |
| **Favicon** | `favicon` | Ícone quadrado de baixa resolução (32x32px / 64x64px) para abas de navegador | `logo.png` |
| **Assinatura** | `assinatura` | Assinatura profissional do arquiteto responsável (CAU/BR ou CREA) | `logo.png` |
| **Elementos Gráficos**| `elementosGraficos`| Padrões geométricos, marcações de escala, fios de corte e vinhetas institucionais | Array dinâmico de assets |

### 2.1 Mecanismo de Upload
* A interface modal de gestão de marca disponibiliza botões de upload dedicados para cada um dos tipos de asset.
* Suporta arquivos de imagem nos formatos `PNG`, `SVG`, `JPEG` e `WebP`.
* O processamento converte os arquivos em `dataURL` / Base64 seguro ou armazena o caminho local, calculando instantaneamente as dimensões naturais (`width`, `height`) e travando a razão de aspecto (`aspectRatio = width / height`).

---

## 3. Carimbo Técnico (Titleblock) Configurável

O carimbo arquitetônico é modelado como um elemento nativo de prancha (`type: 'carimbo'`), integrando dados institucionais, do projeto, da prancha e de responsabilidade técnica.

### 3.1 Os 12 Campos Canônicos Obrigatórios

Em total conformidade com a norma **ABNT NBR 6492** (Representação de projetos de arquitetura), o componente processa rigorosamente os 12 campos canônicos:

| # | Campo | Identificador | Origem Primária de Dados | Exemplo Típico |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Escritório** | `escritorio` | `BrandProfile.titleblockConfig.fields.escritorio` | `ARQVÉRTICE STUDIO DE ARQUITETURA` |
| **2** | **Responsável** | `responsavel` | `Project.leadArchitect` ou CAU/CREA | `Arq. Eduardo Marques • CAU A00000-0` |
| **3** | **Projeto** | `projeto` | `Project.name` | `Residência de Praia • Lote 14` |
| **4** | **Cliente** | `cliente` | `Client.name` | `Pedro & Família` |
| **5** | **Ambiente** | `ambiente` | `SheetElement.content.ambiente` ou Prancha | `Living Integrado & Área Gourmet` |
| **6** | **Desenho** | `desenho` | `Sheet.title` ou conteúdo específico | `Planta Humanizada e Layout Mobiliário` |
| **7** | **Escala** | `escala` | `Sheet.scale` | `1:50` (ou `Indicada`) |
| **8** | **Folha** | `folha` | `Sheet.sheetNumber` | `PR-01/08` |
| **9** | **Revisão** | `revisao` | `StudioState.formatRevisionString()` | `REV 00`, `REV 01`, `REV 02` |
| **10**| **Data** | `data` | Data de emissão da prancha | `22/09/2026` |
| **11**| **Autor** | `autor` | Equipe de desenvolvimento técnico | `Equipe ArqVértice Studio` |
| **12**| **Observação** | `observacao` | Notas de aprovação preliminar ou notas de obra | `Desenho para aprovação. Medidas em cm.` |

---

## 4. Variações e Templates de Carimbo

O sistema disponibiliza 4 templates pré-configurados para diferentes tipos e escalas de prancha:

### 4.1 ABNT NBR 6492 (Executivo Oficial)
* **Dimensões nominais:** 178 mm de largura × 55 mm de altura (proporção oficial da NBR 6492 para dobra padrão de 185 mm).
* **Estrutura:** Cabeçalho com logo do escritório e dados de responsabilidade; corpo dividido em células técnicas para Projeto, Cliente, Conteúdo e Ambiente; barra inferior monoespaçada com Escala, Folha, Revisão, Data e Autor; rodapé de notas técnicas.
* **Uso recomendado:** Pranchas executivas completas em A1, A2 e A3.

### 4.2 Compacto Horizontal (Rodapé de Apresentação)
* **Dimensões nominais:** 240 mm de largura × 35 mm de altura.
* **Estrutura:** Faixa horizontal elegante de perfil baixo, distribuída em três blocos (marca à esquerda, dados do projeto ao centro, badges técnicos à direita).
* **Uso recomendado:** Pranchas com foco visual dominante (render 3D, moodboards conceituais e perspectivas).

### 4.3 Coluna Lateral (Faixa Vertical Contínua)
* **Dimensões nominais:** 80 mm de largura × altura total da área útil (`printableArea.height`).
* **Estrutura:** Faixa vertical disposta rente à margem direita da prancha, contendo logo verticalizado, pilha de dados e espaço livre para anotações e carimbos de aprovação de prefeitura/condomínio.
* **Uso recomendado:** Pranchas A1 e A2 em orientação paisagem com múltiplas plantas e elevações.

### 4.4 Minimalista Contemporâneo
* **Dimensões nominais:** 150 mm de largura × 45 mm de altura.
* **Estrutura:** Tipografia leve, sem bordas pesadas ou caixas fechadas, enfatizando sutileza e elegância.
* **Uso recomendado:** Cadernos de estudo preliminar, pranchas conceituais A4 e livros de especificações.

---

## 5. Posicionamento e Ancoragem na Área Útil

O posicionamento do carimbo segue o princípio da conformidade geométrica:

* O carimbo é ancorado utilizando as coordenadas da **`printableArea`** calculadas pelo `FormatProfile` do Bloco F03.
* **Canto Inferior Direito:** A posição `(x, y)` é calculada por:
  $$\text{pos.x} = \text{printableArea.x} + \text{printableArea.width} - \text{width}$$
  $$\text{pos.y} = \text{printableArea.y} + \text{printableArea.height} - \text{height}$$
* **Garantia anti-transbordo:** O carimbo jamais invade as margens técnicas de encadernação (25 mm à esquerda) nem ultrapassa a margem inferior da folha física.
* **Botão "Ancorar na Área Útil":** Disponível no painel do inspetor para recalcular instantaneamente a posição ideal caso a prancha mude de formato ou margens.

---

## 6. Elemento Logo: Proporção, Posição e Margens

O elemento `logo` na prancha conta com controles de proteção contra deformação:

* `object-fit: contain;` — Garante que a proporção original do arquivo real seja rigorosamente respeitada, sem esticar ou achatar a imagem sob qualquer dimensão de caixa.
* `margin` configurável em pixels (adicionado como padding interno da caixa delimitadora).
* `lockAspectRatio: true` por padrão — Bloqueia a edição desproporcional nos manipuladores de redimensionamento da prancha.

---

## 7. Sistema de Revisão Técnica

O controle de revisão suporta o ciclo de vida completo de desenvolvimento arquitetônico:

### 7.1 Padrão Oficial
* `REV 00` — Estudo preliminar / Emissão inicial
* `REV 01` — Anteprojeto / Ajustes de cliente
* `REV 02` — Projeto executivo / Compatibilização

### 7.2 Padrões Configuráveis
O estúdio pode alterar o padrão de nomenclatura a qualquer momento através de tokens:
* `REV {NN}` → `REV 00`, `REV 01`, `REV 02` (Padrão canônico)
* `REV {N}` → `REV 0`, `REV 1`, `REV 2`
* `R{NN}` → `R00`, `R01`, `R02`
* `REV {alpha}` → `REV A`, `REV B`, `REV C`

A ação "Criar Nova Revisão (+1)" incrementa o índice atômico no perfil de marca e atualiza imediatamente todas as pranchas vinculadas.

---

## 8. Tokens de Identidade Visual Editáveis

Para manter a coerência estética sem impor cores arbitrárias, o sistema provê 7 tokens de design personalizáveis:

```json
{
  "primary": "#0f172a",
  "secondary": "#334155",
  "accent": "#6366f1",
  "text": "#0f172a",
  "background": "#ffffff",
  "border": "#94a3b8",
  "muted": "#64748b"
}
```

* **Color Pickers e Códigos HEX:** O usuário edita as cores diretamente pelo modal "Identidade & Carimbo".
* **Herança Dinâmica:** O carimbo e os elementos de texto utilizam as variáveis CSS dos tokens para compor sua tipografia e contornos.

---

## 9. Preservação e Reutilização entre Projetos

* Os perfis de marca são gerenciados em `StudioState.data.brandProfiles`.
* O perfil padrão `brand-arqvertice-default` serve como matriz para todos os novos projetos.
* É possível criar novos perfis (ex.: "ArqVértice Corporativo", "ArqVértice Concursos") e vinculá-los individualmente aos projetos via `StudioState.setProjectBrandProfile(projectId, brandProfileId)`.
* A alteração de um perfil reflete em todos os projetos a ele associados, garantindo governança centralizada da identidade visual.

---

## 10. Validação e Testes Automatizados

A suíte de testes `tests/brand-titleblock.test.js` foi executada em ambiente Node.js com os seguintes resultados:

```text
================================================================
 INICIANDO SUÍTE DE TESTES: BLOCO F05 - IDENTIDADE VISUAL E CARIMBOS
================================================================

--- GRUPO 1: BRAND ASSETS E PERFIS DE IDENTIDADE ---
  ✔ [PASS] 1.1 Inicialização de perfis de marca e perfil padrão do ArqVértice Studio
  ✔ [PASS] 1.2 Tipos canônicos de Brand Assets requeridos
  ✔ [PASS] 1.3 Upload de novos Brand Assets reais (DataURL / caminho)

--- GRUPO 2: CARIMBO E 12 CAMPOS OBRIGATÓRIOS ---
  ✔ [PASS] 2.1 Existência dos 12 Campos Canônicos do Carimbo
  ✔ [PASS] 2.2 Geração de dados completos para o carimbo a partir do projeto e da prancha

--- GRUPO 3: TEMPLATES E VARIAÇÕES DE CARIMBO ---
  ✔ [PASS] 3.1 Catálogo de templates de carimbo e dimensões ABNT
  ✔ [PASS] 3.2 Renderização visual dos 4 templates de carimbo

--- GRUPO 4: POSICIONAMENTO E ÁREA ÚTIL (PRINTABLE AREA) ---
  ✔ [PASS] 4.1 Ancoragem automática do carimbo no canto inferior direito da área útil

--- GRUPO 5: LOGO (TAMANHO, POSIÇÃO, PROPORÇÃO E MARGEM) ---
  ✔ [PASS] 5.1 Preservação absoluta da proporção do logo (nunca deformar)

--- GRUPO 6: CONTROLE DE REVISÃO CONFIGURÁVEL ---
  ✔ [PASS] 6.1 Formatação e incremento de revisões (REV 00, REV 01, REV 02)

--- GRUPO 7: TOKENS DE IDENTIDADE EDITÁVEIS ---
  ✔ [PASS] 7.1 Presença e edição dos 7 tokens requeridos

--- GRUPO 8: PRESERVAÇÃO E REUTILIZAÇÃO ENTRE PROJETOS ---
  ✔ [PASS] 8.1 Criação de perfil reutilizável e associação a múltiplos projetos

--- GRUPO 9: MODAL DE IDENTIDADE E PREVIEW ---
  ✔ [PASS] 9.1 Renderização do modal de gestão de marca com todas as seções

================================================================
 RESULTADO FINAL: 13 PASSOU | 0 FALHOU (100% SUCESSO)
================================================================
```
