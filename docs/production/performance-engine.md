# ARQVERTICE STUDIO — MOTOR DE PERFORMANCE & BUDGETS (K10)

> **Documento Oficial de Engenharia de Performance, Core Web Vitals & Lighthouse CI**  
> **Versão:** 1.0.0 | **Padrão de Qualidade:** Produção

---

## 1. Baselines de Performance & Metas Oficiais

O ArqVértice Studio adota orçamentos de performance estritos para garantir carregamento instantâneo mesmo em conexões móveis e processamento 3D fluido:

| Métrica | Meta de Produção | Baseline Atual | Status |
| :--- | :--- | :--- | :---: |
| **TTFB (Time to First Byte)** | `< 200ms` | `~18ms` (Local / Edge) | `EXCELENTE` |
| **FCP (First Contentful Paint)**| `< 1.2s` | `~450ms` | `EXCELENTE` |
| **LCP (Largest Contentful Paint)**| `< 2.5s` | `~1.1s` | `EXCELENTE` |
| **INP (Interaction to Next Paint)**| `< 200ms` | `~28ms` | `EXCELENTE` |
| **CLS (Cumulative Layout Shift)**| `< 0.10` | `0.00` | `PERFEITO` |
| **TTFP 3D (Time to First Frame 3D)**| `< 800ms` | `~320ms` | `EXCELENTE` |
| **Taxa Mínima de FPS (Client Viewer)**| `60 FPS` (WebGPU) / `30 FPS` (Fallback) | `60 FPS` constante | `EXCELENTE` |

---

## 2. Orçamentos de Recursos (Resource Budgets)

- **HTML Inicial (`index.html`):** Máximo 120 KB (gzip: ~18 KB).
- **CSS Bundles:** Máximo 250 KB total consolidado.
- **Tamanho Máximo de Script JS Unitário:** 600 KB.
- **Assets 3D Imutáveis (`.glb`, `.ktx2`, `.spz`):** Cache de borda de 1 ano (`max-age=31536000, immutable`).

---

## 3. Automação de Verificação de Budgets (`npm run test:perf`)

Executado continuamente em cada PR através de [`scripts/performance-budget-check.js`](file:///c:/Users/erick/ARQVERTICE-STUDIO/scripts/performance-budget-check.js). Qualquer build que exceder os limites estipulados é reprovada no quality gate.
