# ArqVértice Studio — Registro de Decisões e Memória do Projeto (Bloco C03)

## 1. O Papel da Memória de Decisões

Em projetos arquitetônicos de alto padrão, uma das maiores fontes de retrabalho e descompasso é a perda da justificativa por trás de escolhas espaciais. Sem registro, decisões cruciais (como a escolha de uma cozinha linear em detrimento de uma ilha) são questionadas meses depois quando os projetos complementares (hidráulica e elétrica) já estão em curso.

O módulo de Estudos Preliminares introduz o **Registro Imutável de Decisão**:
- Toda escolha entre alternativas A, B e C é formalizada e integrada à **Memória do Projeto**.

---

## 2. Estrutura do Registro de Decisão

Ao homologar a escolha de uma alternativa, o arquiteto preenche:
- **Alternativa Selecionada (`selectedAlternativeId`):** Aponta univocamente para a alternativa vencedora.
- **Motivo Técnico (`reason`):** Justificativa detalhada do porquê aquela alternativa superou as demais (fatores de ventilação, insolação, circulação, custo de execução ou preferência explícita do cliente).
- **Arquiteto Responsável (`decidedBy`):** Nome do profissional que validou a solução.
- **Data e Hora (`decidedAt`):** Timestamp ISO 8601 da homologação.
- **Observações Complementares (`observations`):** Diretrizes específicas que devem ser repassadas para os próximos estágios de projeto.

---

## 3. Comparador Lado a Lado (Side-by-Side)

Para subsidiar a tomada de decisão com o máximo rigor visual e técnico, o sistema disponibiliza o comparador de alternativas lado a lado:
- **Grade Multicolunas:** Exibe Alternativa A, Alternativa B, Alternativa C... em paralelo.
- **Contraste Direto:**
  - Hipóteses projetuais testadas;
  - Vantagens registradas pelo usuário (destaque positivo em verde);
  - Desvantagens e restrições apontadas pelo usuário (destaque de atenção em vermelho/âmbar);
  - Imagens ou perspectivas renderizadas;
  - Nomenclatura da vista correspondente no Autodesk Revit;
  - Rastreabilidade de autoria (ArqVértice vs. Referência Externa vs. Importado vs. Gerado por IA).

---

## 4. Salvaguarda Contra Tomada de Decisão por IA

Conforme estabelecido nas premissas fundamentais da ArqVértice:
> **A IA não possui autorização para escolher a "melhor alternativa".**

O assistente de inteligência artificial limita-se a:
1. Sintetizar e resumir as propostas apresentadas;
2. Contrastar listas de prós e contras já cadastradas pelos arquitetos;
3. Destacar possíveis conflitos com as diretrizes do Briefing Técnico (C01) ou com o Levantamento (C02).

A escolha formal permanece, em qualquer hipótese, um ato discricionário e consciente dos arquitetos e clientes.

---

## 5. Exportação da Memória Técnica

O módulo oferece a funcionalidade de exportação da **Memória de Decisões** em formato JSON estruturado (`exportDecisionsLog`), permitindo que reuniões com clientes, atas de validação e dossiês de obra mantenham a comprovação de todas as opções examinadas e descartadas.
