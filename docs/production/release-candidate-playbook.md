# ARQVERTICE STUDIO — PLAYBOOK DE RELEASE CANDIDATE & PROMOÇÃO DE AMBIENTES (K15)

> **Documento Oficial de Engenharia de Release, Promoção de Ambientes & Governança**  
> **Versão:** 1.0.0 | **Ambientes:** Local ➔ Preview / Staging ➔ Produção

---

## 1. Fluxo Canônico de Promoção de Código

```
[ Feature Branch ] ──(Push)──► [ Pull Request ]
                                      │
                               (CI Quality Gates)
                                      │
                                      ▼
                           [ Preview / Staging ]
                                      │
                               (E2E / QA Humano)
                                      │
                                      ▼
                        [ Release Candidate (RC) ]
                         Manifesto SHA-256 Imutável
                                      │
                                      ▼
                          [ Produção Zero-Downtime ]
                          Blue-Green Switch (K09)
```

---

## 2. Critérios de Aprovação de Release Candidate

Para que uma build seja promovida de Staging para Produção, ela deve obrigatoriamente possuir:
1. **Manifesto RC Gerado:** Gerado via `npm run release:check` com hashes criptográficos dos arquivos críticos.
2. **100% dos Quality Gates Aprovados:** CI sem falhas em Lint, Typecheck, Testes (88 suítes), Hardening e Performance.
3. **Validação em Preview/Staging:** Verificação do carregamento de modelos 3D volumosos no Client Viewer em ambiente espelho.
4. **Prontidão de Rollback:** Snapshot de banco de dados pré-migração registrado e plano de contingência ativo.
