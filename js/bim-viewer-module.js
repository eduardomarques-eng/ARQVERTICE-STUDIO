/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I12: MOTOR BIM, 3D & VISUALIZAÇÃO ESTRUTURADA
 * ============================================================================
 * Módulo de visualização, inspeção geométrica, planos de corte, medição
 * e motor de queries estruturadas determinísticas para IA + BIM.
 * Diretriz: Dados Estruturados > Inferência Visual.
 * ============================================================================
 */

(function (global) {
  'use strict';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 1. MODELO HIERÁRQUICO BIM CANÔNICO EM MEMÓRIA
   */
  class BIMModelStore {
    constructor() {
      this.projects = new Map();
      this._seedDefaultBIMData();
    }

    _seedDefaultBIMData() {
      const defaultBIM = {
        projectId: 'prj-01',
        building: {
          id: 'bld-01',
          name: 'Residência Alphaville Eusébio',
          levels: [
            {
              id: 'lvl-01',
              name: 'Pavimento Térreo',
              elevationM: 0.00,
              spaces: [
                {
                  id: 'spc-living',
                  name: 'Living Integrado',
                  category: 'Social',
                  areaM2: 52.50,
                  heightM: 3.00,
                  perimeterM: 29.80,
                  elements: [
                    {
                      id: 'elem-wall-01',
                      name: 'Parede Sul - Divisória',
                      type: 'IfcWallStandardCase',
                      material: 'Alvenaria Cerâmica 15cm',
                      thicknessM: 0.15,
                      lengthM: 8.50,
                      areaM2: 25.50,
                      properties: {
                        'Acabamento': 'Pintura Acrílica Fosca Off-White',
                        'Resistencia_Fogo': 'CF 60min',
                        'Estrutural': false
                      }
                    },
                    {
                      id: 'elem-floor-01',
                      name: 'Piso do Living',
                      type: 'IfcSlab',
                      material: 'Porcelanato Acetinado 120x120cm',
                      thicknessM: 0.10,
                      areaM2: 52.50,
                      properties: {
                        'Acabamento': 'Porcelanato Calacatta Gold',
                        'Coeficiente_Atrito': '0.50 (Área Seca)',
                        'Estrutural': true
                      }
                    },
                    {
                      id: 'elem-window-01',
                      name: 'Esquadria de Alumínio Vidro Duplo',
                      type: 'IfcWindow',
                      material: 'Vidro Laminado 8mm + Alumínio Preto',
                      widthM: 3.20,
                      heightM: 2.60,
                      areaM2: 8.32,
                      properties: {
                        'Transmitancia_Termica': '2.8 W/m²K',
                        'Atenuacao_Acustica': '34 dB',
                        'Fabricante': 'Esquadrias Premium'
                      }
                    }
                  ]
                },
                {
                  id: 'spc-cozinha',
                  name: 'Cozinha Gourmet',
                  category: 'Serviço/Social',
                  areaM2: 24.00,
                  heightM: 3.00,
                  perimeterM: 19.60,
                  elements: [
                    {
                      id: 'elem-wall-02',
                      name: 'Bancada Molhada Alvenaria',
                      type: 'IfcWall',
                      material: 'Alvenaria Hidráulica 20cm',
                      thicknessM: 0.20,
                      areaM2: 12.00,
                      properties: {
                        'Acabamento': 'Revestimento Cerâmico Esmaltado',
                        'Instalacao_Hidraulica': true
                      }
                    },
                    {
                      id: 'elem-door-01',
                      name: 'Porta de Passagem Despensa',
                      type: 'IfcDoor',
                      material: 'Madeira MDF Laca',
                      widthM: 0.80,
                      heightM: 2.10,
                      areaM2: 1.68,
                      properties: {
                        'Vao_Livre': '0.80m (Conforme NBR 9050)',
                        'Fechadura': 'Magnética Oculta'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      this.projects.set('prj-01', defaultBIM);
    }

    getBIM(projectId) {
      return this.projects.get(projectId) || this.projects.get('prj-01');
    }
  }

  const BIMStore = new BIMModelStore();

  /**
   * 2. MOTOR DE QUERIES ESTRUTURADAS DETERMINÍSTICAS (IA + BIM sem LLM)
   */
  const BIMQueryEngine = {
    getSpaces(projectId) {
      const bim = BIMStore.getBIM(projectId);
      const spaces = [];
      bim.building.levels.forEach(lvl => {
        lvl.spaces.forEach(spc => {
          spaces.push({
            id: spc.id,
            name: spc.name,
            level: lvl.name,
            areaM2: spc.areaM2,
            heightM: spc.heightM,
            elementsCount: spc.elements.length
          });
        });
      });
      return spaces;
    },

    getSpaceById(projectId, spaceId) {
      const bim = BIMStore.getBIM(projectId);
      for (let lvl of bim.building.levels) {
        for (let spc of lvl.spaces) {
          if (spc.id === spaceId || spc.name.toLowerCase() === spaceId.toLowerCase()) {
            return { ...spc, levelName: lvl.name };
          }
        }
      }
      return null;
    },

    getElementsBySpace(projectId, spaceId) {
      const spc = this.getSpaceById(projectId, spaceId);
      return spc ? spc.elements : [];
    },

    getElementById(projectId, elementId) {
      const bim = BIMStore.getBIM(projectId);
      for (let lvl of bim.building.levels) {
        for (let spc of lvl.spaces) {
          for (let elem of spc.elements) {
            if (elem.id === elementId) {
              return { ...elem, spaceName: spc.name, levelName: lvl.name };
            }
          }
        }
      }
      return null;
    },

    getMaterialsByElement(projectId, elementId) {
      const elem = this.getElementById(projectId, elementId);
      if (!elem) return [];
      return [
        {
          element: elem.name,
          primaryMaterial: elem.material,
          finishing: elem.properties['Acabamento'] || 'Sem acabamento cadastrado'
        }
      ];
    },

    getElementsByProperty(projectId, propKey, propValue = null) {
      const bim = BIMStore.getBIM(projectId);
      const matches = [];
      bim.building.levels.forEach(lvl => {
        lvl.spaces.forEach(spc => {
          spc.elements.forEach(elem => {
            if (elem.properties && elem.properties[propKey] !== undefined) {
              if (propValue === null || String(elem.properties[propKey]).toLowerCase().includes(String(propValue).toLowerCase())) {
                matches.push({
                  elementId: elem.id,
                  name: elem.name,
                  property: propKey,
                  value: elem.properties[propKey],
                  space: spc.name
                });
              }
            }
          });
        });
      });
      return matches;
    },

    getUnpropertiedElements(projectId) {
      const bim = BIMStore.getBIM(projectId);
      const missing = [];
      bim.building.levels.forEach(lvl => {
        lvl.spaces.forEach(spc => {
          spc.elements.forEach(elem => {
            if (!elem.properties || Object.keys(elem.properties).length === 0) {
              missing.push({ elementId: elem.id, name: elem.name, space: spc.name });
            }
          });
        });
      });
      return missing;
    },

    /**
     * Responde a perguntas em linguagem natural diretamente via query determinística
     */
    executeNaturalQuery(projectId, question) {
      const q = String(question || '').toLowerCase();

      // "quais ambientes existem?"
      if (q.includes('quais ambientes') || q.includes('listar ambientes') || q.includes('quais salas')) {
        const spaces = this.getSpaces(projectId);
        return {
          type: 'DETERMINISTIC_QUERY_RESULT',
          queryType: 'LIST_SPACES',
          count: spaces.length,
          data: spaces,
          summaryText: `Existem ${spaces.length} ambientes cadastrados no modelo: ${spaces.map(s => `${s.name} (${s.areaM2}m²)`).join(', ')}.`
        };
      }

      // "quais elementos pertencem a este ambiente?"
      if (q.includes('elementos') && (q.includes('ambiente') || q.includes('living') || q.includes('cozinha'))) {
        const targetSpace = q.includes('cozinha') ? 'spc-cozinha' : 'spc-living';
        const elements = this.getElementsBySpace(projectId, targetSpace);
        return {
          type: 'DETERMINISTIC_QUERY_RESULT',
          queryType: 'ELEMENTS_BY_SPACE',
          spaceId: targetSpace,
          count: elements.length,
          data: elements,
          summaryText: `O ambiente possui ${elements.length} elementos construtivos identificados: ${elements.map(e => `${e.name} [${e.type}]`).join(', ')}.`
        };
      }

      // "qual material está aplicado?"
      if (q.includes('qual material') || q.includes('quais materiais')) {
        const spaces = this.getSpaces(projectId);
        let allMaterials = [];
        spaces.forEach(s => {
          const elems = this.getElementsBySpace(projectId, s.id);
          elems.forEach(e => allMaterials.push(`${e.name}: ${e.material}`));
        });
        return {
          type: 'DETERMINISTIC_QUERY_RESULT',
          queryType: 'LIST_MATERIALS',
          count: allMaterials.length,
          data: allMaterials,
          summaryText: `Materiais identificados no modelo estruturado:\n• ${allMaterials.join('\n• ')}`
        };
      }

      // "quais objetos não possuem propriedade?"
      if (q.includes('não possuem propriedade') || q.includes('sem propriedade')) {
        const missing = this.getUnpropertiedElements(projectId);
        return {
          type: 'DETERMINISTIC_QUERY_RESULT',
          queryType: 'UNPROPERTIED_ELEMENTS',
          count: missing.length,
          data: missing,
          summaryText: missing.length === 0 ?
            'Todos os elementos construtivos do modelo possuem conjuntos de propriedades cadastradas.' :
            `Identificados ${missing.length} elementos sem propriedades: ${missing.map(m => m.name).join(', ')}.`
        };
      }

      return null;
    }
  };

  /**
   * 3. CONTROLADOR DE UX E VISUALIZAÇÃO DO VIEWER
   */
  const BIMViewerModule = {
    activeProjectId: 'prj-01',
    selectedElementId: null,
    isolatedElementId: null,
    hiddenElementIds: new Set(),
    activeClippingPlane: null, // 'X', 'Y', 'Z' ou null
    isMeasuring: false,
    measurePoints: [],
    zoomLevel: 1.0,

    init(containerId = 'bim-viewer-container', projectId = 'prj-01') {
      this.activeProjectId = projectId;
      this.renderViewer(containerId);
    },

    selectElement(elementId) {
      this.selectedElementId = elementId;
      this.renderPropertyPanel();
      this.updateViewportState();
      if (global.ContextualAIModule && global.ContextualAIModule.onSelectionChange) {
        global.ContextualAIModule.onSelectionChange('BIM', elementId, { name: elementId });
      }
    },

    isolateElement(elementId) {
      this.isolatedElementId = this.isolatedElementId === elementId ? null : elementId;
      this.updateViewportState();
    },

    hideElement(elementId) {
      if (this.hiddenElementIds.has(elementId)) {
        this.hiddenElementIds.delete(elementId);
      } else {
        this.hiddenElementIds.add(elementId);
      }
      this.updateViewportState();
    },

    resetVisibility() {
      this.isolatedElementId = null;
      this.hiddenElementIds.clear();
      this.updateViewportState();
    },

    setClippingPlane(axis) {
      this.activeClippingPlane = this.activeClippingPlane === axis ? null : axis;
      if (typeof document !== 'undefined') {
        const indicator = document.getElementById('bim-clipping-indicator');
        if (indicator) {
          indicator.innerText = this.activeClippingPlane ? `Corte ${this.activeClippingPlane} Ativo` : 'Sem Cortes';
        }
      }
      this.updateViewportState();
    },

    toggleMeasureTool() {
      this.isMeasuring = !this.isMeasuring;
      this.measurePoints = [];
      if (typeof document !== 'undefined') {
        const btn = document.getElementById('bim-measure-btn');
        if (btn) {
          btn.classList.toggle('active', this.isMeasuring);
        }
        const indicator = document.getElementById('bim-measure-display');
        if (indicator) {
          indicator.innerText = this.isMeasuring ? 'Clique em 2 pontos no modelo' : '';
        }
      }
    },

    simulateMeasure(distM = 3.45) {
      if (typeof document !== 'undefined') {
        const indicator = document.getElementById('bim-measure-display');
        if (indicator) {
          indicator.innerText = `Distância: ${distM.toFixed(2)} m`;
        }
      }
    },

    zoomIn() {
      this.zoomLevel = Math.min(this.zoomLevel + 0.2, 3.0);
      this.updateViewportState();
    },

    zoomOut() {
      this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.4);
      this.updateViewportState();
    },

    resetCamera() {
      this.zoomLevel = 1.0;
      this.updateViewportState();
    },

    updateViewportState() {
      if (typeof document === 'undefined') return;
      const stage = document.getElementById('bim-canvas-stage');
      if (stage) {
        stage.style.transform = `scale(${this.zoomLevel})`;
      }
      const elements = document.querySelectorAll('.bim-3d-node');
      elements.forEach(el => {
        const id = el.dataset.elementId;
        if (this.isolatedElementId && id !== this.isolatedElementId) {
          el.style.opacity = '0.15';
        } else if (this.hiddenElementIds.has(id)) {
          el.style.display = 'none';
        } else {
          el.style.opacity = '1';
          el.style.display = 'block';
        }

        if (id === this.selectedElementId) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
      });
    },

    renderPropertyPanel() {
      if (typeof document === 'undefined') return;
      const panel = document.getElementById('bim-property-content');
      if (!panel) return;

      if (!this.selectedElementId) {
        panel.innerHTML = `<div class="p-4 text-center text-muted" style="font-size: 0.8rem;">Selecione um elemento para inspecionar parâmetros IFC.</div>`;
        return;
      }

      const elem = BIMQueryEngine.getElementById(this.activeProjectId, this.selectedElementId);
      if (!elem) {
        panel.innerHTML = `<div class="p-4 text-center text-muted">Elemento não encontrado.</div>`;
        return;
      }

      panel.innerHTML = `
        <div class="bim-prop-group">
          <div class="bim-prop-title">${escapeHTML(elem.name)}</div>
          <div class="bim-prop-badge">${escapeHTML(elem.type)}</div>
        </div>
        <table class="bim-prop-table">
          <tr><td>Ambiente</td><td><strong>${escapeHTML(elem.spaceName)}</strong></td></tr>
          <tr><td>Pavimento</td><td>${escapeHTML(elem.levelName)}</td></tr>
          <tr><td>Material Principal</td><td>${escapeHTML(elem.material)}</td></tr>
          <tr><td>Área Superficial</td><td>${elem.areaM2 ? elem.areaM2.toFixed(2) + ' m²' : '—'}</td></tr>
          ${elem.thicknessM ? `<tr><td>Espessura</td><td>${(elem.thicknessM * 100).toFixed(0)} cm</td></tr>` : ''}
        </table>
        <div class="bim-prop-heading">Conjunto de Propriedades IFC</div>
        <table class="bim-prop-table">
          ${Object.entries(elem.properties || {}).map(([k, v]) => `
            <tr><td>${escapeHTML(k)}</td><td><code>${escapeHTML(String(v))}</code></td></tr>
          `).join('')}
        </table>
        <div class="bim-prop-actions">
          <button class="btn btn-outline btn-xs" onclick="BIMViewerModule.isolateElement('${elem.id}')">
            ${this.isolatedElementId === elem.id ? 'Restaurar Vista' : 'Isolar Elemento'}
          </button>
          <button class="btn btn-outline btn-xs" onclick="BIMViewerModule.hideElement('${elem.id}')">
            Ocultar
          </button>
        </div>
      `;
    },

    renderViewer(containerId) {
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return;

      const elements = BIMQueryEngine.getElementsBySpace(this.activeProjectId, 'spc-living');

      container.innerHTML = `
        <div class="bim-viewer-wrapper">
          <!-- BARRA DE FERRAMENTAS DO VIEWER (DESIGN SYSTEM COMPLIANT) -->
          <header class="bim-viewer-toolbar">
            <div class="bim-tb-left">
              <span class="bim-pill-status"><i data-lucide="box"></i> BIM 3D VIEWER • REVIT LINK</span>
              <button class="btn-icon btn-ghost" title="Aproximar (Zoom In)" onclick="BIMViewerModule.zoomIn()"><i data-lucide="zoom-in"></i></button>
              <button class="btn-icon btn-ghost" title="Afastar (Zoom Out)" onclick="BIMViewerModule.zoomOut()"><i data-lucide="zoom-out"></i></button>
              <button class="btn-icon btn-ghost" title="Resetar Câmera" onclick="BIMViewerModule.resetCamera()"><i data-lucide="refresh-cw"></i></button>
              <div class="bim-divider"></div>
              <button class="btn-icon btn-ghost" id="bim-measure-btn" title="Régua de Medição em Metros" onclick="BIMViewerModule.toggleMeasureTool()"><i data-lucide="ruler"></i></button>
              <span class="bim-measure-label" id="bim-measure-display"></span>
            </div>

            <div class="bim-tb-right">
              <div class="btn-group-pill">
                <button class="btn-pill-opt ${this.activeClippingPlane === 'X' ? 'active' : ''}" onclick="BIMViewerModule.setClippingPlane('X')">Corte X</button>
                <button class="btn-pill-opt ${this.activeClippingPlane === 'Y' ? 'active' : ''}" onclick="BIMViewerModule.setClippingPlane('Y')">Corte Y</button>
                <button class="btn-pill-opt ${this.activeClippingPlane === 'Z' ? 'active' : ''}" onclick="BIMViewerModule.setClippingPlane('Z')">Corte Z</button>
              </div>
              <button class="btn btn-outline btn-xs" onclick="BIMViewerModule.resetVisibility()">Resetar Visibilidade</button>
            </div>
          </header>

          <!-- VIEWPORT 3D E CANVAS INTERATIVO -->
          <div class="bim-viewport-stage">
            <div class="bim-canvas-container" id="bim-canvas-stage">
              <div class="bim-grid-plane"></div>
              ${elements.map((el, idx) => `
                <div class="bim-3d-node node-type-${el.type.toLowerCase()}"
                     id="node-${el.id}"
                     data-element-id="${el.id}"
                     onclick="BIMViewerModule.selectElement('${el.id}')"
                     style="top: ${80 + idx * 85}px; left: ${100 + idx * 60}px;">
                  <div class="node-badge">${escapeHTML(el.name)}</div>
                  <div class="node-meta">${escapeHTML(el.material)}</div>
                </div>
              `).join('')}
            </div>

            <!-- PAINEL FLUTUANTE DE PROPRIEDADES IFC (RIGHT DRAWER) -->
            <aside class="bim-property-inspector" id="bim-property-inspector">
              <div class="bim-inspector-header">
                <span><i data-lucide="info"></i> Propriedades IFC</span>
              </div>
              <div id="bim-property-content">
                <div class="p-4 text-center text-muted" style="font-size: 0.8rem;">Selecione um elemento para inspecionar parâmetros IFC.</div>
              </div>
            </aside>
          </div>
        </div>
      `;

      if (global.lucide) global.lucide.createIcons();
    },

    dispose() {
      this.selectedElementId = null;
      this.isolatedElementId = null;
      this.hiddenElementIds.clear();
      this.measurePoints = [];
    }
  };

  // Exportação no escopo global
  global.BIMStore = BIMStore;
  global.BIMQueryEngine = BIMQueryEngine;
  global.BIMViewerModule = BIMViewerModule;

})(typeof window !== 'undefined' ? window : global);
