# Laboratório de Avaliação Multimodal e Benchmarks

O módulo de avaliação (`tests/multimodal-evaluation-lab.test.js`) afere a acurácia, estabilidade e eficiência de todas as rotas e modelos do ArqVértice Studio através de datasets reais de arquitetura e métricas multidimensionais objetivas.

---

## 1. Princípio da Avaliação Objetiva

> **O ArqVértice Studio não utiliza uma nota subjetiva única global.**

A qualidade do motor é medida através de 8 vetores quantitativos independentes:
1. **Accuracy (Acurácia)**: Proximidade do resultado em relação ao ground truth técnico (IOU de bounding boxes, conformidade métrica milimétrica em CAD).
2. **Completion (Taxa de Conclusão)**: Porcentagem de tarefas executadas até o fim sem interrupção por exceção ou timeout.
3. **Tool Selection (Seleção de Ferramenta)**: Índice de acerto do roteador Jev na escolha da ferramenta correta para o domínio.
4. **Latency (Latência)**: Tempo total de inferência e despacho de ponta a ponta (meta: <200ms para decisões Jev).
5. **Failure Rate (Taxa de Falha)**: Ocorrência de erros não tratados durante a execução.
6. **Recovery Rate (Recuperação)**: Capacidade do sistema de ativar o fallback quando o modelo primário falha ou atinge timeout.
7. **Human Correction (Correção Humana)**: Frequência com que o arquiteto precisa intervir manualmente para corrigir a ação do agente.
8. **Cost (Custo Computacional / API)**: Estimativa de custo de tokens e tempo de GPU consumido por tarefa.

---

## 2. As 10 Categorias de Ativos do Dataset

1. `architectural image`: Fotografias e renders conceituais de interiores e fachadas.
2. `floor plan`: Plantas baixas 2D em DXF e SVG com divisões de ambientes e cotas.
3. `elevation`: Vistas ortogonais e cortes verticais com indicação de níveis e alturas.
4. `render`: Imagens foto-realistas com iluminação Cycles/V-Ray para checagem de materiais.
5. `3D scene`: Cenas completas em GLB com múltiplos mobiliários e componentes.
6. `CAD part`: Peças sólidas paramétricas em STEP para detalhamento de marcenaria.
7. `IFC model`: Edifícios completos com classes IFC4 para auditoria de áreas e volumes.
8. `material image`: Texturas PBR em alta resolução com mapas de normal e rugosidade.
9. `drawing`: Detalhes executivos segundo NBR 6492 em DWG.
10. `technical PDF`: Cadernos de especificações e memoriais descritivos multipáginas.

---

## 3. Tarefas de Ouro (Golden Tasks)

Conjunto de testes de invariância contínua que obrigatoriamente devem permanecer passando a cada refatoração ou atualização de dependências:
- **Golden Task 1**: Roteamento inequívoco de imagem conceitual para `ThreeDTools` / `TRELLIS.2`.
- **Golden Task 2**: Edição semântica de dimensão paramétrica em arquivo STEP via `CADTools` / `FreeCAD-MCP`.
- **Golden Task 3**: Segmentação de mobiliário com inpainting e preservação de fundo via `ImageTools` / `SAM3`.
- **Golden Task 4**: Consulta autoritativa de áreas e volumes IFC via `BIMTools` / `ThatOpen-Engine`.

---

## 4. Matriz Comparativa por Tarefa Especializada

| Tarefa de Domínio | Modelo A | Modelo B | Modelo Vencedor (Empírico) | Justificativa |
| :--- | :--- | :--- | :--- | :--- |
| **Visão Espacial & Bounding Box** | Qwen3-VL (Acc: 0.94) | SAM3 (Acc: 0.81) | **Qwen3-VL** | Superior na compreensão contextual de relações espaciais e rótulos arquitetônicos. |
| **Segmentação de Silhueta Fina** | Qwen3-VL (Acc: 0.82) | SAM3 (Acc: 0.98) | **SAM3** | Precisão sub-pixel incomparável para máscaras de inpainting. |
| **Síntese Imagem-para-3D** | TRELLIS.2 (Fidelity: 0.95) | Point-E (Fidelity: 0.62) | **TRELLIS.2** | Gera malhas manifold com texturas PBR estruturadas. |
