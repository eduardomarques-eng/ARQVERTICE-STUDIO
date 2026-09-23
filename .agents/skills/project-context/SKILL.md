---
name: project-context
description: Construção e empacotamento do contexto cognitivo mínimo essencial do projeto para os agentes de IA.
---

# Project Context Skill

## Name
`project-context`

## Purpose
Montar dinamicamente o pacote de dados contextuais (`ContextPackage`) sem sobrecarga de rede ou vazamento de dados supérfluos (Context Minimization), conectando a tela ativa, seleção do usuário e memórias pertinentes da arquitetura.

## Trigger
- Pré-requisito para qualquer chamada a agentes, prompts de IA ou comandos em linguagem natural.
- Comando: "obter contexto ativo", "montar pacote de contexto", "inspecionar contexto de IA".
- Mudança de seleção de ambiente ou prancha pelo arquiteto.

## Inputs
- Estado da aplicação (`StudioState.data`).
- Seleção ativa em tela (`MemoryLayers.getSelection()`).
- Intenção da tarefa solicitada.

## Context
Orquestrador central de todos os contextos: `PROJECT_CONTEXT`, `SCREEN_CONTEXT`, `SELECTION_CONTEXT`, `BIM_CONTEXT`, `MEDIA_CONTEXT` e `DOCUMENT_CONTEXT`.

## Workflow
```text
TASK INTENT RECEIVED
  ↓
DOMAIN FILTERING (Identificar se a tarefa é de Vídeo, BIM, Materiais ou Geral)
  ↓
EXTRACT TARGET SLICE (Recortar apenas o ambiente ou prancha em foco)
  ↓
LOAD RELEVANT MEMORIES (Filtrar as 3 a 5 memórias mais pertinentes)
  ↓
STRIP UNUSED ARTIFACTS (Remover dumps pesados, logs antigos e dados irrelevantes)
  ↓
COMPACT CONTEXT PACKAGE READY
```

## Tools
- `js/contextual-ai-module.js` (`ContextBuilder`)
- `js/memory-module.js`

## Constraints
- Princípio da Minimização: nunca enviar o estado inteiro do estúdio por padrão.
- Dados confidenciais do cliente (CPF, telefone, dados bancários) nunca devem ser incluídos no pacote de contexto de IA.

## Output
Objeto JSON compacto `ContextPackage`:
- `timestamp`: data/hora ISO.
- `project`: identificadores e metadados resumidos.
- `screen`: view e tab ativas.
- `selection`: item focado com propriedades essenciais.
- `relevantMemories`: decisões e restrições formais vigentes.

## Validation
- O tamanho do payload do pacote deve ser preferencialmente menor que 15 KB para otimização de latência e tokens.

## Failure Modes
- Se nenhum projeto estiver selecionado na aplicação, retornar contexto geral de fallback sem quebrar a execução do agente.
