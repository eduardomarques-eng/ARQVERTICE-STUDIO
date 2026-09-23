# Sistema de Formatos Físicos e Orientação das Pranchas (Bloco F03)

## 1. Visão Geral e Filosofia Arquitetural

O **Bloco F03** do ArqVértice Studio implementa a infraestrutura técnica e física de diagramação de pranchas arquitetônicas e de interiores. O sistema estabelece uma separação arquitetural estrita entre **unidade física real**, **unidade de renderização gráfica** e **unidade virtual de tela**, garantindo precisão milimétrica de acordo com as normas técnicas de desenho arquitetônico (**ABNT NBR 10068 / ISO 216**).

> [!IMPORTANT]
> **Pixels (`px`) não são utilizados como unidade física de escala**. A unidade interna canônica de dimensão física é o **milímetro (`mm`)**. A representação em tela ou na saída impressa é uma projeção matematicamente derivada e determinística.

---

## 2. Separação de Unidades

O motor do estúdio separa formalmente três camadas de representação:

| Camada | Unidade | Referência / Resolução | Finalidade |
| :--- | :---: | :--- | :--- |
| **Unidade Física** | `mm` | Milímetros nominais (NBR 10068 / ISO 216) | Armazenamento de formatos, cálculo de margens de encadernação, refile e sangria. |
| **Unidade de Renderização** | `pt` / `px@300DPI` | 72 pontos por polegada (PostScript/PDF standard) ou 300 DPI | Renderização de alta fidelidade vetorial e preparação para exportação física gráfica. |
| **Unidade de Tela** | `px` | 96 pixels por polegada (CSS / Viewport padrão) | Diagramação interativa no navegador, drag-and-drop, redimensionamento e zoom. |

### Fórmulas Matemáticas de Conversão

Considerando que $1\text{ polegada} = 25.4\text{ mm}$:

$$\text{pt} = \text{mm} \times \frac{72}{25.4}$$

$$\text{px}_{\text{tela}} = \text{mm} \times \frac{96}{25.4}$$

$$\text{px}_{\text{impressão}} = \text{mm} \times \frac{300}{25.4}$$

A função `StudioState.convertUnit(value, fromUnit, toUnit, dpi)` gerencia essas conversões bidirecionalmente sem perdas numéricas.

---

## 3. Catálogo de Formatos Obrigatórios (8 Combinações Canônicas)

Todas as combinações obrigatórias de **A4, A3, A2 e A1** nas orientações **Retrato (Portrait)** e **Paisagem (Landscape)** possuem dimensões físicas exatas e margens calculadas conforme a norma brasileira ABNT NBR 10068:

