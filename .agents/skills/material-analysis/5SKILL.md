---
name: material-analysis
description: Compatibilização de acabamentos, paginação de pisos, índice de reflexão e memorial de materiais.
---

# Material Analysis Skill

## Name
`material-analysis`

## Purpose
Validar a compatibilidade técnica, paginação, resistência ao tráfego (PEI / coeficiente de atrito), absorção acústica e coerência estética de revestimentos, tintas, marcenarias e pedras naturais.

## Trigger
- Seleção de ambiente na aba de Materiais.
- Comando: "verifique os materiais", "compatibilizar paginação", "auditar acabamentos".
- Inclusão de novo insumo no memorial de acabamentos.

## Inputs
- Relação de materiais vinculados ao ambiente ou projeto (`materials-system-module.js`).
- Dimensões das peças (ex: porcelanato 120x120cm, réguas de madeira 20x120cm).
- Tipologia do ambiente (área molhada, externa, tráfego leve, living).

## Context
Carrega `SELECTION_CONTEXT` e memórias de materiais aprovados/rejeitados pelo cliente.

## Workflow
```text
INPUT (Lista de materiais e dimensões do piso/parede)
  ↓
USAGE COMPLIANCE (Verificar área molhada vs escorregamento)
  ↓
LAYOUT & PAGINATION (Ponto de partida da paginação para minimizar recortes)
  ↓
QUANTITY CALCULATION (Cálculo de área m² com quebra de 10% a 15%)
  ↓
SPECIFICATION SHEET (Memorial com código de fábrica e fornecedor)
```

## Tools
- `js/materials-system-module.js`
- `js/material-furniture-boards-module.js`
- `js/quantity-system-module.js`

## Constraints
- Proibido especificar pisos polidos ou escorregadios em áreas de box de chuveiro ou decks externos descobertos.
- Respeitar a diretriz de não utilizar acabamentos previamente rejeitados pelo cliente.

## Output
Ficha técnica `MaterialSpecification`:
- `materialId`: código do produto.
- `areaNetM2`: área líquida real.
- `areaGrossM2`: área bruta com margem de perda recomendada.
- `recommendations`: ponto de partida da paginação e tipo de rejunte.

## Validation
- Consistência de unidades de medida (m² para superfícies, m para rodapés, un para peças especiais).

## Failure Modes
- Caso um produto não possua dados de fornecedor ou dimensões físicas, marcar com alerta `INCOMPLETE_SPECIFICATION`.
