# ARQVERTICE STUDIO — VISÃO GERAL DO SISTEMA & FRONTEIRAS ARQUITETURAIS (I19 & I22)
## Governança das Camadas: UI ➔ App ➔ Workflow ➔ AI ➔ Tools ➔ Infrastructure

---

## 1. Princípio de Separação de Camadas

Para impedir que a aplicação se degenere em um "monólito de IA desordenado", o ArqVértice Studio impõe barreiras unidirecionais estritas entre 6 camadas arquiteturais:

```text
┌────────────────────────────────────────────────────────┐
│ 1. UI LAYER (Apresentação Visual & Interação)          │
│    - index.html, portal.html, styles.css, hardening.css │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. APPLICATION LAYER (Estado e Fachadas de Domínio)    │
│    - js/state.js, js/app.js, js/contextual-ai-module.js│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. WORKFLOW LAYER (Orquestração, Idempotência & Rollback)│
│    - js/workflow-engine.js, js/agent-orchestrator.js   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. AI & DECISION LAYER (Roteamento, Jev & Modelos)     │
│    - js/ai-performance-router.js, js/jev-decision-engine│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. TOOLS & SPECIALISTS LAYER (BIM, Vídeo, QA, NBR)     │
│    - js/bim-viewer-module.js, video/render/audiovisual │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 6. INFRASTRUCTURE & SECURITY (Storage, Server & Sandbox)│
│    - server.js, js/security-governance.js, LocalDB    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Invariantes de Cada Camada

1. **A camada de UI nunca invoca APIs remotas diretamente.** Ela apenas dispara ações no Application State ou solicita planos ao Workflow Engine.
2. **A camada de IA nunca executa alterações diretas de banco de dados.** Ela apenas retorna dados estruturados validados por schema para o Application Layer decidir sobre a mutação.
3. **A camada de Ferramentas (Tools) é governada por contratos de autorização.** Agentes não podem invocar ferramentas além de suas atribuições estritas.
4. **A camada de Infraestrutura garante isolamento de sandbox.** Tentativas de gravação ou leitura fora dos diretórios homologados são abortadas imediatamente.