| Código | Orientação | Dimensão Física ($L \times A$) | Margens Técnicas (E / T / D / B) | Área Útil ($L \times A$) | Renderização ($72\text{ pt}$) | Tela ($96\text{ DPI}$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A4** | Retrato | $210 \times 297\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $178 \times 283\text{ mm}$ | $595.3 \times 841.9\text{ pt}$ | $794 \times 1123\text{ px}$ |
| **A4** | Paisagem | $297 \times 210\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $265 \times 196\text{ mm}$ | $841.9 \times 595.3\text{ pt}$ | $1123 \times 794\text{ px}$ |
| **A3** | Retrato | $297 \times 420\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $265 \times 406\text{ mm}$ | $841.9 \times 1190.6\text{ pt}$ | $1123 \times 1587\text{ px}$ |
| **A3** | Paisagem | $420 \times 297\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $388 \times 283\text{ mm}$ | $1190.6 \times 841.9\text{ pt}$ | $1587 \times 1123\text{ px}$ |
| **A2** | Retrato | $420 \times 594\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $388 \times 580\text{ mm}$ | $1190.6 \times 1683.8\text{ pt}$ | $1587 \times 2245\text{ px}$ |
| **A2** | Paisagem | $594 \times 420\text{ mm}$ | $25\text{ / }7\text{ / }7\text{ / }7\text{ mm}$ | $562 \times 406\text{ mm}$ | $1683.8 \times 1190.6\text{ pt}$ | $2245 \times 1587\text{ px}$ |
| **A1** | Retrato | $594 \times 841\text{ mm}$ | $25\text{ / }10\text{ / }10\text{ / }10\text{ mm}$ | $559 \times 821\text{ mm}$ | $1683.8 \times 2383.9\text{ pt}$ | $2245 \times 3179\text{ px}$ |
| **A1** | Paisagem | $841 \times 594\text{ mm}$ | $25\text{ / }10\text{ / }10\text{ / }10\text{ mm}$ | $806 \times 574\text{ mm}$ | $2383.9 \times 1683.8\text{ pt}$ | $3179 \times 2245\text{ px}$ |

> [!NOTE]
> Conforme a ABNT NBR 10068, a **margem esquerda é fixada em $25\text{ mm}$** para permitir o arquivamento, furação e encadernação da folha. As demais margens são de $7\text{ mm}$ (A4, A3 e A2) e $10\text{ mm}$ (A1 e A0).

---

## 4. Entidade `FormatProfile`

A entidade canônica `FormatProfile` é gerada pelo método `StudioState.getFormatProfile(formatCode, orientation, customMargins, customBleed)` e associada a cada prancha:

```typescript
interface FormatProfile {
  id: string;                      // ex: "format-a3-landscape"
  name: string;                    // ex: "A3 Paisagem"
  formatCode: string;              // "A4" | "A3" | "A2" | "A1" | "A0" | "PRANCHA_METRICA"
  orientation: "portrait" | "landscape";
  width: number;                   // Largura nominal em mm
  height: number;                  // Altura nominal em mm
  unit: "mm";                      // Unidade canônica
  margins: {
    top: number;                   // mm (padrão 7 ou 10)
    right: number;                 // mm (padrão 7 ou 10)
    bottom: number;                // mm (padrão 7 ou 10)
    left: number;                  // mm (padrão 25 para fixação)
    unit: "mm";
  };
  bleed: {
    top: number;                   // mm (padrão 3)
    right: number;                 // mm (padrão 3)
    bottom: number;                // mm (padrão 3)
    left: number;                  // mm (padrão 3)
    unit: "mm";
  };
  printableArea: {
    x: number;                     // Início horizontal (margem esquerda em mm)
    y: number;                     // Início vertical (margem superior em mm)
    width: number;                 // Largura líquida em mm
    height: number;                // Altura líquida em mm
    unit: "mm";
  };
  safeArea: {
    x: number;                     // Início com recuo adicional de 5mm
    y: number;
    width: number;
    height: number;
    unit: "mm";
  };
  isPreset: boolean;
  renderDimensions: {
    pt: { width: number; height: number };
    screenPx: {
      width: number;
      height: number;
      printableArea: { x: number; y: number; width: number; height: number };
      safeArea: { x: number; y: number; width: number; height: number };
      bleed: { top: number; right: number; bottom: number; left: number };
    };
  };
}
```

---

## 5. Guias Técnicas e Visualização no Viewport

No viewport da prancha (`SheetEngineModule`), três camadas de guias técnicas podem ser ativadas/desativadas pelo operador:

1. **Guia de Sangria (Bleed Guide)**:
   - Contorno tracejado vermelho a $3\text{ mm}$ para fora do corte da folha.
   - Garante que imagens e fundos estendidos não fiquem com filetes brancos após o refile gráfico.
2. **Guia de Área Útil (Printable Area Guide)**:
   - Contorno tracejado azul delimitando a área útil interna da prancha descontando as margens técnicas de $25\text{ mm}$ (fixação) e $7\text{ mm}/10\text{ mm}$.
   - Exibe tag com as dimensões líquidas nominais em milímetros.
3. **Guia de Área Segura (Safe Area Guide)**:
   - Contorno pontilhado verde com recuo preventivo adicional de $5\text{ mm}$ da margem útil.
   - Delimita a zona segura recomendada para textos, carimbos e cotas sensíveis.

---

## 6. Prevenção Contra Corte e Redimensionamento Proporcional

Ao solicitar uma mudança de formato físico ou orientação (por exemplo, de **A1 Paisagem** para **A4 Retrato**), o sistema executa uma avaliação preventiva de risco:

```javascript
const risk = StudioState.checkSheetFormatChangeRisk(sheetId, targetFormat, targetOrientation);
```

### Comportamento do Algoritmo:
1. Compara a área e os limites absolutos dos elementos existentes com a nova área de impressão.
2. Se elementos transbordarem os novos limites (`risk.willClip === true`), uma modal de confirmação é exibida ao usuário:
   - **Opção 1 — Redimensionar Proporcionalmente (Recomendado)**:
     - Calcula o fator uniforme $\text{factor} = \min(\text{scaleX}, \text{scaleY})$ em relação à área útil.
     - Reposiciona e escala todos os elementos proporcionalmente sem deformações ou distorções de aspecto.
     - Ajusta fontes e elementos gráficos mantendo a diagramação intacta.
   - **Opção 2 — Manter Tamanhos Originais**:
     - Altera o papel mantendo as coordenadas e dimensões inalteradas (sujeito a corte).
   - **Opção 3 — Cancelar**:
     - Cancela a operação e preserva o formato atual da prancha.

---

## 7. API Reference (Principais Funções)

### `StudioState.convertUnit(value, fromUnit, toUnit, dpi)`
Converte grandezas entre `'mm'`, `'pt'` e `'px'`.

### `StudioState.getFormatProfile(formatCode, orientation, customMargins, customBleed)`
Gera o perfil físico normatizado com todas as métricas calculadas.

### `StudioState.getAllFormatProfiles()`
Retorna a lista completa com os 8 presets canônicos para seleção rápida.

### `StudioState.checkSheetFormatChangeRisk(sheetId, targetFormat, targetOrientation)`
Retorna objeto com `{ willClip, overflowElements, scaleFactorX, scaleFactorY, uniformScale }`.

### `StudioState.setSheetFormatProfile(sheetId, targetData, options, user)`
Aplica o novo formato e executa redimensionamento proporcional se solicitado via `{ rescaleElements: 'proportional_fit' }`.

### `StudioState.updateSheetMargins(sheetId, margins, user)`
Atualiza margens customizadas (topo, direita, base, esquerda) e recalcula área útil em milímetros.

### `StudioState.updateSheetBleed(sheetId, bleed, user)`
Ajusta o valor de sangria em milímetros para a prancha.

---

## 8. Verificação e Testes Automatizados

O Bloco F03 possui uma suíte dedicada em `tests/sheet-formats.test.js` com **24 testes automatizados cobrindo 100% dos requisitos**:

- [x] Conversão de unidades (`mm` $\leftrightarrow$ `pt` $\leftrightarrow$ `px` a 96 e 300 DPI)
- [x] 8 combinações de formatos físicos e orientações (A4, A3, A2, A1 em Retrato e Paisagem)
- [x] Margens técnicas ABNT NBR 10068 e cálculo de área útil
- [x] Sangria gráfica padrão de $3\text{ mm}$
- [x] Integração com a entidade `Sheet` e enriquecimento automático de metadados
- [x] Detecção de corte de conteúdo (`checkSheetFormatChangeRisk`)
- [x] Preservação de proporções no redimensionamento (`rescaleElements: 'proportional_fit'`)
- [x] Não regressão das suítes de teste existentes (F01, F02, E01, E02, E05)

---

*F03 concluído com sucesso. Aguardando comando para o Bloco F04.*
