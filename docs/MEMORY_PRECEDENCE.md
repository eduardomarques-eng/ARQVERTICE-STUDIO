# Ordem Rígida de Precedência de Memória

## 1. As 8 Camadas de Precedência (Prompt Item 14)

Quando o compilador de contexto processa as informações para submissão a um motor de IA ou renderizador, ele resolve ambiguidades aplicando estritamente a seguinte ordem:

```
1. INSTRUÇÃO ATUAL EXPLÍCITA DO ARQUITETO (CURRENT_USER_INTENT)
   └── 2. DECISÃO APROVADA MAIS RECENTE (APPROVED_DECISION)
       └── 3. RESTRIÇÃO APROVADA (APPROVED_RESTRICTION / REJECTED_OUTPUT)
           └── 4. DIRETRIZ DO AMBIENTE (ENVIRONMENT_DIRECTIVE)
               └── 5. DIRETRIZ DO PROJETO (PROJECT_DIRECTIVE)
                   └── 6. REFERÊNCIA APROVADA (APPROVED_REFERENCE)
                       └── 7. PREFERÊNCIA DO CLIENTE (PREFERENCE)
                           └── 8. SUGESTÃO DE IA (AI_SUGGESTION)
```

---

## 2. Regras de Blindagem Cognitiva
- **Nenhuma sugestão antiga de IA (`AI_SUGGESTION`) pode sobrescrever uma decisão aprovada (`DECISION`).**
- **Nenhuma preferência genérica pode violar uma restrição técnica aprovada (`RESTRICTION`).**
- **A diretriz específica do ambiente possui precedência sobre a diretriz global do projeto**, exceto quando a diretriz global for configurada como restrição intransponível.
- Elementos com trava ativa (`isLock: true`) permanecem imutáveis a menos que a instrução explícita do arquiteto demande expressamente sua alteração.
