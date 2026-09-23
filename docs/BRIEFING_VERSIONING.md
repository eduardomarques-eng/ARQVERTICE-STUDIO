# ARQVERTICE STUDIO — MODELO DE VERSIONAMENTO DO BRIEFING (BLOCO B)
## RASTREABILIDADE, CICLO DE REVISÕES E BLOQUEIO DE VERSÃO

**Documento:** docs/BRIEFING_VERSIONING.md  
**Status:** Implementado em `js/briefing-admin.js`  

---

### 1. MODELO DE MÁQUINA DE ESTADOS

```
DRAFT (Rascunho)
  ↓
SENT (Link Gerado e Enviado ao Cliente)
  ↓
IN_PROGRESS (Cliente Preenchendo com Autosave)
  ↓
SUBMITTED (Submetido com Snapshot Imutável)
  ↓
UNDER_REVIEW (Análise Técnica da ArqVértice)
  ↓
REPORT_SENT (Relatório Executivo Emitido para Validação)
  ↓
  ├──> REVISION_REQUESTED (Cliente solicita ajuste -> Nova Versão V02 -> volta para UNDER_REVIEW)
  └──> APPROVED (Cliente homologa formalmente -> Bloqueio Definitivo)
```

---

### 2. BLOQUEIO DA VERSÃO APROVADA

- O briefing homologado (`APPROVED`) é imutável.
- Se o cliente ou a equipe precisar alterar parâmetros estruturais meses depois, uma nova sessão versionada (`V02`) é aberta, mantendo o histórico de `V01` intacto para fins de auditoria e responsabilidade técnica.
