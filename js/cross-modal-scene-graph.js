/**
 * js/cross-modal-scene-graph.js
 * Grafo Ontológico Central Cross-Modal do Projeto — ArqVértice Studio (J10)
 * Conecta e unifica todas as modalidades de dados arquitetônicos:
 * Texto, Imagem, Desenho Técnico (CAD), Modelo 3D, BIM (IFC), Vídeo (Remotion) e Documentos
 * 
 * Implementa:
 * 1. Nós Canônicos: Project, Building, Level, Room, Element, Object, Image, Drawing, CADObject, BIMObject, Material, Camera, Document, Video
 * 2. Relações Cruzadas: depicts, contains, representedBy, derivedFrom, correspondsTo, referencedIn
 * 3. Resolução de Identidade (Deduplicação e unificação sem perda de proveniência)
 * 4. Rastreamento de Confiança Multicritério (source confidence, inference confidence, user confirmed)
 * 5. Query API Cross-Modal: Responde "Qual objeto desta imagem corresponde ao modelo 3D e qual elemento BIM o representa?"
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. ENUMS DE NÓS E RELAÇÕES CROSS-MODAIS
  // --------------------------------------------------------------------------
  const NodeType = Object.freeze({
    PROJECT: 'Project',
    BUILDING: 'Building',
    LEVEL: 'Level',
    ROOM: 'Room',
    ELEMENT: 'Element',
    OBJECT: 'Object',
    IMAGE: 'Image',
    DRAWING: 'Drawing',
    CAD_OBJECT: 'CADObject',
    BIM_OBJECT: 'BIMObject',
    MATERIAL: 'Material',
    CAMERA: 'Camera',
    DOCUMENT: 'Document',
    VIDEO: 'Video'
  });

  const RelationType = Object.freeze({
    DEPICTS: 'depicts',                 // Image ➔ Room / Object
    CONTAINS: 'contains',               // Room ➔ Furniture / Wall
    REPRESENTED_BY: 'representedBy',   // Element ➔ 3D Object / BIM
    DERIVED_FROM: 'derivedFrom',       // 3D Object ➔ Image Region
    CORRESPONDS_TO: 'correspondsTo',   // BIM Wall ➔ Visual Wall / CAD
    REFERENCED_IN: 'referencedIn'      // Material ➔ Document / Video
  });

  // --------------------------------------------------------------------------
  // 2. NÓ DE GRAFO UNIFICADO COM IDENTIDADE ESTÁVEL (CrossModalNode)
  // --------------------------------------------------------------------------
  class CrossModalNode {
    constructor({
      stableId,
      type,
      name,
      modality = 'SEMANTIC', // 'BIM' | 'VISION' | 'CAD' | 'DRAWING' | 'AUDIOVISUAL'
      source = 'LOCAL_STATE',
      sourceConfidence = 1.0,
      inferenceConfidence = 1.0,
      userConfirmed = false,
      version = 1,
      properties = {}
    }) {
      this.stableId = stableId || `cmn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.type = type;
      this.name = name;
      this.modality = modality;
      this.source = source;
      this.sourceConfidence = Number(sourceConfidence) || 1.0;
      this.inferenceConfidence = Number(inferenceConfidence) || 1.0;
      this.userConfirmed = Boolean(userConfirmed);
      this.version = Number(version) || 1;
      this.properties = properties;
      this.aliases = new Set(); // IDs secundários de outras fontes resolvidos para esta entidade
    }
  }

  // --------------------------------------------------------------------------
  // 3. GRAFO CENTRAL CROSS-MODAL (CrossModalProjectSceneGraph)
  // --------------------------------------------------------------------------
  class CrossModalProjectSceneGraph {
    constructor(projectId, projectName = 'Projeto ArqVértice') {
      this.graphId = `xgraph_${Date.now()}`;
      this.projectId = projectId;
      this.projectName = projectName;
      this.nodes = new Map(); // stableId ➔ CrossModalNode
      this.edges = [];        // { sourceId, relation, targetId, confidence, metadata }
      this.identityIndex = new Map(); // aliasId ➔ stableId (resolução rápida de identidade)

      // Inicializa Nó Raiz do Projeto
      this.root = this.addNode(new CrossModalNode({
        stableId: `proj_${projectId}`,
        type: NodeType.PROJECT,
        name: projectName,
        modality: 'BIM',
        sourceConfidence: 1.0
      }));
    }

    /**
     * Adiciona um nó ao grafo ou unifica se já existir correspondente.
     */
    addNode(node) {
      if (!this.nodes.has(node.stableId)) {
        this.nodes.set(node.stableId, node);
        this.identityIndex.set(node.stableId, node.stableId);
      }
      return this.nodes.get(node.stableId);
    }

    /**
     * Cria uma relação direcionada entre duas entidades multimodais.
     */
    addEdge(sourceId, relation, targetId, options = {}) {
      const resolvedSource = this.identityIndex.get(sourceId) || sourceId;
      const resolvedTarget = this.identityIndex.get(targetId) || targetId;

      const edge = {
        id: `edge_${this.edges.length + 1}`,
        sourceId: resolvedSource,
        relation,
        targetId: resolvedTarget,
        confidence: options.confidence || 0.95,
        metadata: options.metadata || {}
      };

      this.edges.push(edge);
      return edge;
    }

    /**
     * Resolução de Identidade: Unifica duas representações do mesmo elemento sem duplicação.
     * Exemplo: Uma 'Parede' detectada na Imagem que corresponde à 'Parede IFC' do Revit.
     */
    resolveIdentity(canonicalId, aliasId) {
      const canonicalNode = this.nodes.get(canonicalId);
      const aliasNode = this.nodes.get(aliasId);

      if (!canonicalNode) return { success: false, reason: 'Nó canônico não encontrado.' };

      if (aliasNode) {
        // Migra propriedades do alias para o nó canônico
        canonicalNode.aliases.add(aliasId);
        Object.assign(canonicalNode.properties, {
          ...aliasNode.properties,
          ...canonicalNode.properties // Propriedades canônicas têm precedência
        });
        this.identityIndex.set(aliasId, canonicalId);
        // Remove nó duplicado
        this.nodes.delete(aliasId);
      } else {
        canonicalNode.aliases.add(aliasId);
        this.identityIndex.set(aliasId, canonicalId);
      }

      // Redireciona arestas que apontavam para o alias
      for (const edge of this.edges) {
        if (edge.sourceId === aliasId) edge.sourceId = canonicalId;
        if (edge.targetId === aliasId) edge.targetId = canonicalId;
      }

      return {
        success: true,
        canonicalId,
        aliasId,
        message: `Identidade unificada: [${aliasId}] indexado para [${canonicalId}].`
      };
    }

    /**
     * Consulta Cruzada Canônica (Cross-Modal Mapping):
     * Responde: "Qual objeto desta imagem corresponde ao modelo 3D e qual elemento BIM o representa?"
     */
    queryCrossModalMapping(imageId, visualTargetNameOrId) {
      const resolvedImg = this.nodes.get(imageId);
      if (!resolvedImg) {
        return { found: false, message: `Imagem [${imageId}] não encontrada no grafo.` };
      }

      // 1. Encontra a entidade arquitetônica que a imagem retrata
      const depictsEdges = this.edges.filter(e => e.sourceId === imageId && e.relation === RelationType.DEPICTS);
      let targetEntity = null;

      for (const edge of depictsEdges) {
        const entity = this.nodes.get(edge.targetId);
        if (entity && (entity.stableId === visualTargetNameOrId || entity.name.toLowerCase().includes(String(visualTargetNameOrId).toLowerCase()))) {
          targetEntity = entity;
          break;
        }
      }

      // Se não encontrou relação direta, busca na coleção de nós
      if (!targetEntity) {
        targetEntity = Array.from(this.nodes.values()).find(n => n.name.toLowerCase().includes(String(visualTargetNameOrId).toLowerCase()));
      }

      if (!targetEntity) {
        return { found: false, message: `Objeto [${visualTargetNameOrId}] não localizado na cena.` };
      }

      // 2. Busca representação no modelo 3D (representedBy ➔ 3DObject)
      const obj3DEdge = this.edges.find(e => e.sourceId === targetEntity.stableId && e.relation === RelationType.REPRESENTED_BY);
      const obj3DNode = obj3DEdge ? this.nodes.get(obj3DEdge.targetId) : null;

      // 3. Busca correspondência no modelo BIM (correspondsTo ➔ BIMObject)
      const bimEdge = this.edges.find(e => (e.sourceId === targetEntity.stableId || e.targetId === targetEntity.stableId) && e.relation === RelationType.CORRESPONDS_TO);
      let bimNode = null;
      if (bimEdge) {
        const otherId = bimEdge.sourceId === targetEntity.stableId ? bimEdge.targetId : bimEdge.sourceId;
        bimNode = this.nodes.get(otherId);
      }

      return {
        found: true,
        query: { imageId, target: visualTargetNameOrId },
        mapping: {
          imageNode: { id: resolvedImg.stableId, name: resolvedImg.name },
          semanticEntity: { id: targetEntity.stableId, name: targetEntity.name, type: targetEntity.type },
          correspondsTo3DAsset: obj3DNode ? { id: obj3DNode.stableId, name: obj3DNode.name, meshUrl: obj3DNode.properties.meshUrl } : null,
          correspondsToBIMElement: bimNode ? { id: bimNode.stableId, name: bimNode.name, ifcGuid: bimNode.properties.ifcGuid, category: bimNode.properties.category } : null
        },
        answerFormatted: `O elemento visual [${targetEntity.name}] na imagem corresponde ao ativo 3D [${obj3DNode ? obj3DNode.name : 'N/A'}] e é representado no BIM pelo elemento [${bimNode ? bimNode.name : 'N/A'}] (GUID: ${bimNode && bimNode.properties.ifcGuid ? bimNode.properties.ifcGuid : 'Simulado'}).`
      };
    }

    /**
     * Retorna sumário quantitativo e densidade do grafo.
     */
    getSummary() {
      const typeCounts = {};
      for (const node of this.nodes.values()) {
        typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
      }

      return {
        graphId: this.graphId,
        projectId: this.projectId,
        totalNodes: this.nodes.size,
        totalEdges: this.edges.length,
        unifiedAliasesCount: this.identityIndex.size - this.nodes.size,
        typeBreakdown: typeCounts
      };
    }
  }

  // --------------------------------------------------------------------------
  // 4. FACTORY & POPULADOR CANÔNICO PARA PROJETOS REAIS
  // --------------------------------------------------------------------------
  class CrossModalSceneGraphFactory {
    /**
     * Constrói o grafo cross-modal completo para o projeto do estúdio com todas as conexões pré-estabelecidas.
     */
    static createProjectGraph(projectId = 'prj-praia-01', projectName = 'Residência de Praia') {
      const graph = new CrossModalProjectSceneGraph(projectId, projectName);

      // 1. Edificação e Pavimento
      const building = graph.addNode(new CrossModalNode({
        stableId: 'bld_casa_praia',
        type: NodeType.BUILDING,
        name: 'Residência Unifamiliar Praia',
        modality: 'BIM'
      }));
      graph.addEdge(graph.root.stableId, RelationType.CONTAINS, building.stableId);

      const levelTerreo = graph.addNode(new CrossModalNode({
        stableId: 'lvl_terreo',
        type: NodeType.LEVEL,
        name: 'Pavimento Térreo',
        modality: 'BIM'
      }));
      graph.addEdge(building.stableId, RelationType.CONTAINS, levelTerreo.stableId);

      // 2. Ambiente (Living)
      const roomLiving = graph.addNode(new CrossModalNode({
        stableId: 'room_living_social',
        type: NodeType.ROOM,
        name: 'Living Integrado',
        modality: 'BIM',
        properties: { areaM2: 38.5, heightMeters: 2.80 }
      }));
      graph.addEdge(levelTerreo.stableId, RelationType.CONTAINS, roomLiving.stableId);

      // 3. Imagem de Render Fotográfico
      const imgRender = graph.addNode(new CrossModalNode({
        stableId: 'img_render_living_01',
        type: NodeType.IMAGE,
        name: 'Render_Living_GoldenHour.png',
        modality: 'VISION',
        properties: { resolution: '3840x2160', cameraFocal: 35 }
      }));
      graph.addEdge(imgRender.stableId, RelationType.DEPICTS, roomLiving.stableId);

      // 4. Mobiliário (Sofá Linho)
      const sofaEntity = graph.addNode(new CrossModalNode({
        stableId: 'obj_sofa_linho_cru',
        type: NodeType.OBJECT,
        name: 'Sofá Modular Linho Cru',
        modality: 'SEMANTIC'
      }));
      graph.addEdge(roomLiving.stableId, RelationType.CONTAINS, sofaEntity.stableId);
      graph.addEdge(imgRender.stableId, RelationType.DEPICTS, sofaEntity.stableId);

      // 5. Ativo 3D Gerado (GLB do Trellis / Blender)
      const asset3D = graph.addNode(new CrossModalNode({
        stableId: 'asset3d_sofa_modular',
        type: NodeType.OBJECT,
        name: 'sofa_modular_interactive.glb',
        modality: '3D',
        properties: { meshUrl: 'projects/assets3d/sofa_modular.glb', polycount: 24500 }
      }));
      graph.addEdge(sofaEntity.stableId, RelationType.REPRESENTED_BY, asset3D.stableId);
      graph.addEdge(asset3D.stableId, RelationType.DERIVED_FROM, imgRender.stableId);

      // 6. Elemento BIM Oficial do Revit
      const bimElement = graph.addNode(new CrossModalNode({
        stableId: 'bim_elem_furniture_3421',
        type: NodeType.BIM_OBJECT,
        name: 'FamilyInstance: Mobiliário - Sofá 3 Lugares',
        modality: 'BIM',
        properties: { ifcGuid: '3aB8x9QW149xLt991K', category: 'IfcFurnishingElement', mark: 'SOF-01' }
      }));
      graph.addEdge(sofaEntity.stableId, RelationType.CORRESPONDS_TO, bimElement.stableId);

      return graph;
    }
  }

  // Exportação isomórfica (Browser & Node.js)
  const CrossModalModule = {
    NodeType,
    RelationType,
    CrossModalNode,
    CrossModalProjectSceneGraph,
    CrossModalSceneGraphFactory,
    createSceneGraph: (id, name) => new CrossModalProjectSceneGraph(id, name),
    createSeedProjectGraph: (id, name) => CrossModalSceneGraphFactory.createProjectGraph(id, name)
  };

  if (typeof window !== 'undefined') {
    window.CrossModalSceneGraph = CrossModalModule;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossModalModule;
  }
})();
