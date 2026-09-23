# ArqVértice Studio — Hierarquia de Precedência de Locks (D07)

## 0. Visão Geral

Quando múltiplas instruções, decisões, diretrizes e memórias coexistem em um projeto arquitetônico, o sistema aplica um motor de decisão com **8 níveis de precedência estritos**.

---

## 1. A Escala de 8 Níveis de Precedência

```
[NÍVEL 1]  Pedido Atual Explícito do Usuário
     │
     ▼
[NÍVEL 2]  Decisão Aprovada Mais Recente (Homologação Humana)
     │
     ▼
[NÍVEL 3]  Lock Ativo (Categórico ou de Elemento Específico)
     │
     ▼
[NÍVEL 4]  Restrição Aprovada (ex: Sem pisos polidos escorregadios)
     │
     ▼
[NÍVEL 5]  Diretriz Específica do Ambiente (Exceção Local Homologada)
     │
     ▼
[NÍVEL 6]  Diretriz Global do Projeto (Linguagem Geral de Materiais)
     │
     ▼
[NÍVEL 7]  Referência Visual Aprovada (Curadoria D02)
     │
     ▼
[NÍVEL 8]  Sugestão de IA (Sempre submissa ao controle humano)
```

---

## 2. Regras Fundamentais de Mediação de Conflitos

1. **Nunca Escolher Silenciosamente**:
   Se um comando colidir com um nível de precedência superior (ex: pedido do usuário de Nível 1 tentando alterar um elemento travado no Nível 3 sem desbloqueio explícito), o motor **não decide arbitrariamente**. Ele apresenta a colisão ao arquiteto e aguarda decisão.

2. **Decisão Local vs Diretriz Global**:
   - Uma decisão local do ambiente (Nível 5) possui precedência sobre a diretriz global do projeto (Nível 6).
   - Exemplo: se o projeto dita *carvalho natural* globalmente, mas a cozinha possui decisão homologada de *madeira freijó escuro*, a cozinha renderizará *freijó escuro*.

3. **Subordinação Total da IA (Nível 8)**:
   - A IA ocupa o último nível de precedência.
   - Nenhuma inferência ou sugestão de IA pode sobrescrever decisões, restrições ou locks aprovados por humanos.
