# ARQVERTICE STUDIO — PIPELINE DE CI/CD & AUTOMAÇÃO DE QUALIDADE (K14)

> **Documento Oficial de Automação, Quality Gates & Governança de GitHub Actions**  
> **Versão:** 1.0.0 | **Padrão:** 8 Quality Gates Obrigatórios

---

## 1. Fluxo Visual do Pipeline de CI/CD

```mermaid
graph TD
    PUSH[1. Push / Pull Request] --> INSTALL[2. Checkout & Cache de Dependências]
    INSTALL --> LINT[3. Linting & Validação de Rotas]
    LINT --> TYPECHECK[4. Typechecking Rigoroso]
    TYPECHECK --> TESTS[5. Suíte de Testes (88 Arquivos)]
    TESTS --> SECURITY[6. Security & Hardening (K04/K10)]
    SECURITY --> PERF[7. Performance Budgets (K10/K11)]
    PERF --> SUPPLY[8. Gitleaks & npm audit (K03)]
    SUPPLY --> BUILD[9. Production Build & Dockerfile Multi-stage]
    BUILD --> CD[10. Publicação no GHCR & Deploy Zero-Downtime (K09)]
```

---

## 2. Princípios de Segurança de GitHub Actions

1. **Permissões Mínimas (`least privilege`):**
   - Workflows de CI rodam exclusivamente com `permissions: contents: read`.
   - Workflows de release utilizam `packages: write` restrito ao container registry.
2. **Ações Fixadas:** Todas as actions utilizam versões principais estáveis (`@v4`, `@v3`, `@v2`).
3. **Isolamento de Secrets:** Nenhuma credencial de produção é injetada em pull requests originados de forks.
4. **Artefatos e Relatórios:** Geração e armazenamento de relatórios de cobertura e traces de teste no diretório de auditoria.
