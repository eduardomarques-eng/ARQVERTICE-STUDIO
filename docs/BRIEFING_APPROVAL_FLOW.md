# ARQVERTICE STUDIO — FLUXO DE APROVAÇÃO E REVISÕES (B06)
## CICLO DE HOMOLOGAÇÃO DO BRIEFING PELO CLIENTE

**Documento:** docs/BRIEFING_APPROVAL_FLOW.md  
**Status:** Implementado em `js/briefing-engine.js` e `js/briefing-admin.js`  

---

### 1. AÇÕES DISPONÍVEIS PARA O CLIENTE

Após a emissão do **Relatório de Confirmação Executivo** pela ArqVértice (`REPORT_SENT`), o link do cliente passa a exibir o parecer técnico e duas ações definitivas:

1. **APROVAR BRIEFING**:
   - O cliente homologa o documento oficial.
   - O status é atualizado para `APPROVED`.
   - É gravado o `approvedSnapshot` com timestamp e identificação.
   - O projeto correspondente é liberado no Workspace com transição da etapa de Briefing para `concluido` e ativação da etapa de `estudos` (*Pronto para Estudos Preliminares & 3D*).
2. **SOLICITAR ALTERAÇÃO**:
   - Abre modal onde o cliente descreve o que deseja acrescentar ou corrigir.
   - A observação é registrada no array histórico `revisions`.
   - O status transita para `REVISION_REQUESTED` e a versão avança para `V02`.
   - A equipe da ArqVértice faz os ajustes e reemite o relatório para nova aprovação.
