# Auditoria e Mapa de Integração dos Componentes BIM Existentes

Antes da implementação do conector do Revit, todos os módulos existentes do ArqVértice Studio foram mapeados e auditados para garantir reaproveitamento e evitar qualquer duplicação de estruturas.

---

## 1. Mapeamento dos Componentes Existentes

| Componente | Localização | Propósito Atual | Entrada / Saída | Decisão de Reaproveitamento |
| :--- | :--- | :--- | :--- | :--- |
| **BIMViewerModule** | `js/bim-viewer-module.js` | Visualizador 3D hierárquico, corte, medições e consultas determinísticas | In: ProjectId / Out: Render DOM, Seleção | **Reaproveitar integralmente**. Conectar seleção bidirecional com o Revit. |
| **CrossModalSceneGraph** | `js/cross-modal-scene-graph.js` | Grafo ontológico central com 14 nós canônicos e resolução de identidade | In: Nós heterogêneos / Out: Grafo unificado | **Reaproveitar como destino**. RevitElements serão mapeados em nós do grafo. |
| **VisualToStructure** | `js/visual-to-structure.js` | Fusão de visão raster com modelos BIM sob princípio da autoridade BIM | In: Imagem + IFC / Out: Nós semânticos | **Reaproveitar**. Dados Revit sobrescrevem inferências visuais com precedência máxima. |
| **MultimodalToolRegistry**| `js/multimodal-tool-registry.js`| Catálogo de ferramentas, contratos, permissões e sandbox | In: Tool Call / Out: Resultado Auditado | **Reaproveitar**. Registrar `RevitTools` dentro do catálogo existente. |
| **MultimodalRouterJev** | `js/multimodal-router-jev.js` | Roteamento rápido delimitado e checagem de políticas | In: Intent / Out: Despacho de Ferramenta | **Reaproveitar**. Jev despacha tarefas de modelagem avançada para o Revit. |
| **Server.js** | `server.js` | Servidor HTTP local para desenvolvimento e proxy seguro | In: HTTP Requests / Out: Static Assets | **Reaproveitar**. Servir como canal seguro para o conector local do Revit. |
| **SecurityGovernance** | `js/security-governance.js` | Sanitização, prevenção de injeção e isolamento de paths | In: Payloads externos / Out: Safe Object | **Reaproveitar**. Validar todos os comandos enviados ao Revit. |

---

## 2. Princípio de Não-Duplicação

1. **Sem segundo SceneGraph**: Não será criado um `RevitSceneGraph` separado. Todos os elementos lidos do Revit são normalizados como `ArqVerticeBimElement` e inseridos no `CrossModalProjectSceneGraph`.
2. **Sem segunda API de consultas**: O motor semântico conecta-se ao `BIMQueryEngine` existente, expandindo-o para refletir dados nativos do Revit.
3. **Sem duplicar viewers**: O frontend continua utilizando o visualizador leve WebGL/WASM do ArqVértice, enquanto o Revit cuida da autoria e do detalhamento fino no desktop.
