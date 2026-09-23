# ARQVERTICE STUDIO — REGISTRO VIVO DE SKILLS DE AGENTES (I19 & I22)
## Catálogo Canônico, Versionamento e Contratos Operacionais

---

## 1. Visão Geral

As Skills no ArqVértice Studio são pacotes de conhecimento especializado e instruções procedurais que ampliam as capacidades dos agentes de IA de forma determinística e reproduzível. Cada skill é versionada e mantida em `.agents/skills/<skill-name>/SKILL.md`.

---

## 2. Catálogo Oficial das 13 Skills (Versão 1.0.0)

| Skill | Versão | Domínio | Gatilho / Propósito | Caminho |
| :--- | :--- | :--- | :--- | :--- |
| **`architectural-documentation`** | 1.0.0 | Documentação | Geração e formatação de pranchas segundo NBR 6492. | `.agents/skills/architectural-documentation/` |
| **`architecture-brief`** | 1.0.0 | Briefing | Extração e validação do programa de necessidades. | `.agents/skills/architecture-brief/` |
| **`bim-analysis`** | 1.0.0 | BIM | Auditoria geométrica e verificação de vãos e alvenarias. | `.agents/skills/bim-analysis/` |
| **`design-system`** | 1.0.0 | UI/UX | Governança de tokens e componentes padronizados. | `.agents/skills/design-system/` |
| **`image-analysis`** | 1.0.0 | Visão | Análise multimodal de renders 3D e iluminação. | `.agents/skills/image-analysis/` |
| **`material-analysis`** | 1.0.0 | Especificação | Compatibilização de acabamentos e paginação. | `.agents/skills/material-analysis/` |
| **`presentation-direction`** | 1.0.0 | Editorial | Narrativa visual e diagramação para clientes. | `.agents/skills/presentation-direction/` |
| **`project-context`** | 1.0.0 | Contexto | Construção do pacote cognitivo mínimo essencial. | `.agents/skills/project-context/` |
| **`project-qa`** | 1.0.0 | QA | Integridade global e matriz de prontidão do projeto. | `.agents/skills/project-qa/` |
| **`remotion`** | 1.0.0 | Audiovisual | Composição e renderização de vídeo determinístico. | `.agents/skills/remotion/` |
| **`responsive-qa`** | 1.0.0 | UI/UX | Auditoria de viewport mobile, safe-areas e touch targets. | `.agents/skills/responsive-qa/` |
| **`video-direction`** | 1.0.0 | Audiovisual | Direção cinematográfica, prompts de câmera e storyboards. | `.agents/skills/video-direction/` |
| **`visual-qa`** | 1.0.0 | Qualidade Visual | Validação de conformidade estética e anti-AI slop. | `.agents/skills/visual-qa/` |

---

## 3. Estrutura Canônica de cada SKILL.md

Toda skill no repositório obedece obrigatoriamente a 11 seções padronizadas:
1. Frontmatter YAML (`name`, `description`, `version`)
2. `Contexto Operacional`
3. `Diretrizes Inegociáveis`
4. `Regras Técnicas e Normativas`
5. `Fluxo Procedural`
6. `Mapeamento de Ferramentas`
7. `Exemplos de Referência`
8. `Tratamento de Exceções`
9. `Checklist de Validação`
10. `Anti-Patterns`
11. `Glossário do Estúdio`
