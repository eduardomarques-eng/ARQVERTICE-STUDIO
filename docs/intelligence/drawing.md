# Parsing de Desenhos Técnicos e Documentos Arquitetônicos

O módulo de ingestão e parsing de documentos (`js/drawing-document-parser.js`) trata pranchas, plantas e detalhes técnicos não como imagens simples, mas como documentos vetoriais e estruturados contendo informações exatas de projeto.

---

## 1. Formatos Suportados

- **DXF / DWG**: Parsing vetorial de camadas (layers), linhas de paredes, blocos de mobiliário, esquadrias e textos de cotas segundo a **NBR 6492**.
- **SVG Técnico**: Vetores limpos com hierarquia de grupos para pranchas diagramadas e plantas humanizadas.
- **PDF Técnico Executivo**: Extração estruturada de pranchas multipáginas, legendas de selo, notas de especificação e tabelas de acabamentos.
- **IFC**: Geometrias nativas e atributos semânticos de modelos BIM.
- **STEP**: Sólidos paramétricos tridimensionais.

---

## 2. Geometria Exata vs. Aproximação Visual

O ArqVértice segue uma regra categórica de prioridade na ingestão:

```text
       Dado Vetorial / Numérico Exato (DXF/IFC/STEP)
                            ▲
                            │ (Precedência Absoluta)
                            │
              Inferência / Aproximação Visual (Raster)
```

Se um arquivo DXF indica que uma parede tem `150mm` de espessura e uma imagem escaneada parece indicar `140mm`, o valor vetorial de `150mm` é preservado e apontado como verdade técnica no grafo de cena.

---

## 3. Ciclo de Vida do Documento

Cada prancha ou documento ingerido passa por três estados de maturidade técnica:
1. **DRAFT**: Desenho preliminar ou croquis com cotas aproximadas.
2. **REVIEW**: Prancha compatibilizada pendente de verificação de interferências.
3. **APPROVED**: Documento executivo liberado com selo e carimbo digital de governança.
