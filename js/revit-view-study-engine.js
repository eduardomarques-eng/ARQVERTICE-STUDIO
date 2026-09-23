/**
 * ArqVértice Studio — Bloco J: J35 — Revit Views + Camera + Preliminary Study
 * 
 * Motor de Importação, Conversão e Gestão de Vistas, Câmeras 3D e Estudos Preliminares
 * a partir de modelos Autodesk Revit.
 * 
 * Princípios Fundamentais:
 * 1. Detecção dos 8 tipos de vista do Revit:
 *    FloorPlan, CeilingPlan, Section, Elevation, ThreeD, Drafting, Detail, Schedule.
 * 2. Extração de Metadados Canônicos de Vistas:
 *    viewId, name, type, scale, discipline, detailLevel, phase, template, cropBox, visibility.
 * 3. Conversão de Câmeras Revit 3D para ArqCamera:
 *    position, target, up, fov, near, far, aspect, sectionBox.
 * 4. 9 View Presets Oficiais:
 *    Site, Ground Floor, Upper Floor, Section, Facade, Interior, Exterior, Bird's Eye, Presentation.
 * 5. Importação Semântica de Plantas 2D:
 *    Preservação de paredes, portas, janelas, ambientes, mobiliário, anotações, cotas, níveis e eixos (grids).
 * 6. Importação Seletiva de 3D:
 *    Apenas os elementos visíveis na vista (não extrai o projeto inteiro por padrão).
 * 7. Objeto Canônico PreliminaryStudy:
 *    Ambientes, elementos selecionados, planta, elevações, cena 3D, câmera, materiais e notas.
 * 8. Detecção de Alteração da Fonte (SOURCE_CHANGED) e Sincronização.
 * 9. Pipeline "Importe a planta térrea e crie um estudo preliminar" automatizado.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RevitViewStudyEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * 8 Tipos de Vistas Oficiais do Revit
     */
    const VIEW_TYPES = Object.freeze({
        FLOOR_PLAN: 'FloorPlan',
        CEILING_PLAN: 'CeilingPlan',
        SECTION: 'Section',
        ELEVATION: 'Elevation',
        THREE_D: 'ThreeD',
        DRAFTING: 'Drafting',
        DETAIL: 'Detail',
        SCHEDULE: 'Schedule'
    });

    /**
     * 9 View Presets Canônicos do ArqVértice Studio
     */
    const VIEW_PRESETS = Object.freeze({
        SITE: 'Site',
        GROUND_FLOOR: 'Ground Floor',
        UPPER_FLOOR: 'Upper Floor',
        SECTION: 'Section',
        FACADE: 'Facade',
        INTERIOR: 'Interior',
        EXTERIOR: 'Exterior',
        BIRDS_EYE: "Bird's Eye",
        PRESENTATION: 'Presentation'
    });

    /**
     * Classe Canônica ArqCamera
     */
    class ArqCamera {
        constructor({
            position = { x: 0, y: -10, z: 5 },
            target = { x: 0, y: 0, z: 1.5 },
            up = { x: 0, y: 0, z: 1 },
            fov = 50,
            near = 0.1,
            far = 1000,
            aspect = 1.777,
            name = 'Perspectiva Padrão',
            sourceViewId = null,
            sectionBox = null
        } = {}) {
            this.position = position;
            this.target = target;
            this.up = up;
            this.fov = fov;
            this.near = near;
            this.far = far;
            this.aspect = aspect;
            this.name = name;
            this.sourceViewId = sourceViewId;
            this.sectionBox = sectionBox;
            this.createdAt = new Date().toISOString();
        }

        getDistanceToTarget() {
            const dx = this.position.x - this.target.x;
            const dy = this.position.y - this.target.y;
            const dz = this.position.z - this.target.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
    }

    class RevitViewStudyEngine {
        constructor(connector, options = {}) {
            this.version = '1.0.0-bloco-j35';
            this.connector = connector;
            this.debug = !!options.debug;

            // Catálogo canônico de vistas simuladas e reais
            this.viewsCatalog = this._initSampleViewsCatalog();

            // Presets de vistas salvos pelo usuário
            this.savedPresets = new Map();

            // Estudos preliminares criados
            this.preliminaryStudies = new Map();

            // Histórico de hashes de vistas para detecção de SOURCE_CHANGED
            this.viewHashes = new Map();
            this._seedInitialHashes();
        }

        _seedInitialHashes() {
            for (const v of this.viewsCatalog) {
                this.viewHashes.set(v.viewId, v.contentHash || `hash_${v.viewId}_v1`);
            }
        }

        /**
         * 1. DETECÇÃO E LISTAGEM DE VISTAS DO REVIT
         */
        async listViews(filter = {}) {
            let views = this.viewsCatalog.map(v => ({ ...v }));

            if (filter.type) {
                views = views.filter(v => v.type.toLowerCase() === filter.type.toLowerCase());
            }
            if (filter.discipline) {
                views = views.filter(v => v.discipline.toLowerCase() === filter.discipline.toLowerCase());
            }
            if (filter.phase) {
                views = views.filter(v => v.phase.toLowerCase() === filter.phase.toLowerCase());
            }

            return views;
        }

        getView(viewIdOrName) {
            return this.viewsCatalog.find(v => v.viewId === viewIdOrName || v.name === viewIdOrName) || null;
        }

        /**
         * 2. CONVERSÃO DE CÂMERA REVIT 3D PARA ARQCAMERA
         */
        extractCamera(viewIdOrName) {
            const view = this.getView(viewIdOrName);
            if (!view) {
                throw new Error(`Vista "${viewIdOrName}" não encontrada.`);
            }

            if (view.type !== VIEW_TYPES.THREE_D) {
                throw new Error(`A vista "${view.name}" não é do tipo ThreeD. Tipo atual: "${view.type}".`);
            }

            const camData = view.camera || {};
            const pos = camData.position || { x: 12.5, y: -15.0, z: 8.5 };
            const tgt = camData.target || { x: 0.0, y: 0.0, z: 1.5 };
            const upVec = camData.orientation || camData.up || { x: 0.0, y: 0.0, z: 1.0 };
            const fov = camData.fieldOfView || camData.fov || 53.13; // lente padrão ~35mm

            return new ArqCamera({
                position: pos,
                target: tgt,
                up: upVec,
                fov,
                near: camData.near || 0.1,
                far: camData.far || 500.0,
                aspect: camData.crop ? (camData.crop.width / camData.crop.height) : 1.777,
                name: view.name,
                sourceViewId: view.viewId,
                sectionBox: camData.sectionBox || null
            });
        }

        /**
         * 3. MAPEAMENTO DOS 9 VIEW PRESETS OFICIAIS
         */
        getPresetViews() {
            const presets = [];

            const mapping = [
                { preset: VIEW_PRESETS.SITE, matchTerms: ['implantação', 'site', 'situação', 'terreno'] },
                { preset: VIEW_PRESETS.GROUND_FLOOR, matchTerms: ['térreo', 'ground', 'nível 01', 'planta baixa'] },
                { preset: VIEW_PRESETS.UPPER_FLOOR, matchTerms: ['superior', 'upper', 'nível 02', 'pavimento superior'] },
                { preset: VIEW_PRESETS.SECTION, matchTerms: ['corte', 'section', 'longitudinal', 'transversal'] },
                { preset: VIEW_PRESETS.FACADE, matchTerms: ['fachada', 'elevação', 'elevation', 'frontal'] },
                { preset: VIEW_PRESETS.INTERIOR, matchTerms: ['interior', 'estar', 'suíte', 'cozinha'] },
                { preset: VIEW_PRESETS.EXTERIOR, matchTerms: ['exterior', 'fachada 3d', 'perspectiva externa'] },
                { preset: VIEW_PRESETS.BIRDS_EYE, matchTerms: ['aérea', "bird's eye", 'isométrica', 'axonométrica', 'topo'] },
                { preset: VIEW_PRESETS.PRESENTATION, matchTerms: ['apresentação', 'humanizada', 'render', 'cliente'] }
            ];

            for (const item of mapping) {
                const matchedView = this.viewsCatalog.find(v => {
                    const name = (v.name || '').toLowerCase();
                    return item.matchTerms.some(term => name.includes(term));
                });

                if (matchedView) {
                    presets.push({
                        presetName: item.preset,
                        viewId: matchedView.viewId,
                        viewName: matchedView.name,
                        viewType: matchedView.type,
                        scale: matchedView.scale,
                        isAvailable: true
                    });
                }
            }

            return presets;
        }

        /**
         * 4. IMPORTAÇÃO DE PLANTA 2D COM PRESERVAÇÃO SEMÂNTICA
         * Revit ViewPlan ➔ visible elements ➔ 2D geometry ➔ semantic objects ➔ ArqVertice Plan
         */
        async importPlanView(viewIdOrName, options = {}) {
            const view = this.getView(viewIdOrName);
            if (!view) {
                throw new Error(`Planta "${viewIdOrName}" não encontrada.`);
            }

            // Elementos visíveis preservados na planta
            const elements = view.visibleElements || [];

            // Filtragem e categorização dos objetos semânticos
            const walls = elements.filter(e => e.category === 'Walls');
            const doors = elements.filter(e => e.category === 'Doors');
            const windows = elements.filter(e => e.category === 'Windows');
            const rooms = elements.filter(e => e.category === 'Rooms');
            const furniture = elements.filter(e => e.category === 'Furniture');
            const annotations = elements.filter(e => e.category === 'Annotations' || e.isAnnotation);
            const dimensions = elements.filter(e => e.category === 'Dimensions');
            const grids = elements.filter(e => e.category === 'Grids');
            const levels = elements.filter(e => e.category === 'Levels');

            const plan = {
                planId: `plan_${view.viewId}_${Date.now()}`,
                sourceViewId: view.viewId,
                name: view.name,
                level: view.level || 'Nível 01',
                scale: view.scale || '1:50',
                scaleNominal: view.scaleNominal || '1:50',
                detailLevel: view.detailLevel || 'Fine',
                cropBox: view.cropBox,
                boundingBox2D: {
                    min: { x: -2.0, y: -2.0 },
                    max: { x: 18.0, y: 14.0 },
                    widthM: 20.0,
                    heightM: 16.0
                },
                semanticObjects: {
                    wallsCount: walls.length,
                    doorsCount: doors.length,
                    windowsCount: windows.length,
                    roomsCount: rooms.length,
                    furnitureCount: furniture.length,
                    annotationsCount: annotations.length,
                    dimensionsCount: dimensions.length,
                    gridsCount: grids.length,
                    levelsCount: levels.length
                },
                elements: {
                    walls,
                    doors,
                    windows,
                    rooms,
                    furniture,
                    annotations,
                    dimensions,
                    grids,
                    levels
                },
                importedAt: new Date().toISOString()
            };

            return plan;
        }

        /**
         * 5. IMPORTAÇÃO SELETIVA DE VISTA 3D
         * Importa apenas os elementos visíveis naquela vista específica.
         */
        async import3DView(viewIdOrName, options = {}) {
            const view = this.getView(viewIdOrName);
            if (!view) {
                throw new Error(`Vista 3D "${viewIdOrName}" não encontrada.`);
            }

            const camera = this.extractCamera(view.viewId);
            const visibleElements = view.visibleElements || [];

            return {
                viewId: view.viewId,
                name: view.name,
                camera,
                visibleCount: visibleElements.length,
                elements: visibleElements,
                sectionBox: camera.sectionBox,
                importedAt: new Date().toISOString()
            };
        }

        /**
         * 6. GERAÇÃO DE ESTUDO PRELIMINAR (PRELIMINARY STUDY)
         * Usuário: "Importe a planta térrea e crie um estudo preliminar."
         */
        async createPreliminaryStudy(planViewNameOrId = 'Planta Baixa - Nível 01', options = {}) {
            const plan = await this.importPlanView(planViewNameOrId);
            
            // Buscar elevações associadas
            const elevations = this.viewsCatalog.filter(v => v.type === VIEW_TYPES.ELEVATION);
            
            // Buscar vista 3D ou câmera padrão
            const threeDView = this.viewsCatalog.find(v => v.type === VIEW_TYPES.THREE_D) || this.viewsCatalog[2];
            const camera = this.extractCamera(threeDView.viewId);

            // Ambientes selecionados
            const rooms = plan.elements.rooms.map(r => ({
                id: r.id,
                name: r.name,
                areaM2: r.areaM2 || 20.0
            }));

            // Materiais levantados a partir dos elementos visíveis
            const materialsSet = new Set();
            for (const w of plan.elements.walls) {
                if (w.material) materialsSet.add(w.material);
            }

            const studyId = `study_${Date.now()}`;
            const preliminaryStudy = {
                studyId,
                title: options.title || `Estudo Preliminar — ${plan.name}`,
                sourceViewId: plan.sourceViewId,
                level: plan.level,
                status: 'DRAFT',
                selectedRooms: rooms,
                selectedElementsCount: plan.elements.walls.length + plan.elements.doors.length + plan.elements.windows.length,
                plan,
                elevations: elevations.map(e => ({ viewId: e.viewId, name: e.name, scale: e.scale })),
                threeDScene: {
                    viewId: threeDView.viewId,
                    name: threeDView.name,
                    elementsCount: threeDView.visibleElements?.length || 10
                },
                camera,
                materials: Array.from(materialsSet),
                notes: options.notes || 'Estudo preliminar gerado deterministicamente a partir da planta do Revit.',
                createdAt: new Date().toISOString()
            };

            this.preliminaryStudies.set(studyId, preliminaryStudy);
            return preliminaryStudy;
        }

        getPreliminaryStudy(studyId) {
            return this.preliminaryStudies.get(studyId) || null;
        }

        /**
         * 7. VIEW PRESETS PERSISTENCE
         */
        saveViewPreset(presetName, presetData) {
            const record = {
                presetName,
                sourceRevitView: presetData.sourceRevitView || presetData.viewName,
                camera: presetData.camera || null,
                visibility: presetData.visibility || { hiddenCategories: [], isolateCategory: null },
                clipping: presetData.clipping || { near: 0.1, far: 500 },
                background: presetData.background || 'Sky/Horizon',
                displayMode: presetData.displayMode || 'ShadedWithEdges',
                savedAt: new Date().toISOString()
            };
            this.savedPresets.set(presetName, record);
            return record;
        }

        getViewPreset(presetName) {
            return this.savedPresets.get(presetName) || null;
        }

        /**
         * 8. DETECÇÃO DE ALTERAÇÃO DA FONTE (SOURCE_CHANGED)
         */
        checkViewChanged(viewId, previousHash) {
            const currentHash = this.viewHashes.get(viewId) || null;
            if (!currentHash || !previousHash) {
                return { changed: false, status: 'UNKNOWN' };
            }

            const changed = currentHash !== previousHash;
            return {
                changed,
                status: changed ? 'SOURCE_CHANGED' : 'IN_SYNC',
                viewId,
                previousHash,
                currentHash,
                message: changed 
                    ? 'A vista original sofreu alterações no Autodesk Revit. Atualização recomendada.'
                    : 'A vista no ArqVértice Studio está em perfeita sincronia com o Revit.'
            };
        }

        simulateViewChangeInRevit(viewId, newHash) {
            this.viewHashes.set(viewId, newHash || `hash_${viewId}_v${Date.now()}`);
        }

        /**
         * CATÁLOGO INICIAL DE VISTAS SIMULADAS COM METADADOS PROFUNDOS
         */
        _initSampleViewsCatalog() {
            return [
                {
                    viewId: 'view_fp_001',
                    name: 'Planta Baixa - Nível 01',
                    type: VIEW_TYPES.FLOOR_PLAN,
                    level: 'Nível 01',
                    scale: '1:50',
                    scaleNominal: '1:50',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_Planta_Executiva',
                    cropBox: { enabled: true, widthM: 20.0, heightM: 16.0 },
                    visibility: { walls: true, doors: true, windows: true, rooms: true },
                    contentHash: 'hash_fp_001_initial',
                    visibleElements: [
                        { id: 20412, category: 'Walls', family: 'Parede Básica', type: 'Alvenaria 15cm', material: 'Alvenaria Bloco Cerâmico' },
                        { id: 20413, category: 'Walls', family: 'Parede Básica', type: 'Alvenaria 15cm', material: 'Alvenaria Bloco Cerâmico' },
                        { id: 20414, category: 'Walls', family: 'Parede Básica', type: 'Concreto 20cm', material: 'Concreto Fck 30MPa' },
                        { id: 40101, category: 'Doors', family: 'Porta Pivotante Externa', type: 'Freijó 1.20x2.60m' },
                        { id: 50101, category: 'Windows', family: 'Janela de Correr 4 Folhas', type: 'Alumínio Preto 2.40x1.40m' },
                        { id: 70101, category: 'Rooms', name: 'Sala de Estar', areaM2: 45.0 },
                        { id: 70102, category: 'Rooms', name: 'Cozinha Gourmet', areaM2: 22.5 },
                        { id: 80101, category: 'Furniture', family: 'Sofá Modular', type: '3 Lugares Linho Cru' },
                        { id: 90101, category: 'Grids', name: 'Eixo 1' },
                        { id: 90102, category: 'Grids', name: 'Eixo 2' },
                        { id: 90201, category: 'Levels', name: 'Nível 01' },
                        { id: 90301, category: 'Dimensions', text: '6.20 m' },
                        { id: 90401, category: 'Annotations', text: 'Piso Porcelanato 120x120cm' }
                    ]
                },
                {
                    viewId: 'view_fp_002',
                    name: 'Planta Baixa - Nível 02',
                    type: VIEW_TYPES.FLOOR_PLAN,
                    level: 'Nível 02',
                    scale: '1:50',
                    scaleNominal: '1:50',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_Planta_Executiva',
                    cropBox: { enabled: true, widthM: 18.0, heightM: 14.0 },
                    visibility: { walls: true, doors: true, windows: true, rooms: true },
                    contentHash: 'hash_fp_002_initial',
                    visibleElements: [
                        { id: 20501, category: 'Walls', family: 'Parede Básica', type: 'Alvenaria 15cm', material: 'Alvenaria Bloco Cerâmico' },
                        { id: 20502, category: 'Walls', family: 'Parede Drywall', type: 'Drywall ST 10cm', material: 'Gesso Acartonado' },
                        { id: 70201, category: 'Rooms', name: 'Suíte Master', areaM2: 28.0 }
                    ]
                },
                {
                    viewId: 'view_3d_001',
                    name: '{3D - Coordenação Geral}',
                    type: VIEW_TYPES.THREE_D,
                    scale: '1:100',
                    discipline: 'Coordination',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_3D_Geral',
                    cropBox: { enabled: false },
                    camera: {
                        position: { x: 15.0, y: -20.0, z: 10.0 },
                        target: { x: 2.0, y: 1.0, z: 1.5 },
                        orientation: { x: 0.0, y: 0.0, z: 1.0 },
                        fieldOfView: 53.13,
                        near: 0.1,
                        far: 800.0,
                        crop: { width: 1920, height: 1080 },
                        sectionBox: { min: { x: -10, y: -10, z: -1 }, max: { x: 25, y: 25, z: 15 } }
                    },
                    contentHash: 'hash_3d_001_initial',
                    visibleElements: [
                        { id: 20412, category: 'Walls' },
                        { id: 20413, category: 'Walls' },
                        { id: 20414, category: 'Walls' },
                        { id: 40101, category: 'Doors' },
                        { id: 50101, category: 'Windows' }
                    ]
                },
                {
                    viewId: 'view_sec_001',
                    name: 'Corte AA - Longitudinal',
                    type: VIEW_TYPES.SECTION,
                    scale: '1:50',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_Cortes',
                    cropBox: { enabled: true, widthM: 22.0, heightM: 8.0 },
                    contentHash: 'hash_sec_001_initial',
                    visibleElements: [
                        { id: 20412, category: 'Walls' },
                        { id: 30101, category: 'Floors' }
                    ]
                },
                {
                    viewId: 'view_ele_001',
                    name: 'Elevação Frontal (Fachada Norte)',
                    type: VIEW_TYPES.ELEVATION,
                    scale: '1:50',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_Fachadas',
                    cropBox: { enabled: true, widthM: 20.0, heightM: 8.0 },
                    contentHash: 'hash_ele_001_initial',
                    visibleElements: [
                        { id: 20412, category: 'Walls' },
                        { id: 40101, category: 'Doors' },
                        { id: 50101, category: 'Windows' }
                    ]
                },
                {
                    viewId: 'view_cp_001',
                    name: 'Planta de Forro - Nível 01',
                    type: VIEW_TYPES.CEILING_PLAN,
                    scale: '1:50',
                    discipline: 'Architecture',
                    detailLevel: 'Medium',
                    phase: 'Nova Construção',
                    template: 'ARQ_Forro',
                    cropBox: { enabled: true },
                    contentHash: 'hash_cp_001_initial',
                    visibleElements: []
                },
                {
                    viewId: 'view_dt_001',
                    name: 'Detalhe Construtivo - Pingadeira',
                    type: VIEW_TYPES.DETAIL,
                    scale: '1:10',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: 'ARQ_Detalhes',
                    cropBox: { enabled: true },
                    contentHash: 'hash_dt_001_initial',
                    visibleElements: []
                },
                {
                    viewId: 'view_df_001',
                    name: 'Esquema de Pressurização',
                    type: VIEW_TYPES.DRAFTING,
                    scale: '1:20',
                    discipline: 'Mechanical',
                    detailLevel: 'Medium',
                    phase: 'Nova Construção',
                    template: null,
                    cropBox: { enabled: false },
                    contentHash: 'hash_df_001_initial',
                    visibleElements: []
                },
                {
                    viewId: 'view_sch_001',
                    name: 'Tabela de Portas e Esquadrias',
                    type: VIEW_TYPES.SCHEDULE,
                    scale: '1:1',
                    discipline: 'Architecture',
                    detailLevel: 'Fine',
                    phase: 'Nova Construção',
                    template: null,
                    cropBox: { enabled: false },
                    contentHash: 'hash_sch_001_initial',
                    visibleElements: []
                }
            ];
        }
    }

    RevitViewStudyEngine.VIEW_TYPES = VIEW_TYPES;
    RevitViewStudyEngine.VIEW_PRESETS = VIEW_PRESETS;
    RevitViewStudyEngine.ArqCamera = ArqCamera;

    return RevitViewStudyEngine;
}));
