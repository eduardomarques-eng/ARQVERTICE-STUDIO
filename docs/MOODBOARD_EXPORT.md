# ArqVértice Studio — Exportação, Impressão e Fidelidade Gráfica (E04)

## 1. Princípios de Saída Digital e Gráfica

A exportação de moodboards no ArqVértice Studio observa duas realidades complementares:

1. **Apresentação Digital em Tela**:
   - Resolução responsiva, visualização interativa, rolagem suave e capacidade de inspeção de detalhes.
2. **Impressão Física e Prancha Gráfica de Obra (PDF)**:
   - Proporções físicas baseadas nas normas ISO 216 (Série A: A4, A3, A2, A1).
   - **Regra do Item 21**: *Não assumir que uma imagem em tela possui escala física apenas por possuir dimensões em pixels*. O sistema calcula margens em milímetros (`mm`), tipografia legível e garante que quebras de página não cortem blocos pela metade (`break-inside: avoid`).

---

## 2. Formatos de Papel Suportados

| Formato | Dimensões em Milímetros | Resolução Recomendada (300 DPI) | Casos de Uso Recomendados |
|---|---|---|---|
| **A4** | 210 x 297 mm | 2480 x 3508 px | Caderno de especificações, dossiê individual por ambiente. |
| **A3** (Padrão) | 297 x 420 mm | 3508 x 4960 px | Prancha clássica de reunião de apresentação e pranchas conceituais de escritório. |
| **A2** | 420 x 594 mm | 4960 x 7016 px | Pranchas executivas de coordenação e concorrência de fornecedores. |
| **A1** | 594 x 841 mm | 7016 x 9933 px | Painéis de concurso e pranchas mestras de recepção/showroom. |

Ambos os formatos suportam orientação **`LANDSCAPE` (Paisagem)** e **`PORTRAIT` (Retrato)**.

---

## 3. Mecanismo de Exportação para PDF

A exportação para PDF é realizada via motor nativo de impressão vetorial de alta precisão através das regras CSS `@media print`:

- **Ocultação de Elementos de Interface**: Menus, barras de controle (`no-print`), botões e overlays de edição são automaticamente removidos no momento da impressão.
- **Renderização de Cores Exata**: Assegura a preservação de pretos profundos, sombras sutis e fidelidade cromática dos swatches de cor (`-webkit-print-color-adjust: exact; print-color-adjust: exact;`).
- **Definição de Página**:
  ```css
  @page {
    size: A3 landscape;
    margin: 10mm;
  }
  ```

---

## 4. Arquitetura para Exportação em Imagem (PNG / JPG)

Para compartilhamento rápido em redes sociais, mensagens instantâneas e relatórios executivos, o sistema conta com a arquitetura preparada para:
- Renderização via Canvas offscreen (ou `html2canvas` / `window.print`).
- Preservação da proporção 16:9 ou 4:3 dos renders.
- Inclusão mandatória do logotipo e rodapé da ArqVértice Studio garantindo a autoria intelectual do projeto.
