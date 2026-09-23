---
name: project-qa
description: Verificação de coerência global, integridade de dados entre disciplinas e matriz de prontidão do projeto.
---

# Project QA Skill

## Name
`project-qa`

## Purpose
Realizar a auditoria de consistência multidisciplinar (Arquitetura, Interiores, 3D, Cronograma e Orçamento), verificando se existem inconsistências de dados, travas violadas, ambientes sem renders ou documentos desatualizados.

## Trigger
- Finalização de fase do projeto (ex: de Estudo Preliminar para Anteprojeto).
- Comando: "auditar projeto", "verificar pendências", "relatório de integridade".
- Preparação para emissão do Relatório Executivo.

## Inputs
- Estado completo do projeto ativo em `StudioState.data`.
- Entregáveis cadastrados e matriz de travas (*locks*).
- Histórico de revisões e aprovações do cliente.

## Context
Carrega `PROJECT_CONTEXT`, histórico de memória e registros de auditoria.

## Workflow
```text
INPUT (Dados do projeto e disciplinas)
  ↓
LOCK VERIFICATION (Checar se elementos travados foram indevidamente alterados)
  ↓
CROSS-DISCIPLINE AUDIT (Compatibilidade: área de planta vs quantitativo vs cronograma)
  ↓
ASSET INTEGRITY (Validação de URLs de imagens, pranchas e arquivos locais)
  ↓
READINESS SCORE (Cálculo da nota objetiva de prontidão para entrega)
```

## Tools
- `js/revision-system-module.js`
- `js/report-engine-module.js`
- `js/delivery-center-module.js`

## Constraints
- Nunca marcar um projeto como 100% pronto se houver pendências críticas não resolvidas.
- Itens com trava ativa (`locks: true`) não podem ter modificações não autorizadas.

## Output
Relatório de qualidade `ProjectQAReport`:
- `readinessScore`: percentual de 0 a 100%.
- `criticalIssues`: lista de bloqueios para entrega.
- `warnings`: avisos de melhoria recomendada.
- `disciplineSummary`: status por especialidade.

## Validation
- Verificação lógica de precedências de cronograma (ex: alvenaria não pode começar antes da fundação).

## Failure Modes
- Se houver divergência de áreas entre pranchas e o memorial, emitir erro `AREA_DIVERGENCE_CRITICAL`.
