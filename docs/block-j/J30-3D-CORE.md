# J30 - 3D Core

## Auditoria da base

O repositorio atual e uma aplicacao frontend vanilla com HTML/CSS/JavaScript e `server.js`. Nao existe `package.json`, lockfile, React, TypeScript, Vite, Next.js, R3F, Drei ou Zustand no workspace. O nucleo preserva essa decisao e nao instala dependencias duplicadas.

Ja existentes e reaproveitados:

- `js/arq-scene-bridge.js`: cena de trabalho e vinculo Revit.
- `js/cross-modal-scene-graph.js`: grafo semantico multimodal.
- `js/bim-viewer-module.js`: viewer BIM existente.
- `js/materials-system-module.js` e `js/camera-system-module.js`: dominios de materiais e camera.
- `js/revit-bim-adapter.js`: DTOs, importacao e comandos Revit.

## RendererAdapter

`js/renderer-adapter.js` define a fronteira entre o dominio e o renderer. Detecta WebGPU quando `navigator.gpu` existe e usa WebGL2 como fallback. O core nao instancia Three.js nem conhece detalhes de GPU.

A adocao de Three.js/R3F fica para uma futura camada de renderizacao, somente quando o workspace tiver bundler e dependencia oficial definidos.

## Limites desta fase

Esta entrega nao cria editor completo, client viewer final ou otimizacoes prematuras. Lazy loading, cache de assets, LOD, instancing, frustum culling e workers ficam como contratos de extensao.
