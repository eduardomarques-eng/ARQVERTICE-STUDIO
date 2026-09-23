# Camada de QA Visual e Validação das Gerações — ArqVértice Studio (D09)

## 1. Objetivo e Filosofia de QA

O **Visual QA** do ArqVértice Studio é uma camada de inspeção híbrida que analisa cada imagem gerada por modelos de inteligência artificial ou renderizadores antes que a mesma seja homologada como material oficial do projeto.

> [!IMPORTANT]
> **Postura de Transparência Técnica:**
> O sistema **não promete detecção perfeita nem declara "100% correto"**. 
> As classificações canônicas adotadas são:
> - `PASS`: Imagem atende aos requisitos determinísticos inspecionados;
> - `WARNING`: Imagem apresenta potenciais divergências não impeditivas;
> - `REVIEW_REQUIRED`: Foram detectadas violações de lock ou incoerências estruturais que exigem validação humana.

---

## 2. Inspeções Realizadas

A análise avalia de forma determinística e com auxílio de IA:
1. **Conformidade de Locks:** Checagem dos 11 eixos (`GEOMETRY`, `LAYOUT`, `OPENINGS`, `CAMERA`, `MATERIALS`, `LIGHTING`, `FURNITURE`, `DECOR`, `LANDSCAPE`, `COMPOSITION`);
2. **Conformidade de Elementos Homologados:** Verificação dos `ElementLocks` (ex: `SOFA_LOCKED`, `PISO_LIVING_LOCKED`);
3. **Comparação Base × Resultado:** Confrontação entre a geometria de referência e o render resultante;
4. **Artefatos Típicos de IA Generativa:** Investigação de deformações, descontinuidades e membros/objetos duplicados.

---

## 3. Estrutura do Relatório: `VISUAL QA REPORT`

Cada geração inspecionada gera um relatório contendo:
- **Versão e Base:** Identificador da versão analisada e da versão parental;
- **Status Canônico:** `PASS`, `WARNING` ou `REVIEW_REQUIRED`;
- **Pontuação de Confiança:** Valor numérico realista (ex: `0.945` ou `0.885`);
- **Lista de Violações Potenciais:** Itens rotulados como `POTENTIAL_LOCK_VIOLATION`;
- **Avisos e Observações:** Detalhamento de alertas identificados;
- **Revisão Humana:** Histórico de sobreposição técnica (*Approve Anyway*);
- **Telemetria:** Modelo de análise, provider, custos e fingerprint de cache.

---

## 4. Sobreposição Humana: "APPROVE ANYWAY"

Se uma imagem for classificada como `WARNING` ou `REVIEW_REQUIRED`, mas o arquiteto considerar o resultado aceitável ou esteticamente superior:
1. O arquiteto aciona **"APPROVE ANYWAY"**;
2. O sistema exige a identificação do revisor técnico autorizado e a justificativa técnica;
3. O status do relatório é atualizado para `APPROVED_WITH_OVERRIDE`;
4. A imagem é homologada sem alterar retroativamente os achados do motor de QA.

---

## 5. Performance e Cache Inteligente

Para evitar chamadas redundantes e gastos desnecessários de processamento:
- Toda imagem gera um fingerprint hash baseado no seu conteúdo, metadados e estado dos locks;
- Ao solicitar o relatório de uma imagem já inspecionada sem alteração de contexto, o resultado é servido instantaneamente a partir de `visualQACache`.
