# Sistema de Quantitativos e Memória de Cálculo (Bloco E03)

O **Bloco E03** estabelece a camada de inteligência e governança quantitativa de materiais, revestimentos e acabamentos do ArqVértice Studio. Ele traduz especificações conceituais e produtos homologados em volumes mensuráveis, transparentes e auditáveis, tanto por ambiente quanto consolidados no projeto inteiro.

---

## 1. Objetivos do Sistema

O sistema de quantitativos foi projetado especificamente para:
1. **Especificação Técnica:** Apoiar o arquiteto na definição precisa de áreas, perímetros, volumes e unidades.
2. **Apresentação Executiva:** Alimentar pranchas de layout, memoriais descritivos e cadernos de acabamento.
3. **Planejamento de Obra:** Auxiliar na estimativa de prazos, etapas de assentamento e logística de canteiro.
4. **Consulta e Orçamentação Preliminar:** Viabilizar cotações com fornecedores regionais sem gerar compromissos financeiros automáticos.
5. **Composição de Moodboard:** Permitir que amostras do moodboard consumam quantidades e fontes homologadas.
6. **Relatórios e Acompanhamento:** Emitir dossiês analíticos em CSV, PDF e planilhas.

> [!IMPORTANT]
> **Delimitação de Escopo (Item 0 e Item 25):**
> Este módulo **NÃO se transforma automaticamente em orçamento executivo** e **NÃO cria compras ou compromissos financeiros automáticos**. Ele fornece a base de cálculo técnica e especificação para que o setor de compras ou os fornecedores elaborem suas propostas formais.

---

## 2. Princípio da Confiabilidade de Dados

Diferente de sistemas que tratam qualquer número como verdade absoluta, o ArqVértice Studio implementa o **Princípio da Confiabilidade**:
- **Toda quantidade indica obrigatoriamente a sua origem**:
  * `MEASURED`: Medição comprovada de planta executiva ou levantamento in loco.
  * `CALCULATED`: Quantidade deduzida por fórmula geométrica matemática.
  * `IMPORTED`: Dados importados de plataformas BIM externas (Autodesk Revit).
  * `MANUAL`: Entrada manual realizada pelo usuário ou especificador.
  * `ESTIMATED_BY_AI`: Estimativa preliminar gerada por visão computacional ou IA.
  * `UNKNOWN`: Dado legado ou sem comprovação de procedência.
- Três medições com o mesmo valor numérico (ex.: `42,30 m²`) têm tratamentos e níveis de governança completamente distintos dependendo de sua origem (`PROJECT_DATA`, `MANUAL` ou `AI_ESTIMATE`).

---

## 3. Consolidação e Duplicidade no Projeto

Quando o mesmo material ou produto é especificado em mais de um ambiente da residência (ex.: *Mármore Travertino Navona* na Sala, na Circulação e na Cozinha Gourmet):
- O sistema gera a **Consolidação do Projeto**, somando as quantidades base, quantidades finais com perdas e caixas de compra.
- O sistema **preserva integralmente o detalhamento individual por ambiente**, permitindo que o canteiro saiba exatamente quanto destinar para cada cômodo.

---

## 4. Governança e Revisão Humana

O fluxo de aprovação de quantitativos possui dois níveis estritos:
- **`QUANTITY_APPROVED` (Status: `APPROVED`):** Quantidade formalmente conferida e aprovada pelo arquiteto titular. Integra os memoriais executivos e fichas técnicas.
- **`QUANTITY_ESTIMATED` (Status: `ESTIMATED` ou `DRAFT`):** Quantidade preliminar ou estimada por IA. Exige conferência in loco antes do envio para compras ou corte de material.

Ações disponíveis para o usuário:
- **Confirmar / Homologar:** Eleva o status para `APPROVED`.
- **Editar / Recalcular:** Altera quantidade base, perda técnica ou embalagem com recálculo transparente da fórmula.
- **Rejeitar:** Transiciona para `REJECTED`, exigindo motivo obrigatório e preservando o histórico para auditoria sem exclusão física.
