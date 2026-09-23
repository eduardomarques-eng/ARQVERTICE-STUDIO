# ArqVertice Studio — Regras Normativas e Operação de Planta Humanizada (D03)

## 1. Regras Inegociáveis de Preservação Arquitetônica

O ArqVertice Studio impõe barreiras estritas de integridade que impedem alucinações e distorções gráficas durante a humanização de plantas:

1. **Invariância de Elementos Estruturais:**
   - Paredes estruturais e divisórias jamais poderão ser removidas, afinadas ou reposicionadas.
   - Pilares de concreto e prumadas hidráulicas permanecem intocados.
2. **Preservação de Vãos e Esquadrias:**
   - Se a planta original do Revit define uma porta de giro de 80cm em determinada posição, a planta humanizada deve representá-la exatamente naquele local.
   - Vãos de janelas e portas de correr de varanda devem coincidir milimetricamente com a base técnica.
3. **Não-Alucinação de Elementos Duvidosos:**
   - Se um elemento gráfico na planta não for conclusivo no modelo BIM, a IA **não deve inventá-lo como confirmado** nem introduzir mobiliário fixo inexistente.
4. **Respeito aos Locks do Ambiente:**
   - Locks de layout geométrico registrados na Memória (C06) e no Ambiente (D01) prevalecem sobre qualquer sugestão estética.

---

## 2. Metadados de Escala, Dimensão e Resolução

> **Aviso Técnico Mandatório:** Não declarar que a imagem é tecnicamente escalável apenas porque possui alta resolução gráfica (DPI).

Todo registro de planta humanizada carrega metadados técnicos rigorosos:
* **Escala Nominal Original:** Ex.: `1:50` ou `1:25` (herdada da folha ou vista do Revit).
* **Dimensões Reais:** Largura e comprimento do perímetro cotado em metros (ex: `12.40m x 7.80m`).
* **Unidade:** Fixada em `METERS` (sistema métrico internacional).
* **Resolução Gráfica:** 300 DPI para impressão em alta definição ou 150 DPI para visualização em telas.
* **Orientação:** Eixo do Norte Verdadeiro para coerência na projeção de sombras solares.

A interface exibe advertência explícita de que a planta destina-se a fins comerciais e de apresentação, devendo a execução em obra guiar-se exclusivamente pelas pranchas executivas cotadas do Revit.

---

## 3. Ciclo de Vida das Versões (`humanized_plan_versions`)

As versões percorrem um fluxo de estados auditável:

| Status | Significado | Condição de Transição |
| :--- | :--- | :--- |
| `DRAFT` | Rascunho de trabalho em edição preliminar. | Criado por duplicação ou em fase de teste. |
| `IN_REVIEW` | Versão renderizada disponível para avaliação do cliente e equipe técnica. | Resultado padrão de uma geração ou variação. |
| `APPROVED` | Versão homologada pelo cliente ou arquiteto titular como oficial. | Acionamento explícito do comando `APROVAR`. |
| `REJECTED` | Versão descartada por não atender às expectativas estéticas ou funcionais. | Acionamento de `REJEITAR` com justificativa registrada. |
| `SUPERSEDED` | Versão anteriormente aprovada que foi substituída por uma revisão mais recente. | Ocorre automaticamente quando uma nova versão é aprovada. |

---

## 4. Catálogo de Comandos Operacionais

O motor responde a 7 operações estruturadas:

1. **`GERAR` (Generate):** Cria uma nova versão completa a partir do modelo do Revit, compilando o prompt com base no conceito do projeto (C04), na memória (C06) e nas referências curadas (D02).
2. **`REGENERAR` (Regenerate):** Reexecuta a síntese da versão ativa refinando parâmetros de ruído ou pesos de preservação sem perder a rastreabilidade.
3. **`CRIAR VARIAÇÃO` (Create Variation):** Gera uma nova versão vinculada (`parent_version_id`), aplicando ajustes pontuais de paleta, pisos ou mobiliário.
4. **`USAR VERSÃO` (Set Active):** Alterna o ponteiro da versão atualmente exibida no ambiente.
5. **`APROVAR` (Approve):** Homologa formalmente a versão com assinatura de autor, data e notas, promovendo-a a `APPROVED` e arquivando as anteriores como `SUPERSEDED`.
6. **`REJEITAR` (Reject):** Registra motivo de reprovação e restabelece a versão estável prévia.
7. **`DUPLICAR` (Duplicate):** Clona a versão como rascunho independente para experimentação.

---

## 5. Arquitetura de Comandos Pontuais (Pré-D07 Targeting)

Para preparar o sistema para o motor avançado de locks e inpainting do Bloco D07, o motor aceita instruções pontuais de escopo restrito:

* *"Mude somente o piso."* &rarr; Mantém mobília e iluminação, sintetizando novo material de piso com preservação de alvenaria.
* *"Altere somente o sofá."* &rarr; Modifica estofados mantendo pisos e marcenaria.
* *"Escureça os armários."* &rarr; Ajuste seletivo de tom na marcenaria fixa.
* *"Adicione vegetação interna."* &rarr; Inclusão biofílica sem alterar a circulação principal.
* *"Suavize as sombras."* &rarr; Ajuste da camada de oclusão e luz difusa.

Essas instruções são encapsuladas no campo `localized_instruction` de cada versão e são refletidas nos metadados de prompt e auditoria.
