# REGISTRO DE DECISÕES DO PROJETO (ADR) — ARQVERTICE STUDIO

## ADR-000: Adoção do Bloco 00 e Regras Mestras
- **Data:** 2026-09-21
- **Status:** Aprovado
- **Contexto:** Definição do escopo, governança de desenvolvimento, relação com o Revit e princípio de não-perda.
- **Decisão:** O projeto será desenvolvido em blocos estritos, iniciando por auditoria sem alterações destrutivas, preservando a base de cronograma existente (`cronograma-residencia-praia`) e o repositório de briefing (`briefing-arqvertice`).
- **Consequências:** Todas as decisões arquiteturais futuras (Next.js, PostgreSQL, ORM, IA Providers) serão precedidas de auditoria e testes de viabilidade técnica.
