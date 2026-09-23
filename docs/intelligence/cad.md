# Modelagem Paramétrica e Inteligência CAD

O motor CAD paramétrico (`js/parametric-cad-engine.js`) viabiliza a manipulação exata e baseada em restrições da geometria arquitetônica e de detalhamento de marcenaria/esquadrias, integrando-se a engines de nível industrial (FreeCAD / CADAgent).

---

## 1. Princípio da Árvore de Recursos (Feature Tree)

Ao contrário de softwares de escultura poligonal ou modelos gerativos raster, alterações em peças e componentes técnicos são realizadas semanticamente na árvore de operações:

```text
Documento CAD
    └── Body
         ├── Sketch (Restrições: Horizontalidade, Coincidência, Distância)
         ├── Pad (Extrusão: Comprimento = 1000mm)
         ├── Pocket (Furação: Raio = 25mm)
         └── Fillet (Arredondamento: Raio = 5mm)
```

**Comportamento:** Ao receber a instrução *"Aumente a largura da bancada de 1000mm para 1200mm"*, o agente não regenera uma malha nem edita vértices soltos; ele atualiza o parâmetro `largura` na feature correspondente e dispara o comando determinístico `recompute()`.

---

## 2. Tipos Canônicos de Restrições e Operações

- **Geometrias no Sketch**: Linhas, arcos, círculos, splines e pontos de controle.
- **Restrições Suportadas**:
  - `COINCIDENT`: União de dois pontos.
  - `PARALLEL` / `PERPENDICULAR`: Orientação angular relativa.
  - `HORIZONTAL` / `VERTICAL`: Alinhamento ortogonal canônico.
  - `DISTANCE` / `RADIUS`: Cotas métricas fixas com tolerância zero.
- **Features de Sólido**: `PAD` (extrusão), `REVOLVE` (revolução), `POCKET` (furação/corte), `FILLET` (concordância), `CHAMFER` (chanfro).

---

## 3. Validação de Saúde e Manifoldness

A cada recálculo, o motor verifica:
1. **Graus de Liberdade (DOF)**: Sketch completamente restrito (`DOF = 0`).
2. **Topologia Fechada**: Sem auto-interseções ou arestas não-múltiplas.
3. **Integridade de Exportação**: Validação de conformidade com os formatos industriais **STEP (ISO 10303-21)** e **IGES**.
