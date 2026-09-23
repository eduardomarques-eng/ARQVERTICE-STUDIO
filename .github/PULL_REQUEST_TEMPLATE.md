## 📋 Descrição das Alterações

<!-- Descreva brevemente o objetivo da PR e os blocos impactados -->

---

## 🛡️ Checklist Obrigatório de Quality Gates

- [ ] **Testes:** Executado `npm test` e todas as 89 suítes passaram sem falhas.
- [ ] **Typecheck & Lint:** Executados `npm run typecheck` e `npm run lint` com zero erros.
- [ ] **Segurança:** Executado `npm run test:security` e nenhuma chave/secret foi exposta no código.
- [ ] **Performance:** Executado `npm run test:perf` e os orçamentos de tamanho e Web Vitals foram atendidos.
- [ ] **Acessibilidade & Visual:** Verificada conformidade com `:focus-visible`, safe-areas e touch targets.
- [ ] **Migrações de Banco:** Criado script `.sql` numerado com transação atômica em `database/migrations/` se houver alteração de esquema.
- [ ] **Documentação:** Atualizados os playbooks e arquivos de documentação técnica em `/docs`.
- [ ] **Breaking Changes:** Verificada a retrocompatibilidade com versões ativas em produção.
