/*
 * ArqVértice Studio — J33 Client 3D Viewer Module
 * Experiência do Cliente: Edge-to-Edge 3D, Sketchfab-like UI, Hotspots, Trena 3D, Anotações,
 * Modos de Luz, Screenshots HD, Compartilhamento Seguro e Integração com AdaptiveRenderer.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ClientViewerModule = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Projetos Padrão Seguros (Dados Públicos do Cliente — Sem chaves ou APIs internas)
    const PUBLIC_PROJECTS = {
        'prj-praia-01': {
            id: 'prj-praia-01',
            code: 'PRJ-PRAIA-01',
            name: 'Residência de Praia',
            client: 'Pedro Albuquerque',
            typology: 'Residencial Unifamiliar Litorâneo',
            area: '385 m²',
            location: 'Litoral Sul — Lote 14, Quadra B',
            stage: 'Executivo & 3D',
            architect: 'Eduardo Marques',
            engineer: 'Luan Almeida',
            hotspots: [
                { id: 'h1', title: 'Living & Estar Integrado', desc: 'Pé-direito duplo de 5,80m com painéis de madeira ripada e esquadrias piso-teto.', pos: [-4, 2.5, 3], camPos: [-8, 4, 9], target: [-4, 1.5, 3], specs: ['Área: 65 m²', 'Piso: Travertino Navona', 'Pé-direito: 5.8m'] },
                { id: 'h2', title: 'Deck Gourmet & Lounge', desc: 'Churrasqueira embutida em granito preto São Gabriel escovado e ilha gourmet.', pos: [4, 1.8, 4], camPos: [8, 4, 10], target: [4, 1.5, 4], specs: ['Deck Cumaru', 'Bancada Granito', 'Área: 48 m²'] },
                { id: 'h3', title: 'Piscina com Prainha & Borda Infinita', desc: 'Revestimento em pedra hijau natural com hidro integrada e iluminação RGB subaquática.', pos: [5, 0.8, -5], camPos: [11, 4, -2], target: [5, 0.5, -5], specs: ['Pedra Hijau', 'Deck Molhado', 'Vol: 45 m³'] },
                { id: 'h4', title: 'Suíte Master Panorâmica (Pav. Sup.)', desc: 'Sacada privativa com vista mar, closet duplo e banheiro spa com banheira de imersão.', pos: [-3, 6.2, -2], camPos: [-8, 8, 4], target: [-3, 5.5, -2], specs: ['Área: 42 m²', 'Guarda-corpo Vidro', 'Esquadria Acústica'] }
            ]
        },
        'prj-eusebio-02': {
            id: 'prj-eusebio-02',
            code: 'PRJ-EUS-02',
            name: 'Residência Alphaville Eusébio',
            client: 'Marina & Carlos Vasconcelos',
            typology: 'Residencial Contemporâneo',
            area: '420 m²',
            location: 'Alphaville Ceará 3',
            stage: 'Briefing & Conceito',
            architect: 'Eduardo Marques',
            engineer: 'Luan Almeida',
            hotspots: [
                { id: 'h1', title: 'Fachada Principal & Brise Metálico', desc: 'Composição volumétrica com brises móveis em alumínio amadeirado.', pos: [0, 3, 7], camPos: [0, 5, 14], target: [0, 2.5, 0], specs: ['Brise Alumínio', 'Iluminação Linear LED'] },
                { id: 'h2', title: 'Área Gourmet & Varanda', desc: 'Espaço integrado para receber convidados conectado ao jardim.', pos: [4, 2, -2], camPos: [9, 4, 3], target: [4, 1.5, -2], specs: ['Área: 55 m²', 'Forro Madeira'] }
            ]
        },
        'prj-clinica-03': {
            id: 'prj-clinica-03',
            code: 'PRJ-CLI-03',
            name: 'Clínica Dermatológica Meireles',
            client: 'Dr. Roberto Silveira',
            typology: 'Comercial / Saúde Alto Padrão',
            area: '280 m²',
            location: 'Av. Dom Luís, Meireles',
            stage: 'Obra Concluída & As-Built',
            architect: 'Eduardo Marques',
            engineer: 'Luan Almeida',
            hotspots: [
                { id: 'h1', title: 'Recepção & Lounge de Espera', desc: 'Balcão curvo em mármore calacatta com iluminação difusa.', pos: [-2, 2, 2], camPos: [-5, 3.5, 6], target: [-2, 1.8, 2], specs: ['Mármore Calacatta', 'Biofilia'] },
                { id: 'h2', title: 'Consultório Principal', desc: 'Mobiliário ergonômico planejado e iluminação cirúrgica regulável.', pos: [3, 2, -1], camPos: [6, 3.5, 3], target: [3, 1.8, -1], specs: ['Piso Vinílico Hospitalar', 'Isolamento Acústico'] }
            ]
        }
    };

    class ClientViewer {
        constructor() {
            this.project = null;
            this.adaptiveRenderer = null;
            this.three = null;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.raycaster = null;
            this.pointer = null;
            this.canvas = null;
            this.hotspots = [];
            this.activeHotspotId = null;
            this.environmentMode = 'day'; // day, golden, night, studio
            this.isExploded = false;
            this.explodedGroup = null;
            this.measureActive = false;
            this.measurePoints = [];
            this.measureLine = null;
            this.measureLabelMesh = null;
            this.annotations = [];
            this.annotationMode = false;
            this.permissions = { allowMeasurements: true, allowComments: true };
            this._animId = null;
            this._targetCamPos = null;
            this._targetCamLookAt = null;
            this._isTransitioning = false;
            this._lights = {};
        }

        init() {
            this._parseParams();
            this._initAdaptiveEngine();
            this._initThreeScene();
            this._setupLighting();
            this._buildArchitecturalModel();
            this._initControls();
            this._initHotspotsUI();
            this._bindUIEvents();
            this._loadAnnotations();
            this._startProgressiveLoading();
            this._startRenderLoop();
            window.addEventListener('resize', () => this._onResize());
        }

        _parseParams() {
            const urlParams = new URLSearchParams(window.location.search);
            let projectId = urlParams.get('project') || urlParams.get('id') || urlParams.get('p');
            
            // Suporte a rota no path como /p/prj-praia-01 ou /viewer/prj-praia-01
            if (!projectId) {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const pIndex = pathParts.findIndex(p => p === 'p' || p === 'viewer' || p === 'v');
                if (pIndex !== -1 && pathParts[pIndex + 1]) {
                    projectId = pathParts[pIndex + 1];
                }
            }

            projectId = projectId || 'prj-praia-01';

            // Buscar dados de projeto (do StudioState ou catálogo seguro)
            let projectData = PUBLIC_PROJECTS[projectId];
            if (!projectData && window.StudioState && window.StudioState.data && window.StudioState.data.projects) {
                const match = window.StudioState.data.projects.find(p => p.id === projectId);
                if (match) {
                    projectData = {
                        id: match.id,
                        code: match.code,
                        name: match.name,
                        client: match.clientId,
                        typology: match.typology,
                        area: match.builtAreaM2 ? `${match.builtAreaM2} m²` : '350 m²',
                        location: match.location,
                        stage: match.currentStage,
                        architect: match.leadArchitect,
                        engineer: match.engineer,
                        hotspots: PUBLIC_PROJECTS['prj-praia-01'].hotspots
                    };
                }
            }

            this.project = projectData || PUBLIC_PROJECTS['prj-praia-01'];
            
            // Permissões
            if (urlParams.get('allowMeasurements') === 'false') this.permissions.allowMeasurements = false;
            if (urlParams.get('allowComments') === 'false') this.permissions.allowComments = false;
            
            this._updateProjectHeader();
        }

        _updateProjectHeader() {
            const titleEl = document.getElementById('viewer-header-title');
            const subEl = document.getElementById('viewer-header-sub');
            const tagEl = document.getElementById('viewer-header-tag');
            if (titleEl) titleEl.textContent = this.project.name;
            if (subEl) subEl.textContent = `${this.project.location} • ${this.project.area}`;
            if (tagEl) tagEl.textContent = this.project.stage || '3D INTERATIVO';
            document.title = `${this.project.name} — ArqVértice Client 3D`;
        }

        _initAdaptiveEngine() {
            const Adaptive = window.AdaptiveRenderer;
            this.adaptiveRenderer = Adaptive ? new Adaptive() : null;
            if (this.adaptiveRenderer) {
                this.adaptiveRenderer.subscribe(e => this._handleAdaptiveEvent(e));
                this._updateQualityUI();
            }
        }

        _initThreeScene() {
            const THREE = window.THREE;
            this.canvas = document.getElementById('viewer-3d-canvas');
            if (!this.canvas || !THREE) return;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0b0d11);
            this.scene.fog = new THREE.FogExp2(0x0b0d11, 0.015);

            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 300);
            this.camera.position.set(16, 12, 22);

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: true
            });

            this.renderer.setSize(width, height);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            if (this.adaptiveRenderer) {
                this.adaptiveRenderer.applyToThreeRenderer(this.renderer, this.scene, this.camera);
            }

            this.raycaster = new THREE.Raycaster();
            this.pointer = new THREE.Vector2();
        }

        _setupLighting() {
            const THREE = window.THREE;
            if (!this.scene || !THREE) return;

            // Luz Hemisférica (Céu e Solo)
            this._lights.hemi = new THREE.HemisphereLight(0xe8f0fe, 0x1a202c, 0.85);
            this.scene.add(this._lights.hemi);

            // Luz Solar Direcional Principal (Sombras Suaves)
            this._lights.sun = new THREE.DirectionalLight(0xfff8ee, 1.6);
            this._lights.sun.position.set(18, 26, 15);
            this._lights.sun.castShadow = true;
            this._lights.sun.shadow.mapSize.width = 2048;
            this._lights.sun.shadow.mapSize.height = 2048;
            this._lights.sun.shadow.camera.near = 0.5;
            this._lights.sun.shadow.camera.far = 80;
            const d = 25;
            this._lights.sun.shadow.camera.left = -d;
            this._lights.sun.shadow.camera.right = d;
            this._lights.sun.shadow.camera.top = d;
            this._lights.sun.shadow.camera.bottom = -d;
            this._lights.sun.shadow.bias = -0.0003;
            this.scene.add(this._lights.sun);

            // Luz de Preenchimento Azulada
            this._lights.fill = new THREE.DirectionalLight(0x7090b0, 0.5);
            this._lights.fill.position.set(-15, 12, -15);
            this.scene.add(this._lights.fill);

            // Luzes Artificiais Pontuais (Spots para Modo Noite)
            this._lights.interiorGroup = new THREE.Group();
            const spot1 = new THREE.PointLight(0xffaa44, 1.8, 14);
            spot1.position.set(-3, 3.5, 2);
            const spot2 = new THREE.PointLight(0xffcc66, 1.5, 12);
            spot2.position.set(3, 2.5, 3);
            const poolLight = new THREE.PointLight(0x00d2ff, 2.5, 10);
            poolLight.position.set(5, 0.2, -5);
            this._lights.interiorGroup.add(spot1, spot2, poolLight);
            this._lights.interiorGroup.visible = false;
            this.scene.add(this._lights.interiorGroup);
        }

        _buildArchitecturalModel() {
            const THREE = window.THREE;
            if (!this.scene || !THREE) return;

            this.explodedGroup = new THREE.Group();
            this.scene.add(this.explodedGroup);

            // Materiais PBR Arquitetônicos Refinados
            const matGround = new THREE.MeshStandardMaterial({ color: 0x151a21, roughness: 0.9, metalness: 0.1 });
            const matFloor = new THREE.MeshStandardMaterial({ color: 0xe2ded9, roughness: 0.4, metalness: 0.05 });
            const matDeckWood = new THREE.MeshStandardMaterial({ color: 0x7c4728, roughness: 0.5, metalness: 0.05 });
            const matPlasterWhite = new THREE.MeshStandardMaterial({ color: 0xf0f2f5, roughness: 0.6, metalness: 0.02 });
            const matConcreteAccent = new THREE.MeshStandardMaterial({ color: 0x5a6069, roughness: 0.7, metalness: 0.1 });
            const matGlass = new THREE.MeshPhysicalMaterial({ color: 0xaaddee, transparent: true, opacity: 0.35, roughness: 0.05, transmission: 0.85, ior: 1.5 });
            const matWater = new THREE.MeshStandardMaterial({ color: 0x0088cc, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85 });
            const matPoolTile = new THREE.MeshStandardMaterial({ color: 0x005577, roughness: 0.3, metalness: 0.2 });
            const matMetalDark = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.3, metalness: 0.85 });
            const matFurnitureSofa = new THREE.MeshStandardMaterial({ color: 0x3d434d, roughness: 0.8, metalness: 0.05 });
            const matGrass = new THREE.MeshStandardMaterial({ color: 0x2e4628, roughness: 0.85, metalness: 0.05 });

            // 1. Terreno / Platô
            const terrainGeo = new THREE.PlaneGeometry(60, 60);
            const terrain = new THREE.Mesh(terrainGeo, matGround);
            terrain.rotation.x = -Math.PI / 2;
            terrain.position.y = -0.05;
            terrain.receiveShadow = true;
            this.scene.add(terrain);

            // Gramado ao Redor
            const grassGeo = new THREE.BoxGeometry(28, 0.2, 28);
            const grass = new THREE.Mesh(grassGeo, matGrass);
            grass.position.set(0, 0, 0);
            grass.receiveShadow = true;
            this.explodedGroup.add(grass);

            // 2. Pavimento Térreo (Piso & Base)
            const floorGeo = new THREE.BoxGeometry(18, 0.4, 14);
            const floor = new THREE.Mesh(floorGeo, matFloor);
            floor.position.set(-1, 0.2, 1);
            floor.receiveShadow = true;
            floor.castShadow = true;
            floor.name = 'Piso_Terreo';
            this.explodedGroup.add(floor);

            // Deck de Madeira Litorâneo
            const deckGeo = new THREE.BoxGeometry(10, 0.3, 10);
            const deck = new THREE.Mesh(deckGeo, matDeckWood);
            deck.position.set(4, 0.25, 4);
            deck.receiveShadow = true;
            deck.castShadow = true;
            deck.name = 'Deck_Gourmet';
            this.explodedGroup.add(deck);

            // Piscina com Borda Infinita & Prainha
            const poolBoxGeo = new THREE.BoxGeometry(7, 1.2, 6);
            const poolBox = new THREE.Mesh(poolBoxGeo, matPoolTile);
            poolBox.position.set(5, -0.4, -5);
            poolBox.receiveShadow = true;
            this.explodedGroup.add(poolBox);

            const waterGeo = new THREE.BoxGeometry(6.6, 0.1, 5.6);
            const water = new THREE.Mesh(waterGeo, matWater);
            water.position.set(5, 0.1, -5);
            water.name = 'Agua_Piscina';
            this.explodedGroup.add(water);

            // 3. Paredes do Pavimento Térreo
            const wallsGroup = new THREE.Group();
            wallsGroup.name = 'Paredes_Terreo';

            // Parede Traseira
            const backWallGeo = new THREE.BoxGeometry(16, 3.8, 0.3);
            const backWall = new THREE.Mesh(backWallGeo, matPlasterWhite);
            backWall.position.set(-2, 2.1, -5.5);
            backWall.castShadow = true;
            backWall.receiveShadow = true;
            wallsGroup.add(backWall);

            // Parede Lateral Esquerda (Concreto Aparente)
            const leftWallGeo = new THREE.BoxGeometry(0.3, 3.8, 12);
            const leftWall = new THREE.Mesh(leftWallGeo, matConcreteAccent);
            leftWall.position.set(-9.5, 2.1, 0.5);
            leftWall.castShadow = true;
            leftWall.receiveShadow = true;
            wallsGroup.add(leftWall);

            // Parede Divisória Interna com Nicho
            const divWallGeo = new THREE.BoxGeometry(6, 3.8, 0.25);
            const divWall = new THREE.Mesh(divWallGeo, matPlasterWhite);
            divWall.position.set(-4, 2.1, 0);
            divWall.castShadow = true;
            divWall.receiveShadow = true;
            wallsGroup.add(divWall);

            this.explodedGroup.add(wallsGroup);

            // 4. Grandes Panos de Vidro / Fachada Envidraçada
            const glassWallGeo = new THREE.BoxGeometry(10, 3.6, 0.08);
            const glassWall = new THREE.Mesh(glassWallGeo, matGlass);
            glassWall.position.set(0.5, 2.1, 6.5);
            glassWall.castShadow = true;
            this.explodedGroup.add(glassWall);

            // Esquadrias em Alumínio Preto
            const frameGeo = new THREE.BoxGeometry(10.2, 0.1, 0.15);
            const frameTop = new THREE.Mesh(frameGeo, matMetalDark);
            frameTop.position.set(0.5, 3.9, 6.5);
            const frameBottom = new THREE.Mesh(frameGeo, matMetalDark);
            frameBottom.position.set(0.5, 0.35, 6.5);
            this.explodedGroup.add(frameTop, frameBottom);

            // 5. Pavimento Superior (Lajes & Suítes)
            this.upperFloorGroup = new THREE.Group();
            this.upperFloorGroup.name = 'Pavimento_Superior';

            // Laje Intermediária
            const slabGeo = new THREE.BoxGeometry(17, 0.4, 13);
            const slab = new THREE.Mesh(slabGeo, matConcreteAccent);
            slab.position.set(-1.5, 4.1, 0);
            slab.castShadow = true;
            slab.receiveShadow = true;
            this.upperFloorGroup.add(slab);

            // Volume Superior / Suíte Master em Balanço
            const upperBoxGeo = new THREE.BoxGeometry(12, 3.4, 9);
            const upperBox = new THREE.Mesh(upperBoxGeo, matPlasterWhite);
            upperBox.position.set(-3.5, 5.9, -0.5);
            upperBox.castShadow = true;
            upperBox.receiveShadow = true;
            this.upperFloorGroup.add(upperBox);

            // Sacada com Guarda-corpo de Vidro
            const balconyGlassGeo = new THREE.BoxGeometry(5.5, 1.1, 0.06);
            const balconyGlass = new THREE.Mesh(balconyGlassGeo, matGlass);
            balconyGlass.position.set(-3.5, 4.85, 4.2);
            this.upperFloorGroup.add(balconyGlass);

            // Cobertura / Platibanda Superior
            const roofGeo = new THREE.BoxGeometry(13, 0.35, 10);
            const roof = new THREE.Mesh(roofGeo, matMetalDark);
            roof.position.set(-3.5, 7.7, -0.5);
            roof.castShadow = true;
            this.upperFloorGroup.add(roof);

            this.explodedGroup.add(this.upperFloorGroup);

            // 6. Mobiliário Arquitetônico Humanizado
            const furnitureGroup = new THREE.Group();
            furnitureGroup.name = 'Mobiliario';

            // Sofá Living
            const sofaBaseGeo = new THREE.BoxGeometry(3.6, 0.6, 1.8);
            const sofaBase = new THREE.Mesh(sofaBaseGeo, matFurnitureSofa);
            sofaBase.position.set(-5, 0.6, 3);
            sofaBase.castShadow = true;
            const sofaBackGeo = new THREE.BoxGeometry(3.6, 0.8, 0.4);
            const sofaBack = new THREE.Mesh(sofaBackGeo, matFurnitureSofa);
            sofaBack.position.set(-5, 1.1, 2.2);
            sofaBack.castShadow = true;
            furnitureGroup.add(sofaBase, sofaBack);

            // Mesa de Centro em Madeira
            const tableGeo = new THREE.BoxGeometry(1.8, 0.3, 1.0);
            const table = new THREE.Mesh(tableGeo, matDeckWood);
            table.position.set(-5, 0.45, 4.5);
            table.castShadow = true;
            furnitureGroup.add(table);

            // Pergolado Metálico na Área Gourmet
            const pergolaGroup = new THREE.Group();
            for (let i = 0; i < 7; i++) {
                const beamGeo = new THREE.BoxGeometry(0.12, 0.25, 7);
                const beam = new THREE.Mesh(beamGeo, matMetalDark);
                beam.position.set(2 + i * 0.9, 3.4, 4);
                beam.castShadow = true;
                pergolaGroup.add(beam);
            }
            furnitureGroup.add(pergolaGroup);

            this.explodedGroup.add(furnitureGroup);
        }

        _initControls() {
            const THREE = window.THREE;
            const element = this.canvas;
            if (!element || !this.camera) return;

            // Controlador Orbital Refinado com Suporte Completo Desktop & Mobile
            const self = this;
            this.controls = {
                target: new THREE.Vector3(0, 2.5, 0),
                radius: 28,
                azimuth: 0.85,
                polar: 1.15,
                pointer: null,
                touches: new Map(),
                touchDistance: 0,
                autoRotate: false,

                update() {
                    if (self._isTransitioning) return;
                    if (this.autoRotate) {
                        this.azimuth += 0.002;
                    }
                    const sin = Math.sin(this.polar);
                    self.camera.position.set(
                        this.target.x + this.radius * sin * Math.sin(this.azimuth),
                        this.target.y + this.radius * Math.cos(this.polar),
                        this.target.z + this.radius * sin * Math.cos(this.azimuth)
                    );
                    self.camera.lookAt(this.target);
                    self._updateHotspotScreenPositions();
                },

                setCameraPose(pos, target) {
                    self._animateCamera(pos, target);
                }
            };

            // Eventos Desktop (Mouse & Wheel)
            element.addEventListener('pointerdown', e => {
                if (this.measureActive) {
                    this._handleMeasureClick(e);
                    return;
                }
                if (this.annotationMode) {
                    this._handleAnnotationClick(e);
                    return;
                }
                this.controls.autoRotate = false;
                this.controls.pointer = { x: e.clientX, y: e.clientY, button: e.button };
                element.setPointerCapture?.(e.pointerId);
            });

            element.addEventListener('pointermove', e => {
                if (!this.controls.pointer) return;
                const dx = e.clientX - this.controls.pointer.x;
                const dy = e.clientY - this.controls.pointer.y;
                this.controls.pointer.x = e.clientX;
                this.controls.pointer.y = e.clientY;

                if (this.controls.pointer.button === 1 || this.controls.pointer.button === 2 || e.shiftKey) {
                    // Pan (Mover Alvo)
                    const panSpeed = this.controls.radius * 0.0012;
                    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
                    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
                    this.controls.target.addScaledVector(right, -dx * panSpeed);
                    this.controls.target.addScaledVector(up, dy * panSpeed);
                } else {
                    // Orbit (Rotação)
                    this.controls.azimuth -= dx * 0.006;
                    this.controls.polar = Math.max(0.12, Math.min(Math.PI / 2 + 0.05, this.controls.polar + dy * 0.006));
                }
                this.controls.update();
            });

            element.addEventListener('pointerup', () => {
                this.controls.pointer = null;
            });

            element.addEventListener('wheel', e => {
                e.preventDefault();
                this.controls.autoRotate = false;
                const zoomFactor = 1 + Math.sign(e.deltaY) * 0.08;
                this.controls.radius = Math.max(3.5, Math.min(75, this.controls.radius * zoomFactor));
                this.controls.update();
            }, { passive: false });

            // Eventos Mobile (Touch: Orbit, Pinch Zoom, Pan, Double Tap)
            let lastTapTime = 0;
            element.addEventListener('touchstart', e => {
                for (const t of e.touches) {
                    this.controls.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
                }
                if (e.touches.length === 2) {
                    const t1 = e.touches[0];
                    const t2 = e.touches[1];
                    this.controls.touchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                }
                // Double Tap Focus
                if (e.touches.length === 1) {
                    const now = Date.now();
                    if (now - lastTapTime < 300) {
                        this._handleDoubleTapFocus(e.touches[0]);
                    }
                    lastTapTime = now;
                }
            }, { passive: true });

            element.addEventListener('touchmove', e => {
                e.preventDefault();
                this.controls.autoRotate = false;
                if (e.touches.length === 1) {
                    // Touch Orbit
                    const t = e.touches[0];
                    const prev = this.controls.touches.get(t.identifier) || { x: t.clientX, y: t.clientY };
                    const dx = t.clientX - prev.x;
                    const dy = t.clientY - prev.y;
                    this.controls.azimuth -= dx * 0.008;
                    this.controls.polar = Math.max(0.12, Math.min(Math.PI / 2 + 0.05, this.controls.polar + dy * 0.008));
                    this.controls.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
                } else if (e.touches.length >= 2) {
                    // Pinch Zoom & Pan
                    const t1 = e.touches[0];
                    const t2 = e.touches[1];
                    const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                    if (this.controls.touchDistance > 0 && dist > 0) {
                        const ratio = this.controls.touchDistance / dist;
                        this.controls.radius = Math.max(3.5, Math.min(75, this.controls.radius * ratio));
                        this.controls.touchDistance = dist;
                    }
                }
                this.controls.update();
            }, { passive: false });

            element.addEventListener('touchend', e => {
                this.controls.touches.clear();
                this.controls.touchDistance = 0;
            }, { passive: true });

            // Atalhos de Teclado
            window.addEventListener('keydown', e => this._handleKeyboardShortcuts(e));
            
            this.controls.update();
        }

        _handleKeyboardShortcuts(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case '1': this.setViewPreset('isometric'); break;
                case '2': this.setViewPreset('top'); break;
                case '3': this.setViewPreset('front'); break;
                case '4': this.focusHotspot('h1'); break;
                case '5': this.focusHotspot('h3'); break;
                case ' ':
                    e.preventDefault();
                    this.resetCamera();
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'm':
                case 'M':
                    this.toggleMeasurement();
                    break;
                case 'h':
                case 'H':
                    this.toggleHotspotsList();
                    break;
                case 'r':
                case 'R':
                    this.toggleAutoRotate();
                    break;
            }
        }

        _handleDoubleTapFocus(touch) {
            const rect = this.canvas.getBoundingClientRect();
            this.pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            if (intersects.length > 0) {
                const hit = intersects[0];
                this.controls.target.copy(hit.point);
                this.controls.radius = Math.max(6, this.controls.radius * 0.7);
                this.controls.update();
                this._showToast('Câmera focada no ponto selecionado.');
            }
        }

        _animateCamera(targetPos, targetLookAt, duration = 1000) {
            this._isTransitioning = true;
            const startPos = this.camera.position.clone();
            const startLookAt = this.controls.target.clone();
            const destPos = new window.THREE.Vector3(...targetPos);
            const destLookAt = new window.THREE.Vector3(...targetLookAt);
            const startTime = performance.now();

            const animateStep = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.camera.position.lerpVectors(startPos, destPos, ease);
                this.controls.target.lerpVectors(startLookAt, destLookAt, ease);
                this.camera.lookAt(this.controls.target);
                this._updateHotspotScreenPositions();

                if (progress < 1) {
                    requestAnimationFrame(animateStep);
                } else {
                    this._isTransitioning = false;
                    this.controls.radius = this.camera.position.distanceTo(this.controls.target);
                    const dir = this.camera.position.clone().sub(this.controls.target);
                    this.controls.azimuth = Math.atan2(dir.x, dir.z);
                    this.controls.polar = Math.acos(Math.max(-1, Math.min(1, dir.y / this.controls.radius)));
                    this.controls.update();
                }
            };
            requestAnimationFrame(animateStep);
        }

        // Hotspots UI & 3D Markers
        _initHotspotsUI() {
            const container = document.getElementById('viewer-hotspots-markers');
            const listContainer = document.getElementById('viewer-hotspots-list');
            if (!container || !this.project.hotspots) return;

            container.innerHTML = '';
            if (listContainer) listContainer.innerHTML = '';

            this.project.hotspots.forEach((h, index) => {
                // Marker 3D no Canvas
                const marker = document.createElement('div');
                marker.className = 'viewer-3d-hotspot-marker';
                marker.id = `marker-${h.id}`;
                marker.textContent = index + 1;
                marker.title = h.title;
                marker.onclick = (e) => {
                    e.stopPropagation();
                    this.focusHotspot(h.id);
                };
                container.appendChild(marker);

                // Card no Painel Lateral
                if (listContainer) {
                    const card = document.createElement('div');
                    card.className = 'viewer-hotspot-card';
                    card.id = `card-${h.id}`;
                    card.innerHTML = `
                        <div class="viewer-hotspot-title">
                            <span class="viewer-badge-tag">${index + 1}</span>
                            <span>${h.title}</span>
                        </div>
                        <div class="viewer-hotspot-desc">${h.desc}</div>
                        <div class="viewer-hotspot-specs">
                            ${(h.specs || []).map(s => `<span class="viewer-spec-chip">${s}</span>`).join('')}
                        </div>
                    `;
                    card.onclick = () => this.focusHotspot(h.id);
                    listContainer.appendChild(card);
                }
            });

            this._updateHotspotScreenPositions();
        }

        _updateHotspotScreenPositions() {
            const THREE = window.THREE;
            if (!this.camera || !THREE || !this.project.hotspots) return;

            const width = window.innerWidth;
            const height = window.innerHeight;
            const tempV = new THREE.Vector3();

            this.project.hotspots.forEach(h => {
                const marker = document.getElementById(`marker-${h.id}`);
                if (!marker) return;

                tempV.set(...h.pos);
                tempV.project(this.camera);

                // Verifica se está na frente da câmera (z < 1)
                const isVisible = tempV.z < 1 && tempV.x >= -1.1 && tempV.x <= 1.1 && tempV.y >= -1.1 && tempV.y <= 1.1;
                
                if (isVisible) {
                    const x = (tempV.x * 0.5 + 0.5) * width;
                    const y = (-(tempV.y * 0.5) + 0.5) * height;
                    marker.style.display = 'flex';
                    marker.style.left = `${x}px`;
                    marker.style.top = `${y}px`;
                } else {
                    marker.style.display = 'none';
                }
            });
        }

        focusHotspot(hotspotId) {
            const h = this.project.hotspots.find(x => x.id === hotspotId);
            if (!h) return;
            this.activeHotspotId = hotspotId;

            // Highlight card
            document.querySelectorAll('.viewer-hotspot-card').forEach(c => c.classList.remove('selected'));
            const activeCard = document.getElementById(`card-${hotspotId}`);
            if (activeCard) {
                activeCard.classList.add('selected');
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Animate camera to hotspot POI
            this._animateCamera(h.camPos, h.target, 1200);
            this.openSidebarPanel('hotspots');
            this._showToast(`Ponto de Interesse: ${h.title}`);
        }

        // Presets de Câmera (Isométrica, Topo, Fachada, etc.)
        setViewPreset(presetKey) {
            switch (presetKey) {
                case 'isometric':
                    this._animateCamera([20, 16, 24], [0, 2, 0]);
                    break;
                case 'top':
                    this._animateCamera([0, 32, 0.1], [0, 0, 0]);
                    break;
                case 'front':
                    this._animateCamera([0, 4, 26], [0, 3, 0]);
                    break;
                case 'side':
                    this._animateCamera([26, 4, 0], [0, 3, 0]);
                    break;
                case 'back':
                    this._animateCamera([0, 4, -26], [0, 3, 0]);
                    break;
            }
            this._showToast(`Vista: ${presetKey.toUpperCase()}`);
        }

        resetCamera() {
            this._animateCamera([16, 12, 22], [0, 2.5, 0]);
            this._showToast('Câmera redefinida.');
        }

        toggleAutoRotate() {
            if (!this.controls) return;
            this.controls.autoRotate = !this.controls.autoRotate;
            this._showToast(this.controls.autoRotate ? 'Auto-Rotação 3D ativada.' : 'Auto-Rotação pausada.');
        }

        // Iluminação & Ambientes
        setEnvironmentMode(mode) {
            this.environmentMode = mode;
            const THREE = window.THREE;
            if (!this.scene || !THREE) return;

            document.querySelectorAll('[data-env-mode]').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-env-mode') === mode);
            });

            switch (mode) {
                case 'day':
                    this.scene.background.set(0x0b0d11);
                    this.scene.fog.color.set(0x0b0d11);
                    this._lights.hemi.color.set(0xe8f0fe);
                    this._lights.hemi.groundColor.set(0x1a202c);
                    this._lights.hemi.intensity = 0.85;
                    this._lights.sun.color.set(0xfff8ee);
                    this._lights.sun.intensity = 1.6;
                    this._lights.sun.position.set(18, 26, 15);
                    this._lights.interiorGroup.visible = false;
                    break;
                case 'golden':
                    this.scene.background.set(0x1a1210);
                    this.scene.fog.color.set(0x1a1210);
                    this._lights.hemi.color.set(0xffb888);
                    this._lights.hemi.groundColor.set(0x2a1510);
                    this._lights.hemi.intensity = 0.7;
                    this._lights.sun.color.set(0xff8833);
                    this._lights.sun.intensity = 2.0;
                    this._lights.sun.position.set(24, 10, 20);
                    this._lights.interiorGroup.visible = true;
                    break;
                case 'night':
                    this.scene.background.set(0x030508);
                    this.scene.fog.color.set(0x030508);
                    this._lights.hemi.color.set(0x102040);
                    this._lights.hemi.groundColor.set(0x020408);
                    this._lights.hemi.intensity = 0.25;
                    this._lights.sun.color.set(0x406090);
                    this._lights.sun.intensity = 0.4;
                    this._lights.interiorGroup.visible = true;
                    break;
                case 'studio':
                    this.scene.background.set(0x16181d);
                    this.scene.fog.color.set(0x16181d);
                    this._lights.hemi.color.set(0xffffff);
                    this._lights.hemi.groundColor.set(0x444444);
                    this._lights.hemi.intensity = 1.0;
                    this._lights.sun.color.set(0xffffff);
                    this._lights.sun.intensity = 1.2;
                    this._lights.interiorGroup.visible = false;
                    break;
            }
            this._showToast(`Modo de Iluminação: ${mode.toUpperCase()}`);
        }

        // Vista Explodida de Pavimentos
        toggleExplodedView() {
            if (!this.upperFloorGroup) return;
            this.isExploded = !this.isExploded;
            const targetY = this.isExploded ? 6.0 : 0;
            const startY = this.upperFloorGroup.position.y;
            const startTime = performance.now();
            const duration = 700;

            const animateExplode = (now) => {
                const p = Math.min(1, (now - startTime) / duration);
                const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
                this.upperFloorGroup.position.y = startY + (targetY - startY) * ease;
                if (p < 1) requestAnimationFrame(animateExplode);
            };
            requestAnimationFrame(animateExplode);

            const btn = document.getElementById('btn-toggle-explode');
            if (btn) btn.classList.toggle('active', this.isExploded);
            this._showToast(this.isExploded ? 'Vista Explodida de Pavimentos Ativa.' : 'Pavimentos unificados.');
        }

        // Ferramenta de Medição 3D (Trena Virtual)
        toggleMeasurement() {
            if (!this.permissions.allowMeasurements) {
                this._showToast('Medições desabilitadas neste link compartilhado.');
                return;
            }
            this.measureActive = !this.measureActive;
            const hud = document.getElementById('viewer-measure-hud');
            const btn = document.getElementById('btn-toggle-measure');
            if (btn) btn.classList.toggle('active', this.measureActive);
            if (hud) hud.classList.toggle('active', this.measureActive);

            if (!this.measureActive) {
                this.clearMeasurement();
            } else {
                this._showToast('Trena 3D Ativa: Clique em 2 pontos do modelo.');
            }
        }

        _handleMeasureClick(e) {
            const THREE = window.THREE;
            const rect = this.canvas.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);

            const intersects = this.raycaster.intersectObjects(this.explodedGroup.children, true);
            if (intersects.length === 0) return;

            const point = intersects[0].point;
            this.measurePoints.push(point);

            if (this.measurePoints.length === 1) {
                this._showToast('Ponto 1 selecionado. Clique no Ponto 2.');
            } else if (this.measurePoints.length === 2) {
                const p1 = this.measurePoints[0];
                const p2 = this.measurePoints[1];
                const dist = p1.distanceTo(p2);

                // Desenha linha 3D
                if (this.measureLine) this.scene.remove(this.measureLine);
                const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                const lineMat = new THREE.LineBasicMaterial({ color: 0xf5a623, linewidth: 3 });
                this.measureLine = new THREE.Line(lineGeo, lineMat);
                this.scene.add(this.measureLine);

                // Atualiza HUD
                const valEl = document.getElementById('viewer-measure-val');
                if (valEl) valEl.textContent = `${dist.toFixed(2)} m`;
                this._showToast(`Distância calculada: ${dist.toFixed(2)} metros.`);
            } else {
                this.clearMeasurement();
                this.measurePoints.push(point);
                this._showToast('Nova medição iniciada.');
            }
        }

        clearMeasurement() {
            this.measurePoints = [];
            if (this.measureLine) {
                this.scene.remove(this.measureLine);
                this.measureLine = null;
            }
            const valEl = document.getElementById('viewer-measure-val');
            if (valEl) valEl.textContent = '0.00 m';
        }

        // Anotações & Comentários do Cliente
        toggleAnnotationMode() {
            if (!this.permissions.allowComments) {
                this._showToast('Comentários desabilitados para este link.');
                return;
            }
            this.annotationMode = !this.annotationMode;
            this._showToast(this.annotationMode ? 'Clique no modelo 3D onde deseja fixar um comentário.' : 'Modo anotação encerrado.');
            this.openSidebarPanel('annotations');
        }

        _handleAnnotationClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.explodedGroup.children, true);
            if (intersects.length === 0) return;

            const hit = intersects[0];
            const comment = prompt('Insira seu comentário para a equipe ArqVértice neste ponto:');
            if (comment && comment.trim()) {
                const ann = {
                    id: `ann_${Date.now()}`,
                    text: comment.trim(),
                    author: this.project.client || 'Cliente',
                    time: new Date().toLocaleDateString('pt-BR'),
                    pos: [hit.point.x, hit.point.y, hit.point.z]
                };
                this.annotations.push(ann);
                this._saveAnnotations();
                this._renderAnnotationsList();
                this._showToast('Comentário registrado com sucesso!');
            }
            this.annotationMode = false;
        }

        _loadAnnotations() {
            try {
                const raw = localStorage.getItem(`arqvertice_annotations_${this.project.id}`);
                this.annotations = raw ? JSON.parse(raw) : [
                    { id: 'ann_1', text: 'Adoramos o contraste da madeira ripada com a iluminação.', author: 'Pedro Albuquerque', time: 'Ontem', pos: [-4, 2, 3] }
                ];
            } catch (e) {
                this.annotations = [];
            }
            this._renderAnnotationsList();
        }

        _saveAnnotations() {
            try {
                localStorage.setItem(`arqvertice_annotations_${this.project.id}`, JSON.stringify(this.annotations));
            } catch (e) {}
        }

        _renderAnnotationsList() {
            const list = document.getElementById('viewer-annotations-list');
            if (!list) return;
            if (this.annotations.length === 0) {
                list.innerHTML = `<div class="viewer-hotspot-desc" style="text-align: center; padding: 16px;">Nenhum comentário registrado ainda.</div>`;
                return;
            }
            list.innerHTML = this.annotations.map((a, i) => `
                <div class="viewer-hotspot-card">
                    <div class="viewer-hotspot-title">
                        <span class="viewer-badge-tag">#${i + 1}</span>
                        <span>${a.author} • <small style="color: var(--viewer-text-muted);">${a.time}</small></span>
                    </div>
                    <div class="viewer-hotspot-desc" style="color: #fff; margin-top: 6px;">"${a.text}"</div>
                </div>
            `).join('');
        }

        // Exportação de Screenshot em Alta Resolução
        captureScreenshot() {
            if (!this.renderer || !this.scene || !this.camera) return;
            this.renderer.render(this.scene, this.camera);
            
            const rawDataUrl = this.canvas.toDataURL('image/png');
            const img = new Image();
            img.onload = () => {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = img.width;
                offCanvas.height = img.height;
                const ctx = offCanvas.getContext('2d');

                // Renderiza imagem 3D
                ctx.drawImage(img, 0, 0);

                // Watermark & Banner Institucional ArqVértice
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                ctx.fillRect(20, offCanvas.height - 70, 360, 50);

                ctx.fillStyle = '#2997ff';
                ctx.font = 'bold 16px Montserrat, sans-serif';
                ctx.fillText('ARQVÉRTICE STUDIO', 35, offCanvas.height - 42);

                ctx.fillStyle = '#ffffff';
                ctx.font = '13px Montserrat, sans-serif';
                ctx.fillText(`${this.project.name} • ${this.project.code}`, 35, offCanvas.height - 24);

                // Download automático
                const link = document.createElement('a');
                link.download = `ArqVertice_${this.project.code}_${Date.now()}.png`;
                link.href = offCanvas.toDataURL('image/png');
                link.click();
                this._showToast('Screenshot HD exportado com sucesso!');
            };
            img.src = rawDataUrl;
        }

        // Compartilhamento & Segurança
        openShareModal() {
            const modal = document.getElementById('viewer-share-modal');
            const input = document.getElementById('viewer-share-url-input');
            if (modal) modal.classList.add('open');

            const token = `share_${Math.random().toString(36).slice(2, 10)}`;
            const baseUrl = window.location.origin ? `${window.location.origin}/viewer.html` : 'https://arqvertice.studio/viewer.html';
            const shareUrl = `${baseUrl}?project=${this.project.id}&token=${token}&allowMeasurements=${this.permissions.allowMeasurements}&allowComments=${this.permissions.allowComments}`;
            
            if (input) input.value = shareUrl;
        }

        closeShareModal() {
            const modal = document.getElementById('viewer-share-modal');
            if (modal) modal.classList.remove('open');
        }

        copyShareLink() {
            const input = document.getElementById('viewer-share-url-input');
            if (input) {
                input.select();
                navigator.clipboard.writeText(input.value).then(() => {
                    this._showToast('Link seguro copiado para a área de transferência!');
                });
            }
        }

        // Qualidade & Presets Adaptativos
        setQuality(presetKey) {
            if (!this.adaptiveRenderer) return;
            this.adaptiveRenderer.setPreset(presetKey);
            this.adaptiveRenderer.applyToThreeRenderer(this.renderer, this.scene, this.camera);
            this._updateQualityUI();
            this._showToast(`Qualidade Gráfica: ${presetKey}`);
            this.closePopover('quality');
        }

        _updateQualityUI() {
            if (!this.adaptiveRenderer) return;
            const presetInfo = this.adaptiveRenderer.getPreset();
            const config = this.adaptiveRenderer.getConfig();
            const btn = document.getElementById('btn-active-quality');
            if (btn) {
                btn.innerHTML = `<i data-lucide="sparkles"></i><span>${config.name}</span>`;
                if (window.lucide) window.lucide.createIcons();
            }

            // Atualiza itens do popover
            document.querySelectorAll('[data-quality-preset]').forEach(item => {
                const k = item.getAttribute('data-quality-preset');
                item.classList.toggle('active', k === presetInfo.active);
            });
        }

        _handleAdaptiveEvent(e) {
            if (e.type === 'metrics_updated') {
                this._updateTelemetryDisplay(e.metrics);
            } else if (e.type === 'auto_downgraded') {
                this._updateQualityUI();
                this._showToast('Modo de economia ativado automaticamente para garantir fluidez.');
            }
        }

        _updateTelemetryDisplay(metrics) {
            const fpsEl = document.getElementById('telemetry-fps');
            const callsEl = document.getElementById('telemetry-calls');
            const trisEl = document.getElementById('telemetry-triangles');
            const memEl = document.getElementById('telemetry-memory');
            const apiEl = document.getElementById('telemetry-api');

            if (fpsEl) {
                fpsEl.textContent = `${metrics.fps} FPS`;
                fpsEl.className = `telemetry-val ${metrics.fps >= 50 ? 'fps-high' : metrics.fps >= 30 ? 'fps-mid' : 'fps-low'}`;
            }
            if (callsEl) callsEl.textContent = metrics.drawCalls;
            if (trisEl) trisEl.textContent = Number(metrics.triangles).toLocaleString();
            if (memEl) memEl.textContent = `${metrics.memoryMB} MB`;
            if (apiEl) apiEl.textContent = metrics.rendererApi;
        }

        // Progressive Loading
        async _startProgressiveLoading() {
            const loadingScreen = document.getElementById('viewer-loading-screen');
            const fillEl = document.getElementById('viewer-progress-fill');
            const subEl = document.getElementById('viewer-loading-sub');

            if (this.adaptiveRenderer) {
                await this.adaptiveRenderer.runProgressivePipeline({ projectId: this.project.id }, (p) => {
                    if (fillEl) fillEl.style.width = `${p.percent}%`;
                    if (subEl) subEl.textContent = p.label;
                });
            }

            setTimeout(() => {
                if (loadingScreen) loadingScreen.classList.add('hidden');
            }, 300);
        }

        // Loop de Renderização
        _startRenderLoop() {
            const animate = () => {
                this._animId = requestAnimationFrame(animate);
                if (this.controls) this.controls.update();
                if (this.renderer && this.scene && this.camera) {
                    this.renderer.render(this.scene, this.camera);
                }
                if (this.adaptiveRenderer && this.renderer) {
                    this.adaptiveRenderer.updateMetrics(this.renderer);
                }
            };
            animate();
        }

        _onResize() {
            if (!this.renderer || !this.camera) return;
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            if (this.adaptiveRenderer) {
                this.adaptiveRenderer.applyToThreeRenderer(this.renderer, this.scene, this.camera);
            }
            this._updateHotspotScreenPositions();
        }

        // UI Helpers
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        }

        openSidebarPanel(panelId) {
            const panel = document.getElementById('viewer-sidebar-panel');
            const hotspotsView = document.getElementById('panel-content-hotspots');
            const annotationsView = document.getElementById('panel-content-annotations');
            const titleEl = document.getElementById('viewer-panel-title');

            if (panel) panel.classList.add('open');
            if (hotspotsView) hotspotsView.style.display = panelId === 'hotspots' ? 'flex' : 'none';
            if (annotationsView) annotationsView.style.display = panelId === 'annotations' ? 'flex' : 'none';
            if (titleEl) titleEl.textContent = panelId === 'hotspots' ? 'Pontos de Interesse' : 'Comentários do Cliente';
        }

        closeSidebarPanel() {
            const panel = document.getElementById('viewer-sidebar-panel');
            if (panel) panel.classList.remove('open');
        }

        toggleHotspotsList() {
            const panel = document.getElementById('viewer-sidebar-panel');
            if (panel && panel.classList.contains('open')) {
                this.closeSidebarPanel();
            } else {
                this.openSidebarPanel('hotspots');
            }
        }

        togglePopover(popoverId) {
            const pop = document.getElementById(`viewer-popover-${popoverId}`);
            if (pop) {
                const isOpen = pop.classList.contains('open');
                document.querySelectorAll('.viewer-popover').forEach(p => p.classList.remove('open'));
                if (!isOpen) pop.classList.add('open');
            }
        }

        closePopover(popoverId) {
            const pop = document.getElementById(`viewer-popover-${popoverId}`);
            if (pop) pop.classList.remove('open');
        }

        toggleTelemetry() {
            const hud = document.getElementById('viewer-telemetry-hud');
            if (hud) hud.classList.toggle('open');
        }

        _showToast(msg) {
            const toast = document.getElementById('viewer-toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2800);
        }

        _bindUIEvents() {
            if (window.lucide) window.lucide.createIcons();
            // Close popovers on click outside
            window.addEventListener('click', (e) => {
                if (!e.target.closest('.viewer-dock-btn') && !e.target.closest('.viewer-popover')) {
                    document.querySelectorAll('.viewer-popover').forEach(p => p.classList.remove('open'));
                }
            });
        }
    }

    return new ClientViewer();
}));
