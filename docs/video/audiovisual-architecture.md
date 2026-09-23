# ARQVERTICE STUDIO — ARQUITETURA AUDIOVISUAL & REMOTION (I19)
## Composição Programática Determinística, Templates e Video QA

---

## 1. Visão Geral

O sistema audiovisual do ArqVértice Studio (`video/render/audiovisual-pipeline.js`) combina a síntese narrativa de modelos multimodais com a precisão de renderização determinística e frame-a-frame do Remotion.

```text
VideoBrief (Intenção do Arquiteto)
         ↓
AudiovisualJevRouter (Seleção de Template & Ritmo)
         ↓
NarrativeScriptSynthesizer (Roteiro & Beats de Câmera)
         ↓
Remotion Composition (Física de Molas, Interpolação & Áudio)
         ↓
VideoQAService (Auditoria de Resolução, Safe Areas & Legibilidade)
```

---

## 2. Catálogo de 7 Templates Estruturados

Definidos em `video/templates/template-registry.js`:
1. **`architecture` (16:9, 45s):** Apresentação geral de partido arquitetônico, circulação e volumetria.
2. **`project-presentation` (16:9, 60s):** Apresentação executiva para clientes com ênfase em memorial e ambientes.
3. **`before-after` (16:9 ou 9:16, 20s):** Estudo de reforma comparativa com transição wipe central.
4. **`social` (9:16, 15-30s):** Formato vertical para reels/stories com cortes ágeis e tipografia impactante.
5. **`technical` (16:9, 40s):** Foco em paginação, iluminação embutida e detalhamentos executivos.
6. **`cinematic` (16:9 / 2.39:1, 90s):** Percurso contemplativo de atmosfera com transições lentas e profundidade de campo.
7. **`portfolio` (16:9, 30s):** Resumo dinâmico de projetos concluídos do estúdio.

---

## 3. Garantias do Pipeline Determinístico

- **Reprodutibilidade Estrita:** A composição Remotion utiliza uma seed de renderização fixa. Dois renders executados com o mesmo `VideoBrief` produzirão exatamente os mesmos frames.
- **Física de Molas (Spring Motion):** Transições e tipografia utilizam interpolação `spring({ damping, stiffness, mass })`, eliminando saltos abruptos.
- **Auditoria Automática (Video QA):** Antes de entregar o arquivo final ao cliente, o pipeline valida resolução mínima (1080p), taxa de quadros (30/60 fps) e safe zones de margem técnica.
