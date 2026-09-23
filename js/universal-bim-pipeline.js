/*
 * ArqVértice Studio — J36 Universal BIM Pipeline & IFC Engine
 * Integração BIM de alto nível compatível com @thatopen/components,
 * vinculação semântica (visualId <-> assetId <-> ifcId <-> revitId) e planos de corte.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.UniversalBIMPipeline = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 1. Categorias Canônicas IFC (ISO 16739)
    const IFC_CATEGORIES = Object.freeze({
        IfcProject: { name: 'Projeto', discipline: 'Architecture', isSpatial: true },
        IfcSite: { name: 'Terreno / Implantação', discipline: 'Architecture', isSpatial: true },
        IfcBuilding: { name: 'Edificação', discipline: 'Architecture', isSpatial: true },
        IfcBuildingStorey: { name: 'Pavimento / Nível', discipline: 'Architecture', isSpatial: true },
        IfcSpace: { name: 'Ambiente / Espaço', discipline: 'Architecture', isSpatial: true },
        IfcWall: { name: 'Parede', discipline: 'Architecture', isSpatial: false },
        IfcWallStandardCase: { name: 'Parede Padrão', discipline: 'Architecture', isSpatial: false },
        IfcSlab: { name: 'Laje / Piso', discipline: 'Structure', isSpatial: false },
        IfcDoor: { name: 'Porta', discipline: 'Architecture', isSpatial: false },
        IfcWindow: { name: 'Janela / Esquadria', discipline: 'Architecture', isSpatial: false },
        IfcBeam: { name: 'Viga', discipline: 'Structure', isSpatial: false },
        IfcColumn: { name: 'Pilar', discipline: 'Structure', isSpatial: false },
        IfcRoof: { name: 'Cobertura / Telhado', discipline: 'Architecture', isSpatial: false },
        IfcStair: { name: 'Escada', discipline: 'Architecture', isSpatial: false },
        IfcCovering: { name: 'Revestimento / Forro', discipline: 'Finishes', isSpatial: false },
        IfcFurnishingElement: { name: 'Mobiliário', discipline: 'Interiors', isSpatial: false },
        IfcFlowTerminal: { name: 'Ponto Hidráulico / Elétrico', discipline: 'MEP', isSpatial: false }
    });

    // 2. Modelo de Vínculo Relacional Unificado (J36)
    class BIMEntityRelationship {
        constructor(data = {}) {
            this.visualId = data.visualId || `vis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            this.assetId = data.assetId || data.visualId;
            this.ifcId = data.ifcId || null;
            this.ifcGuid = data.ifcGuid || null;
            this.revitId = data.revitId || null;
            this.revitUniqueId = data.revitUniqueId || null;
            this.projectId = data.projectId || 'prj-default';
            this.roomId = data.roomId || null;
            this.levelId = data.levelId || 'lvl-01';
            this.category = data.category || 'IfcWall';
            this.name = data.name || 'Elemento BIM';
            this.materialId = data.materialId || null;
            this.source = data.source || 'Manual'; // 'Revit' | 'IFC' | 'GLB' | 'Generated' | 'Manual' | 'AI'
            this.dimensions = {
                lengthM: Number(data.dimensions?.lengthM) || 0,
                widthM: Number(data.dimensions?.widthM) || 0,
                heightM: Number(data.dimensions?.heightM) || 0,
                thicknessM: Number(data.dimensions?.thicknessM) || 0,
                areaM2: Number(data.dimensions?.areaM2) || 0,
                volumeM3: Number(data.dimensions?.volumeM3) || 0
            };
            this.propertySets = data.propertySets || {};
            this.visibility = data.visibility !== false;
            this.selected = false;
        }

        toJSON() {
            return {
                visualId: this.visualId,
                assetId: this.assetId,
                ifcId: this.ifcId,
                ifcGuid: this.ifcGuid,
                revitId: this.revitId,
                revitUniqueId: this.revitUniqueId,
                projectId: this.projectId,
                roomId: this.roomId,
                levelId: this.levelId,
                category: this.category,
                name: this.name,
                materialId: this.materialId,
                source: this.source,
                dimensions: { ...this.dimensions },
                propertySets: { ...this.propertySets },
                visibility: this.visibility
            };
        }
    }

    // 3. Motor de Parse e Classificação IFC
    class IFCParserEngine {
        constructor() {
            this.loadedModels = new Map();
        }

        async parseIFC(bufferOrString, options = {}) {
            const modelId = options.modelId || `ifc_${Date.now()}`;
            const isText = typeof bufferOrString === 'string';
            const rawContent = isText ? bufferOrString : 'ISO-10303-21; HEADER; FILE_DESCRIPTION;';

            // Extração de metadados do cabeçalho STEP/IFC
            const schemaMatch = rawContent.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
            const schema = schemaMatch ? schemaMatch[1] : 'IFC4';

            const entities = [];
            const spatialTree = {
                id: `site_${modelId}`,
                name: options.siteName || 'Terreno do Empreendimento',
                type: 'IfcSite',
                buildings: [
                    {
                        id: `bld_${modelId}`,
                        name: options.buildingName || 'Residência ArqVértice',
                        type: 'IfcBuilding',
                        storeys: []
                    }
                ]
            };

            // Simulação de parse determinístico e estruturado
            const defaultLevels = [
                { id: 'lvl-01', name: 'Pavimento Térreo', elevation: 0.00 },
                { id: 'lvl-02', name: 'Pavimento Superior', elevation: 3.40 }
            ];

            defaultLevels.forEach(lvl => {
                spatialTree.buildings[0].storeys.push({
                    id: lvl.id,
                    name: lvl.name,
                    elevation: lvl.elevation,
                    type: 'IfcBuildingStorey',
                    elements: []
                });
            });

            return {
                modelId,
                schema,
                spatialTree,
                entityCount: entities.length,
                parsedAt: new Date().toISOString()
            };
        }
    }

    // 4. Pipeline Principal UniversalBIMPipeline
    class UniversalBIMPipeline {
        constructor(options = {}) {
            this.projectId = options.projectId || 'prj-praia-01';
            this.parser = new IFCParserEngine();
            this.entities = new Map(); // visualId -> BIMEntityRelationship
            this.levels = new Map();
            this.spaces = new Map();
            this.sectionPlanes = [];
            this.activeCutLevel = null;
            this.subscribers = new Set();
            this._seedInitialProjectData();
        }

        _seedInitialProjectData() {
            // Pavimentos
            this.levels.set('lvl-01', { id: 'lvl-01', name: 'Pavimento Térreo', elevationM: 0.00, heightM: 3.40 });
            this.levels.set('lvl-02', { id: 'lvl-02', name: 'Pavimento Superior', elevationM: 3.40, heightM: 3.20 });

            // Ambientes / Espaços
            this.spaces.set('spc-living', { id: 'spc-living', name: 'Living Integrado', levelId: 'lvl-01', areaM2: 65.0 });
            this.spaces.set('spc-gourmet', { id: 'spc-gourmet', name: 'Deck Gourmet & Lounge', levelId: 'lvl-01', areaM2: 48.0 });
            this.spaces.set('spc-master', { id: 'spc-master', name: 'Suíte Master Panorâmica', levelId: 'lvl-02', areaM2: 42.0 });

            // Elementos BIM Canônicos Vinculados
            const defaultElements = [
                {
                    visualId: 'vis-wall-north',
                    assetId: 'WALL-N-01',
                    ifcId: '21045',
                    ifcGuid: '2Xv_8e4nL7R8v01mQx4kLm',
                    revitId: 'REV-20412',
                    projectId: this.projectId,
                    roomId: 'spc-living',
                    levelId: 'lvl-01',
                    category: 'IfcWallStandardCase',
                    name: 'Parede Norte Living',
                    materialId: 'mat-plaster-white',
                    source: 'Revit',
                    dimensions: { lengthM: 8.5, heightM: 3.4, thicknessM: 0.20, areaM2: 28.9, volumeM3: 5.78 },
                    propertySets: {
                        Pset_WallCommon: { IsExternal: true, LoadBearing: true, FireRating: 'CF 120min' },
                        ArqVertice_Acabamento: { Tipo: 'Reboco + Pintura Acrílica Suvinil', CodigoCor: 'SW 7005' }
                    }
                },
                {
                    visualId: 'vis-glass-facade',
                    assetId: 'WIN-FAC-01',
                    ifcId: '21088',
                    ifcGuid: '3Av_1e4nL7R8v01mQx9kLn',
                    revitId: 'REV-50101',
                    projectId: this.projectId,
                    roomId: 'spc-living',
                    levelId: 'lvl-01',
                    category: 'IfcWindow',
                    name: 'Esquadria Fachada Piso-Teto',
                    materialId: 'mat-glass-crystal',
                    source: 'Revit',
                    dimensions: { widthM: 10.0, heightM: 3.4, areaM2: 34.0, volumeM3: 0.68 },
                    propertySets: {
                        Pset_WindowCommon: { AcousticRating: '38 dB', ThermalTransmittance: '2.1 W/m²K' },
                        ArqVertice_Esquadrias: { Fabricante: 'Schüco Alumínio', Acabamento: 'Preto Anodizado' }
                    }
                },
                {
                    visualId: 'vis-sofa-living',
                    assetId: 'SOFA-001',
                    ifcId: '34901',
                    ifcGuid: '1Xv_9e4nL7R8v01mQx2kLp',
                    revitId: 'REV-70102',
                    projectId: this.projectId,
                    roomId: 'spc-living',
                    levelId: 'lvl-01',
                    category: 'IfcFurnishingElement',
                    name: 'Sofá Modular 4 Lugares',
                    materialId: 'mat-fabric-linen',
                    source: 'GLB',
                    dimensions: { lengthM: 3.6, widthM: 1.8, heightM: 0.8, areaM2: 6.48, volumeM3: 5.18 },
                    propertySets: {
                        ArqVertice_Mobiliario: { Fornecedor: 'Jader Almeida', Tecido: 'Linho Italiano Cinza', Status: 'Especificado' }
                    }
                },
                {
                    visualId: 'vis-deck-cumaru',
                    assetId: 'DECK-001',
                    ifcId: '45012',
                    ifcGuid: '5Kv_2e4nL7R8v01mQx5kLq',
                    revitId: 'REV-30101',
                    projectId: this.projectId,
                    roomId: 'spc-gourmet',
                    levelId: 'lvl-01',
                    category: 'IfcSlab',
                    name: 'Deck Madeira Cumaru',
                    materialId: 'mat-wood-cumaru',
                    source: 'IFC',
                    dimensions: { lengthM: 10.0, widthM: 4.8, thicknessM: 0.05, areaM2: 48.0, volumeM3: 2.4 },
                    propertySets: {
                        Pset_SlabCommon: { IsExternal: true, LoadBearing: false },
                        ArqVertice_Pisos: { Tratamento: 'Verniz Náutico UV', ResistenciaAgua: 'Alta' }
                    }
                }
            ];

            defaultElements.forEach(item => {
                const entity = new BIMEntityRelationship(item);
                this.entities.set(entity.visualId, entity);
            });
        }

        // Consultas e Filtros
        getEntity(visualId) {
            return this.entities.get(visualId) || null;
        }

        listEntities(filter = {}) {
            let list = Array.from(this.entities.values());
            if (filter.levelId) list = list.filter(e => e.levelId === filter.levelId);
            if (filter.roomId) list = list.filter(e => e.roomId === filter.roomId);
            if (filter.category) list = list.filter(e => e.category === filter.category);
            if (filter.source) list = list.filter(e => e.source === filter.source);
            return list.map(e => e.toJSON());
        }

        // Vinculação de Entidades (Linking)
        bindEntity(data) {
            const entity = new BIMEntityRelationship(data);
            this.entities.set(entity.visualId, entity);
            this._notifyChange({ type: 'entity_bound', entity: entity.toJSON() });
            return entity.toJSON();
        }

        // Cortes e Planos de Seção
        addSectionPlane(axis = 'y', position = 1.5, name = 'Planta de Corte') {
            const plane = {
                id: `sec_${Date.now()}`,
                name,
                axis, // 'x' | 'y' | 'z'
                position,
                enabled: true
            };
            this.sectionPlanes.push(plane);
            this._notifyChange({ type: 'section_plane_added', plane });
            return plane;
        }

        isolateLevel(levelId) {
            this.activeCutLevel = levelId;
            this.entities.forEach(entity => {
                entity.visibility = (levelId === null || entity.levelId === levelId);
            });
            this._notifyChange({ type: 'level_isolated', levelId, visibleCount: this.listEntities({ levelId }).length });
        }

        showAll() {
            this.activeCutLevel = null;
            this.entities.forEach(entity => {
                entity.visibility = true;
            });
            this._notifyChange({ type: 'all_shown' });
        }

        // Inscrição em Eventos
        subscribe(listener) {
            if (typeof listener === 'function') {
                this.subscribers.add(listener);
                return () => this.subscribers.delete(listener);
            }
            return () => {};
        }

        _notifyChange(event) {
            this.subscribers.forEach(fn => {
                try { fn(event); } catch (e) { console.error(e); }
            });
        }
    }

    UniversalBIMPipeline.IFC_CATEGORIES = IFC_CATEGORIES;
    UniversalBIMPipeline.BIMEntityRelationship = BIMEntityRelationship;
    UniversalBIMPipeline.IFCParserEngine = IFCParserEngine;

    return UniversalBIMPipeline;
}));
