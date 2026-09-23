# ================================================================
# ARQVERTICE STUDIO — WORKSPACE DE DESENVOLVIMENTO (C05)
# PROJECT_WORKSPACE.md
# ================================================================

VERSÃO: C05.1
DOCUMENTAÇÃO: ARQUITETURA E DIRETRIZES DO WORKSPACE DE DESENVOLVIMENTO

---

## 1. OBJETIVO E FILOSOFIA DE TRABALHO

O **Workspace de Desenvolvimento do Projeto (Bloco C05)** é o centro de comando e governança técnica da ArqVértice.
Ele centraliza o acompanhamento, organização e documentação de todas as decisões e arquivos produzidos ao longo do ciclo de vida da obra.

### Princípio Fundamental (Prompt C05 Item 1):
> **O ArqVértice Studio NÃO substitui ferramentas profissionais especializadas:**
> - Autodesk Revit (Modelagem BIM e documentação técnica)
> - AutoCAD (Detalhamento 2D)
> - Corona Renderer / 3ds Max / V-Ray (Visualização e renders fotorrealistas)
> - Adobe Photoshop (Pós-produção e tratamento de imagem)

O papel do ArqVértice Studio é **organizar o processo, conectar os entregáveis, registrar a rastreabilidade das decisões e consolidar os resultados**, servindo como ponte transparente entre clientes, arquitetos titulares, engenheiros e fornecedores.

---

## 2. HIERARQUIA DE VISUALIZAÇÃO DO WORKSPACE

A interface do workspace segue uma hierarquia de prioridades estrita para uso executivo:

1. **Estado do Projeto & Marcos:** Visibilidade imediata de onde o projeto se encontra na máquina de estados e percentual de marcos conquistados.
2. **Pendências & Bloqueios Críticos:** Lista acionável de itens pendentes de aprovação do cliente ou de finalização técnica, com prazos e responsáveis explícitos.
3. **Próximos Passos & Checklist:** Checklist de grandes etapas do projeto para acompanhamento tático da equipe.
4. **Decisões Recentes Homologadas:** Timeline com links de rastreabilidade para as origens formais (Estudos C03, Conceito C04, Revisões C05).
5. **Entregáveis & Arquivos (com vínculo Revit):** Repositório filtrável por disciplinas com metadados de vistas, pavimentos e classificação de arquivos oficiais.
6. **Progresso por Ambiente & Cronograma Conectado:** Evolução física ponderada por ambiente e atalho de visualização para o cronograma geral sem redundâncias.

---

## 3. SNAPSHOTS DE VERSÃO DO PROJETO (`PROJECT_V01`, `PROJECT_V02`...)

Ao atingir marcos chave ou emitir pacotes para aprovação do cliente, o arquiteto pode gerar um **Snapshot de Versão do Projeto**.
Cada snapshot é **não-destrutivo** e congela em JSON o contexto integral vigente:
- Versão do Conceito e Diretrizes (`DESIGN_CONCEPT`);
- Briefing Técnico e preferências vigentes;
- Estudos preliminares homologados e decisões tomadas;
- Referências visuais aprovadas;
- Entregáveis e pranchas validadas no momento da emissão.
