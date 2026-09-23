# ================================================================
# ARQVERTICE STUDIO — DIRETRIZES DE PROJETO (C04)
# DESIGN_DIRECTIVES.md
# ================================================================

VERSÃO: C04.1
DOCUMENTAÇÃO: DIRETRIZES VISUAIS, MATERIAIS, PALETA, MOBILIÁRIO E ILUMINAÇÃO

---

## 1. DIRETRIZES VISUAIS GERAIS

As diretrizes visuais estruturam os princípios geométricos e de composição plástica do projeto:

- **Formas:** Ortogonais, puras, com transições suaves e balanços estruturais controlados.
- **Linhas:** Horizontais contínuas valorizando a amplitude visual e linhas de fuga.
- **Proporções:** Vãos generosos, pé-direito duplo nas áreas sociais e escala humana acolhedora nas áreas íntimas.
- **Linguagem:** Síntese minimalista com calor material (ausência de ornamentos gratuitos).
- **Paisagismo:** Espécies tropicais nativas de baixa manutenção integradas aos canteiros perimetrais e pátios internos.
- **Decoração:** Peças assinadas do design brasileiro, cerâmicas artesanais e tecidos de toque natural.

---

## 2. MATRIZ DESEJADO × EVITAR

A matriz **DESEJADO × EVITAR** orienta a equipe de modelagem, especificadores e geradores visuais (prompts de IA para renders):

| Categoria | Elementos Desejados (DO) | Elementos a Evitar (DON'T) |
|---|---|---|
| **Materiais** | Madeira natural maciça (Freijó, Cumaru), pedras com acabamento escovado ou levigado, concreto aparente | Polimentos espelhados excessivos, imitações plásticas, revestimentos brilhantes tipo porcelanato vitrificado |
| **Cores** | Tons terrosos, areia, fendi, off-white e toques de verde sálvia e terracota | Cores fluorescentes, primárias puras berrantes, cinza frio monótono hospitalar |
| **Iluminação** | Luz indireta difusa, sancas com 2700K quente, rasgos de luz natural filtrada | Tubulares fluorescentes frias (6500K), luz direta ofuscante no centro de convivência |
| **Mobiliário** | Linhas baixas, tecidos em linho e algodão rústico, couro natural fosco | Móveis rebuscados em estilo rococó, sintéticos brilhantes, excesso de cromados |

---

## 3. PALETA DE CORES Específicas

Cada cor é registrada com suas propriedades plásticas e papéis funcionais:

```json
{
  "code": "AV-SAND-01",
  "name": "Areia Litorânea",
  "hex": "#E8E1D5",
  "role": "PREDOMINANTE",
  "materialRef": "Microcimento areia / Linho cru",
  "notes": "Base neutra e clara para paredes e tetos das áreas sociais"
}
```

- **Papéis:**
  - `PREDOMINANTE`: Cobre a maior parte das superfícies e planos visuais (60%).
  - `SECUNDÁRIA`: Complementa e estrutura planos de destaque (30%).
  - `ACENTO`: Toques pontuais de contraste e vibração (10%).
  - `NEUTRO`: Fundos, esquadrias e transições suaves.
  - `CONTRASTE`: Elementos arquitetônicos marcantes.

---

## 4. MATERIALIDADE (SEM QUANTITATIVOS PRECOCES)

A intenção material é qualitativa neste estágio. **Nenhum quantitativo de obra é gerado no Bloco C04**:

- **Piso:** Granito escovado nas áreas externas/úmidas; assoalho de cumaru nas áreas sociais e íntimas.
- **Paredes:** Pintura mineral textura mate, painéis ripados em freijó natural.
- **Bancadas:** Quartzito natural escovado (Taj Mahal ou Mont Blanc).
- **Marcenaria:** Lâmina natural de freijó com puxadores cava integrados.
- **Metais:** Inox escovado fosco e latão envelhecido.
- **Pedras:** Moledo em fiadas horizontais nas paredes de destaque e pátios.
- **Tecidos:** Linhos naturais, cordas náuticas e tramas de algodão orgânico.
- **Forros:** Forro de gesso acartonado liso com sanca invertida; forro de ripas de madeira na varanda.
- **Elementos Especiais:** Brises pivotantes de madeira e cobogós cerâmicos vazados.

---

## 5. ILUMINAÇÃO DE INTENÇÃO

Focada em ambiência e temperatura de cor, sem substituir o cálculo luminotécnico de engenharia:

- **Natural:** Maximização dos panos de vidro protegidos por brises para iluminação diurna sem ganho térmico excessivo.
- **Geral:** Iluminação suave e difusa indireta embutida em sancas.
- **Indireta:** Fitas LED 2700K de alto IRC (>95) rebaixadas atrás de marcenarias e rodapés flutuantes.
- **Pontual / Cênica:** Spots antiofuscantes de facho fechado direcionados para obras de arte e texturas de pedras.
- **Decorativa:** Luminárias pendentes esculturais assinadas sobre a mesa de jantar e ilha gourmet.
- **Temperatura Geral:** 2700K (zonas sociais e dormitórios) e 3000K (zonas de preparo e serviço).

---

## 6. MOBILIÁRIO E CLASSIFICAÇÃO

Diretrizes funcionais por categoria:

- **Existente:** Móveis do acervo do cliente que serão reaproveitados ou restaurados.
- **Desejado:** Peças de catálogo e referências estéticas almejadas pelo projeto.
- **Obrigatório:** Itens com especificação ergonômica ou dimensional imprescindível (ex: mesa para 10 lugares).
- **Opcional:** Peças complementares para estudo de viabilidade ou fases futuras.
- **Proibido:** Materiais, marcas ou estilos estritamente vetados no projeto.
