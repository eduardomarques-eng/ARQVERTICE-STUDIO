# ArqVértice Studio — Processo de Aprovação de Estudos (Bloco C03)

## 1. O Conceito de APPROVED_STUDY_VERSION

A aprovação de um estudo preliminar representa a transição formal de hipóteses e conjecturas para diretrizes consolidadas de projeto.

Ao disparar a ação **APROVAR ESTUDO**, o sistema gera o artefato conceitual **`APPROVED_STUDY_VERSION`**:
- O status do estudo é atualizado para `APPROVED`.
- São congeladas a versão do estudo, o nome do arquiteto aprovador e as notas técnicas de homologação.
- O estudo e sua alternativa vencedora passam a integrar ativamente o **Contexto do Projeto**, ficando visíveis para os projetistas de complementares e para a fase de **Conceito**.

---

## 2. Requisitos Prévios para Homologação

Para que um estudo seja qualificado para aprovação:
1. **Alternativas Estruturadas:** O estudo deve possuir ao menos uma alternativa cadastrada com descrição técnica.
2. **Decisão Registrada (Recomendado):** Idealmente, uma das alternativas deve ter sido selecionada com seu motivo formal registrado antes da homologação.
3. **Responsável Identificado:** O nome do arquiteto da ArqVértice responsável pela chancela deve ser informado.
4. **Notas Técnicas:** Devem ser registradas as justificativas de conformidade com o briefing técnico e com as restrições urbanísticas do lote.

---

## 3. Rejeição com Registro de Motivo

Caso nenhuma alternativa atenda aos requisitos ou o estudo se mostre inviável após ensaios volumétricos:
- O estudo pode ser marcado com o status `REJECTED`.
- O sistema obriga o registro do motivo da rejeição (`rejectionReason`) e do responsável.
- O estudo rejeitado **não é apagado do banco de dados**, garantindo que a equipe não repita erros de concepção em fases posteriores (memória de lições aprendidas).

---

## 4. Integração com a Etapa de CONCEITO

Estudos aprovados podem ser encaminhados para a etapa subsequente de **CONCEITO**:
- O método `forwardStudyToConcept(studyId, conceptNotes)` associa o estudo à fase de conceito.
- A flag `forwardedToConcept = true` é atribuída, exibindo um badge visual distintivo no workspace.
- Um registro formal de encaminhamento é gravado no log do projeto, permitindo que a futura engine de conceito herde automaticamente todas as decisões tomadas nesta fase.
