# Memória de Cálculo, Fórmulas e Embalagens (Bloco E03)

O módulo de quantitativos do ArqVértice Studio adota transparência matemática total em todas as deduções de volumes e materiais.

---

## 1. Estrutura Canônica da Memória de Cálculo

Cada quantitativo calculado registra uma equação explícita no formato:
$$\text{ENTRADA (Qtd. Base)} \times (1 + \text{Fator de Perda}) = \text{RESULTADO (Qtd. Final)}$$

### Exemplo Prático
- **Área Base:** $40{,}00\text{ m}^2$
- **Percentual de Perda:** $10\%$
- **Fórmula Registrada:**
  ```text
  40,00 m² × 1,10 (perda de 10%) = 44,00 m²
  ```

---

## 2. Percentuais de Perda Técnica

O sistema não escolhe automaticamente um percentual arbitrário sem a aprovação do usuário ou regra documentada. Os percentuais canônicos suportados são:
- **`0%` (Sem perda):** Elementos unitários pré-fabricados (ex.: cubas, misturadores, luminárias pontuais).
- **`5%` (Corte simples linear):** Porcelanatos retificados de grande formato em paginações retas contínuas ou pinturas de alvenaria lisa.
- **`10%` (Padrão de obra):** Revestimentos cerâmicos padrão, pisos de madeira, rodapés retos e forros de gesso acartonado.
- **`15%` (Paginação diagonal ou ripados):** Paginações em espinha de peixe (herringbone), painéis ripados verticais com perda de topo e base, pedras irregulares.
- **`20%` (Pedras naturais e orgânicas):** Filetes de pedra, mosaicos portugueses ou recortes complexos com alto descarte de estuques e veios.
- **`Personalizado`:** Qualquer percentual técnico definido pelo especificador (ex.: $7{,}5\%$).

---

## 3. Conversão para Embalagens Comerciais

Muitos revestimentos e insumos são comercializados em caixas fechadas, sacos ou kits:
- **Área por Caixa ($C$):** Área líquida coberta por uma embalagem fechada (ex.: $2{,}16\text{ m}^2/\text{caixa}$).
- **Quantidade Necessária ($Q_{\text{compra}}$):**
  $$Q_{\text{compra}} = \left\lceil \frac{Q_{\text{final}}}{C} \right\rceil$$
- **Fórmula Registrada:**
  ```text
  Teto(44,00 m² ÷ 2,16 m²/caixa) = 21 caixas (45,36 m² efetivos)
  ```

---

## 4. Regras de Arredondamento e Unidades

- **Casas Decimais:** Padrão de 2 casas decimais para áreas ($0{,}00$) e 3 casas para volumes ou pesos.
- **Regras de Arredondamento:**
  * `CEIL` (Teto): Garante que a obra não sofra com falta de material por arredondamento para baixo.
  * `ROUND` (Aritmético): Arredondamento padrão da ABNT.
  * `NONE`: Mantém o número em ponto flutuante contínuo para exportações analíticas.
- **Preservação de Integridade:** O arredondamento comercial para compra **nunca altera silenciosamente a quantidade técnica original** calculada no projeto.
