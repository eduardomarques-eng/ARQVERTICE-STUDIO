# K08 — ArqVértice Studio: CI/CD & Quality Gates Automatizados

## 1. Visão Geral
Este documento especifica os pipelines de Integração Contínua (CI) e Entrega Contínua (CD) do **ArqVértice Studio** baseados no **GitHub Actions**, estabelecendo portões rigorosos de qualidade (*Quality Gates*) para garantir zero regressão antes de qualquer publicação em produção.

---

## 2. Fluxo Visual dos Estágios de CI/CD

```mermaid
graph TD
    PR["Git Pull Request (main / staging)"] --> CI["⚙️ GitHub Actions CI (.github/workflows/ci.yml)"]
    
    subgraph "Quality Gates Sequenciais"
        CI --> G1["1. Linting & Route Integrity<br>(npm run lint)"]
        G1 --> G2["2. Typechecking & AST<br>(npm run typecheck)"]
        G2 --> G3["3. Automated Test Suites<br>(85 Suites / npm test)"]
        G3 --> G4["4. Dependency Security Audit<br>(npm audit)"]
        G4 --> G5["5. Secret Detection<br>(Gitleaks Scan)"]
    end

    G5 --> Merge["✅ Merge Aprovado na Branch Main"]
    Merge --> CD["🚀 GitHub Actions CD (.github/workflows/cd-release.yml)"]
    
    subgraph "Build & Registry"
        CD --> DockerBuild["🐳 Multi-Stage Docker Build (Buildx)"]
        DockerBuild --> Tagging["🏷️ Tag Semântica (v1.0.0, sha-*, latest)"]
        Tagging --> GHCR["📦 Publicação no GitHub Packages (ghcr.io)"]
    end
```

---

## 3. Especificação dos Quality Gates (`ci.yml`)

1. **Gate 1 — Linting & Integridade de Rotas (`npm run lint`)**:
   - Validação da sintaxe JavaScript de todos os 119 scripts frontend e rotas de backend.
2. **Gate 2 — Typechecking & Validação de AST (`npm run typecheck`)**:
   - Análise estática e checagem de interfaces UMD/CommonJS/ES sem erros de parsing.
3. **Gate 3 — Suíte Completa de Testes (`npm test`)**:
   - Execução de todas as **85 suítes automatizadas** cobrindo blocos A até K08.
4. **Gate 4 — Auditoria de Vulnerabilidades de Dependências (`npm audit`)**:
   - Bloqueio de pacotes com vulnerabilidades conhecidas de severidade alta ou crítica.
5. **Gate 5 — Detecção de Segredos com Gitleaks**:
   - Verificação de commits contra vazamentos de credenciais, chaves de API ou certificados `.pem`.

---

## 4. Requisitos Obrigatórios de Proteção de Branch (Branch Protection Rules)

Para as branches `main` e `staging`, as seguintes regras devem ser ativadas no repositório GitHub:
- **Require a pull request before merging**: Pelo menos 1 aprovação de Code Review necessária.
- **Require status checks to pass before merging**:
  - `quality-gate` (todos os 5 Quality Gates do CI devem estar verdes).
- **Require branches to be up to date before merging**: Garante teste sobre o código mais recente.
- **Include administrators**: Impede que administradores façam bypass das travas de qualidade.
- **Do not allow force pushes**: Bloqueia `git push --force` para preservar a árvore histórica.
- **Do not allow deletions**: Impede exclusão acidental da branch `main`.
