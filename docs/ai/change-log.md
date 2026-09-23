# ARQVERTICE STUDIO — CHANGE LOG ARQUITETURAL (I19 & I22)
## Registro Cronológico de Evolução da Arquitetura do Bloco I

---

### Registro 2026-09-22 — Conclusão do Bloco I (I17 a I22)
* **Data:** 22/09/2026
* **Alteração:** Implementação de Segurança e Governança de IA (`SecurityGovernance`), Dataset de Avaliações e Benchmarks Jev (`ai-evaluations.test.js`), Documentação Viva Unificada, Hardening de Frontend (`hardening.css`), Auditoria Unificada e Feature Flags (`FeatureFlags`).
* **Motivo:** Estabelecer barreiras inquebráveis de segurança contra injeção de prompt e vazamento de secrets, garantir não regressão via Golden Cases, eliminar código morto e preparar o sistema para o Bloco II.
* **Sistemas Afetados:** `js/security-governance.js`, `js/feature-flags.js`, `css/hardening.css`, `tests/ai-evaluations.test.js`, `tests/security-governance.test.js`, `docs/`.
* **Migração:** Inclusão dos módulos de segurança e feature flags no bootstrap de `index.html`.
* **Rollback:** Desativar flags experimentais via `window.FeatureFlags.disable(flag)`.

---

### Registro 2026-09-22 — Expansão BIM, Vídeo Remotion & Orquestração (I12 a I16)
* **Data:** 22/09/2026
* **Alteração:** Criação do `BIMViewerModule` e `BIMQueryEngine` determinístico, registro de templates de vídeo e pipeline Remotion (`audiovisual-pipeline.js`), `AgentOrchestrator` com 5 papéis canônicos, `WorkflowEngine` com dry-run e rollback, e `AIPerformanceRouter` com orçamentos de latência e cache LRU.
* **Motivo:** Permitir inspeção 3D de modelos IFC sem alucinações de LLM, automatizar a produção de vídeos arquitetônicos com física de molas e garantir orquestração governada de agentes.
* **Sistemas Afetados:** `js/bim-viewer-module.js`, `video/render/audiovisual-pipeline.js`, `js/agent-orchestrator.js`, `js/workflow-engine.js`, `js/ai-performance-router.js`.
* **Migração:** Adição das tags `<script>` na ordem correta no rodapé de `index.html`.
* **Rollback:** Remoção dos scripts ou desativação via flags de módulo.

---

### Registro 2026-09-21 — Camada Contextual e Criação das 13 Skills (I07 a I11)
* **Data:** 21/09/2026
* **Alteração:** Implementação do `ContextBuilder`, roteador semântico de comandos com ciclo Propose-Preview-Validate-Apply, auditoria a11y/responsiva e especificação das 13 skills de agentes em `.agents/skills/`.
* **Motivo:** Capacitar agentes autônomos com conhecimento procedimental estrito e dotar o frontend de acessibilidade e touch targets táteis para mobile/desktop.
* **Sistemas Afetados:** `js/contextual-ai-module.js`, `css/responsive-a11y.css`, `.agents/skills/`.
* **Migração:** Totalmente compatível com o estado pré-existente.
* **Rollback:** Exclusão da pasta `.agents/skills/` se necessário.

---

### Registro 2026-09-20 — Fundação de IA, Observabilidade e Jev Engine (I01 a I06)
* **Data:** 20/09/2026
* **Alteração:** Criação de `js/ai-foundation.js`, `js/jev-decision-engine.js`, catalogo de tokens de design e auditoria de contratos visuais em `DESIGN.md`.
* **Motivo:** Desacoplar a aplicação de provedores específicos de IA e instituir o motor de decisão delimitada Jev para eliminar custos desnecessários com LLM.
* **Sistemas Afetados:** `js/ai-foundation.js`, `js/jev-decision-engine.js`, `styles.css`.
* **Migração:** Nenhuma quebra de compatibilidade com os blocos A a H.
* **Rollback:** Preservado código original de render-providers.
