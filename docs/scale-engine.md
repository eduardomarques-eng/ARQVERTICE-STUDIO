# MOTOR DE ESCALAS TÉCNICAS (SCALE ENGINE) — ARQVERTICE STUDIO

## 1. Visão Geral e Fundamentação Normativa
O **Scale Engine** do ArqVertice Studio governa o dimensionamento, enquadramento e correspondência métrica rigorosa entre o modelo arquitetônico virtual e as representações gráficas em pranchas e relatórios técnicos. Ele opera em conformidade estrita com a **ABNT NBR 6492 (Representação de projetos de arquitetura)** e **ABNT NBR 10068 (Folha de desenho - leiaute e dimensões)**.

---

## 2. Escalas Nominais Suportadas
O sistema reconhece e valida as seguintes categorias de escalas:

| Código Nominal | Fator Numérico ($1/N$) | Categoria ABNT | Aplicação Típica |
|:---|:---|:---|:---|
| `1:1` | $1.0$ | Detalhe Real | Frisos, puxadores, juntas de dilatação |
| `1:2` | $0.5$ | Detalhe Ampliado | Perfis de esquadrias, encontros |
| `1:5` | $0.2$ | Detalhe Técnico | Cortes de bancadas, arremates |
| `1:10` | $0.1$ | Detalhe Construtivo | Detalhes de marcenaria, forro |
| `1:20` | $0.05$ | Detalhamento | Banheiros, cozinhas, paginações |
| `1:25` | $0.04$ | Detalhamento / Layout | Ambientes residenciais específicos |
| `1:50` | $0.02$ | **Padrão Executivo** | Plantas baixas, cortes gerais, fachadas |
| `1:75` | $0.0133$ | Estudo Preliminar | Plantas de apresentação intermediária |
| `1:100` | $0.01$ | Estudo / Geral | Coberturas, implantação, plantas gerais |
| `1:125` | $0.008$ | Geral Ampliado | Loteamentos compactos, pavimentos tipo |
| `1:200` | $0.005$ | Urbanismo / Implantação | Situação, implantação, volumetria |
| `1:250` | $0.004$ | Topografia | Terrenos extensos |
| `1:500` | $0.002$ | Macro-implantação | Planta de situação e localização |
| `indicada` | Variável por elemento | Mista | Prancha com múltiplos detalhes/escalas |
| `s/ escala` | N/A | Conceitual / 3D | Renders, perspectivas, croquis |

---

## 3. Matemática de Projeção e Resolução
O cálculo de viewport converte metros reais ($m$) para milímetros de prancha ($mm$) e pixels virtuais ($px$) em tela (base padrão 96 DPI):

$$\text{Dimensão na Prancha (mm)} = \frac{\text{Dimensão Real (m)} \times 1000}{N}$$

$$\text{Dimensão na Tela (px a 96 DPI)} = \text{Dimensão na Prancha (mm)} \times \frac{96}{25.4} \approx \text{Dimensão (mm)} \times 3.7795$$

### Exemplo:
Para uma parede de $5.00\,\text{m}$ representada na escala nominal `1:50`:
- Tamanho impresso: $\frac{5000\,\text{mm}}{50} = 100\,\text{mm}$ (ou $10\,\text{cm}$)
- Tamanho em tela (96 DPI): $100 \times 3.7795 \approx 378\,\text{px}$

---

## 4. Integração com Carimbo F05 e Selo Técnico
- O campo `escala` do carimbo é automaticamente alimentado pela escala nominal da prancha (`sheet.scale`).
- Quando a prancha abriga múltiplos viewports com escalas divergentes (ex.: Planta 1:50 + Detalhes 1:20), o carimbo assume obrigatoriamente `INDICADA`.
- Elementos individuais mantêm selo identificador próprio (`Viewport Title`) contendo: Nome do Desenho + Escala Específica.

---

## 5. Validação Defensiva e Controle de Erros (QA F11)
1. **Escala Nula ou Inválida (`1:0`, `invalida`)**: Detectada pelo Portão QA F11 gerando status `ERROR`, impedindo a finalização do pacote no Centro de Entrega.
2. **Escala Proporcional vs Esticada**: Redimensionamentos em folhas com `rescaleMode = 'proportional_fit'` mantêm o aspect ratio inalterado ($AR = 1.0$), evitando distorções anamórficas de cotas e espessuras de parede.
3. **Escala Gráfica Automática**: Suporte à barra gráfica métrica impressa, garantindo leitura fidedigna mesmo em impressões com fator de ampliação ou redução não planejado.
