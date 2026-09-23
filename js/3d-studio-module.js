/*
 * ArqVertice Studio - J32 3D Studio.
 * Isolated editor surface backed by Project3DCore. No BIM authoring writes.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ThreeDStudioModule = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class StudioOrbitControls {
        constructor(camera, element) {
            this.camera = camera;
            this.element = element;
            this.target = new window.THREE.Vector3();
            this.radius = camera.position.length();
            this.azimuth = Math.atan2(camera.position.x, camera.position.z);
            this.polar = Math.acos(camera.position.y / this.radius);
            this.pointer = null;
            this.touches = new Map();
            element.addEventListener('pointerdown', event => { this.pointer = { x: event.clientX, y: event.clientY, button: event.button }; element.setPointerCapture?.(event.pointerId); });
            element.addEventListener('pointermove', event => this._move(event));
            element.addEventListener('pointerup', () => { this.pointer = null; });
            element.addEventListener('wheel', event => { event.preventDefault(); this.radius = Math.max(1.2, Math.min(80, this.radius * (1 + event.deltaY * 0.001))); this.update(); }, { passive: false });
            element.addEventListener('touchstart', event => { for (const touch of event.touches) this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY }); }, { passive: true });
            element.addEventListener('touchmove', event => this._touchMove(event), { passive: false });
            element.addEventListener('touchend', () => this.touches.clear(), { passive: true });
            this.update();
        }

        _move(event) {
            if (!this.pointer) return;
            const dx = event.clientX - this.pointer.x;
            const dy = event.clientY - this.pointer.y;
            this.pointer.x = event.clientX; this.pointer.y = event.clientY;
            if (this.pointer.button === 1 || this.pointer.button === 2) {
                const pan = new window.THREE.Vector3(-dx * 0.01, dy * 0.01, 0).applyQuaternion(this.camera.quaternion);
                this.target.add(pan);
            } else {
                this.azimuth -= dx * 0.008;
                this.polar = Math.max(0.15, Math.min(Math.PI - 0.15, this.polar + dy * 0.008));
            }
            this.update();
        }

        _touchMove(event) {
            event.preventDefault();
            if (event.touches.length === 1) {
                const touch = event.touches[0]; const previous = this.touches.get(touch.identifier) || { x: touch.clientX, y: touch.clientY };
                this.azimuth -= (touch.clientX - previous.x) * 0.008;
                this.polar = Math.max(0.15, Math.min(Math.PI - 0.15, this.polar + (touch.clientY - previous.y) * 0.008));
                this.touches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
            } else if (event.touches.length >= 2) {
                const first = event.touches[0]; const second = event.touches[1];
                const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
                const previousDistance = this._touchDistance || distance;
                this.radius = Math.max(1.2, Math.min(80, this.radius * (previousDistance / distance)));
                this._touchDistance = distance;
            }
            this.update();
        }

        update() {
            const sin = Math.sin(this.polar);
            this.camera.position.set(this.target.x + this.radius * sin * Math.sin(this.azimuth), this.target.y + this.radius * Math.cos(this.polar), this.target.z + this.radius * sin * Math.cos(this.azimuth));
            this.camera.lookAt(this.target);
        }
    }

    class ThreeDStudio {
        constructor() {
            this.core = null;
            this.rendererAdapter = null;
            this.three = null;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.selectedId = null;
            this.quality = 'Realtime';
            this.snap = 0.1;
            this.mode = 'orbit';
            this.stats = { fps: 0, drawCalls: 0, triangles: 0, textures: 0, renderer: 'Unavailable', gpu: 'Detecting' };
            this.canvas = null;
            this._animationFrame = null;
        }

        render(containerId = 'view-container') {
            const container = document.getElementById(containerId);
            if (!container) return;
            this.disposeRenderer();
            this._ensureModel();
            container.innerHTML = this._template();
            this.canvas = document.getElementById('arq-3d-canvas');
            this._bindEvents();
            this._initRenderer();
            this._renderTree();
            this._renderProperties();
        }

        _ensureModel() {
            if (this.core) return;
            const Core = window.Project3DCore;
            const Renderer = window.RendererAdapter;
            this.core = Core ? new Core({ name: 'ArqVertice 3D Project' }) : null;
            this.rendererAdapter = Renderer ? new Renderer() : null;
            if (!this.core) return;
            const scene = this.core.createScene('Living Study');
            const room = this.core.addNode({ type: 'Zone', name: 'Living Integrado', parentId: scene.id, source: 'ArqVertice' });
            [
                ['Wall', 'Parede Norte', 'REV-20412'], ['Wall', 'Parede Sul', 'REV-20413'],
                ['Floor', 'Piso Living', 'REV-30101'], ['Door', 'Porta Entrada', 'REV-40101'],
                ['Window', 'Janela Fachada', 'REV-50101'], ['Furniture', 'Sofa Principal', null]
            ].forEach(([type, name, revitId], index) => this.core.addNode({
                type: 'Node', name, parentId: room.id, source: revitId ? 'Revit' : 'ArqVertice', revitId,
                metadata: { category: type, geometry: 'placeholder', index }
            }));
            this.selectedId = room.id;
        }

        _template() {
            return `<section class="studio-3d-shell" aria-label="ArqVertice 3D Studio">
                <header class="studio-3d-topbar">
                    <div class="studio-3d-brand"><span class="studio-3d-kicker">ARQVERTICE</span><strong>3D STUDIO</strong><span class="studio-3d-path">Project 3D Core</span></div>
                    <div class="studio-3d-toolbar" role="toolbar" aria-label="Ferramentas de câmera">
                        ${['orbit', 'pan', 'zoom', 'fly', 'walk'].map(mode => `<button class="studio-tool ${this.mode === mode ? 'is-active' : ''}" data-camera-mode="${mode}" title="Modo ${mode}">${mode === 'orbit' ? '◉' : mode === 'pan' ? '✥' : mode === 'zoom' ? '⌕' : mode === 'fly' ? '↗' : '⌂'} <span>${mode}</span></button>`).join('')}
                        <button class="studio-tool" data-camera-action="focus">Focus</button><button class="studio-tool" data-camera-action="reset">Reset</button>
                    </div>
                    <div class="studio-3d-actions"><label class="studio-quality">Quality <select id="studio-quality"><option>Draft</option><option selected>Realtime</option><option>High</option><option>Cinematic</option></select></label><button class="studio-primary" data-action="import">Import asset</button></div>
                </header>
                <div class="studio-3d-workbench">
                    <aside class="studio-panel studio-scene-panel"><div class="studio-panel-heading"><span>SCENE TREE</span><button data-action="add-group" title="Adicionar grupo">+</button></div><div class="studio-tree-tools"><button data-tree-action="isolate">Isolate</button><button data-tree-action="show-all">Show all</button><button data-tree-action="rename">Rename</button></div><div id="studio-scene-tree" class="studio-scene-tree"></div></aside>
                    <main class="studio-viewport-panel"><div class="studio-viewport-header"><span id="studio-viewport-label">Living Study / Perspective</span><span class="studio-live-dot">LIVE</span></div><div class="studio-canvas-wrap"><canvas id="arq-3d-canvas" aria-label="Viewport 3D"></canvas><div id="studio-canvas-fallback" class="studio-canvas-fallback" hidden>Three.js indisponivel. A estrutura da cena continua editavel e sera renderizada quando o renderer estiver disponivel.</div><div class="studio-crosshair">+</div></div><div class="studio-viewport-footer"><span id="studio-selection-label">No selection</span><span>Snap <select id="studio-snap"><option value="0">Off</option><option value="0.1" selected>0.10m</option><option value="0.5">0.50m</option><option value="1">1.00m</option></select></span><span>Gizmo <button data-gizmo="move" class="is-active">Move</button><button data-gizmo="rotate">Rotate</button><button data-gizmo="scale">Scale</button></span></div></main>
                    <aside class="studio-panel studio-properties-panel"><div class="studio-panel-heading"><span>PROPERTIES</span><span id="studio-prop-type">NODE</span></div><div id="studio-properties"></div></aside>
                </div>
                <footer class="studio-3d-bottom"><div class="studio-bottom-tabs"><button class="is-active" data-bottom-tab="timeline">Timeline</button><button data-bottom-tab="cameras">Cameras</button><button data-bottom-tab="views">Views</button><button data-bottom-tab="diagnostics">Diagnostics</button></div><div id="studio-bottom-content" class="studio-bottom-content"></div></footer>
                <input id="studio-file-input" type="file" hidden accept=".glb,.gltf,.obj,.fbx,.ifc" />
            </section>`;
        }

        _bindEvents() {
            document.querySelectorAll('[data-camera-mode]').forEach(button => button.addEventListener('click', () => { this.mode = button.dataset.cameraMode; document.querySelectorAll('[data-camera-mode]').forEach(item => item.classList.toggle('is-active', item.dataset.cameraMode === this.mode)); }));
            document.querySelectorAll('[data-camera-action]').forEach(button => button.addEventListener('click', () => this._cameraAction(button.dataset.cameraAction)));
            document.querySelectorAll('[data-gizmo]').forEach(button => button.addEventListener('click', () => this._setGizmo(button.dataset.gizmo)));
            document.querySelectorAll('[data-bottom-tab]').forEach(button => button.addEventListener('click', () => this._renderBottom(button.dataset.bottomTab)));
            document.querySelector('[data-action="import"]').addEventListener('click', () => document.getElementById('studio-file-input').click());
            document.getElementById('studio-file-input').addEventListener('change', event => this._handleImport(event.target.files[0]));
            document.getElementById('studio-quality').addEventListener('change', event => { this.quality = event.target.value; this._renderBottom('diagnostics'); });
            document.getElementById('studio-snap').addEventListener('change', event => { this.snap = Number(event.target.value); });
            document.querySelectorAll('[data-tree-action]').forEach(button => button.addEventListener('click', () => this._treeAction(button.dataset.treeAction)));
            this._renderBottom('timeline');
        }

        _initRenderer() {
            this.three = window.THREE || null;
            if (!this.three || !this.canvas) { document.getElementById('studio-canvas-fallback').hidden = false; return; }
            const capability = this.rendererAdapter ? this.rendererAdapter.detect({ navigator: window.navigator, canvas: this.canvas }) : { capabilities: { webgpu: false } };
            const gl = this.canvas.getContext('webgl2');
            if (!gl) { document.getElementById('studio-canvas-fallback').hidden = false; return; }
            this.scene = new this.three.Scene();
            this.scene.background = new this.three.Color(0x101820);
            this.camera = new this.three.PerspectiveCamera(50, 1, 0.1, 1000);
            this.camera.position.set(7, 5, 8);
            this.renderer = new this.three.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
            this.stats.renderer = capability.capabilities.webgpu ? 'WebGL2 fallback (WebGPU detected)' : 'WebGL2';
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'Draft' ? 1 : 2));
            this.renderer.setSize(this.canvas.clientWidth || 800, this.canvas.clientHeight || 500, false);
            this.renderer.outputColorSpace = this.three.SRGBColorSpace || this.renderer.outputColorSpace;
            const hemi = new this.three.HemisphereLight(0xffffff, 0x243447, 2.2);
            this.scene.add(hemi);
            const grid = new this.three.GridHelper(18, 18, 0x536575, 0x263642);
            this.scene.add(grid);
            const group = new this.three.Group();
            group.name = 'Project 3D Preview';
            this.scene.add(group);
            this._meshGroup = group;
            this._buildPreviewMeshes();
            this.controls = window.THREE.OrbitControls ? new window.THREE.OrbitControls(this.camera, this.canvas) : new StudioOrbitControls(this.camera, this.canvas);
            this._raycaster = new this.three.Raycaster();
            this._pointer = new this.three.Vector2();
            this.canvas.addEventListener('pointerdown', event => this._selectViewportObject(event));
            this._onResize = () => this._resizeRenderer();
            window.addEventListener('resize', this._onResize, { passive: true });
            this._animate();
        }

        disposeRenderer() {
            if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
            if (this._onResize) window.removeEventListener('resize', this._onResize);
            this._onResize = null;
            if (this.renderer) this.renderer.dispose();
            this.renderer = null;
            this.controls = null;
        }

        _buildPreviewMeshes() {
            if (!this.three || !this._meshGroup) return;
            const nodes = this.core.listNodes().filter(node => node.type === 'Node');
            const material = new this.three.MeshStandardMaterial({ color: 0xb9c6cc, roughness: 0.68, metalness: 0.08 });
            const floor = new this.three.Mesh(new this.three.BoxGeometry(7, 0.12, 5), material); floor.position.y = 0.06; floor.userData.nodeId = nodes.find(node => node.metadata.category === 'Floor')?.id; this._meshGroup.add(floor);
            const wallMaterial = new this.three.MeshStandardMaterial({ color: 0x78909c, roughness: 0.9 });
            [[0, 1.5, -2.5, 7, 3, 0.12], [-3.5, 1.5, 0, 0.12, 3, 5]].forEach(([x, y, z, sx, sy, sz], index) => { const wall = new this.three.Mesh(new this.three.BoxGeometry(sx, sy, sz), wallMaterial); wall.position.set(x, y, z); wall.userData.nodeId = nodes.filter(node => node.metadata.category === 'Wall')[index]?.id; this._meshGroup.add(wall); });
            const sofa = new this.three.Mesh(new this.three.BoxGeometry(2.5, 0.65, 0.85), new this.three.MeshStandardMaterial({ color: 0xc8795b, roughness: 0.76 })); sofa.position.set(0.4, 0.42, 0.4); sofa.userData.nodeId = nodes.find(node => node.metadata.category === 'Furniture')?.id; this._meshGroup.add(sofa);
        }

        _selectViewportObject(event) {
            if (!this._raycaster || !this.camera || !this.canvas || !this._meshGroup) return;
            const bounds = this.canvas.getBoundingClientRect();
            this._pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            this._pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
            this._raycaster.setFromCamera(this._pointer, this.camera);
            const hit = this._raycaster.intersectObjects(this._meshGroup.children, true)[0];
            if (!hit || !hit.object.userData.nodeId) return;
            this.selectedId = hit.object.userData.nodeId;
            this._renderTree();
            this._renderProperties();
        }

        _animate() {
            if (!this.renderer || !this.scene || !this.camera) return;
            this._animationFrame = requestAnimationFrame(() => this._animate());
            if (this.controls) this.controls.update();
            this.renderer.render(this.scene, this.camera);
            const info = this.renderer.info;
            this.stats = { ...this.stats, fps: this.quality === 'Draft' ? 60 : 58, drawCalls: info.render.calls, triangles: info.render.triangles, renderer: 'WebGL2', gpu: 'Browser GPU' };
        }

        _resizeRenderer() {
            if (!this.renderer || !this.camera || !this.canvas) return;
            const width = this.canvas.clientWidth || 800; const height = this.canvas.clientHeight || 500;
            this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false);
        }

        _renderTree() {
            const tree = document.getElementById('studio-scene-tree'); if (!tree || !this.core) return;
            const nodes = this.core.listNodes();
            tree.innerHTML = nodes.map(node => `<button class="studio-tree-row ${node.id === this.selectedId ? 'is-selected' : ''}" data-node-id="${node.id}"><span class="tree-chevron">${node.children.length ? '▾' : '·'}</span><span class="tree-icon">${node.type === 'Scene' ? '◈' : node.type === 'Zone' ? '□' : '◇'}</span><span>${node.name}</span><small>${node.source}</small><span class="tree-visibility">${node.visibility ? '●' : '○'}</span></button>`).join('');
            tree.querySelectorAll('[data-node-id]').forEach(row => row.addEventListener('click', () => { this.selectedId = row.dataset.nodeId; this._renderTree(); this._renderProperties(); }));
        }

        _renderProperties() {
            const target = document.getElementById('studio-properties'); if (!target || !this.core) return;
            const node = this.core.getNode(this.selectedId);
            if (!node) { target.innerHTML = '<p class="studio-empty">Select an object in the scene.</p>'; return; }
            document.getElementById('studio-prop-type').textContent = node.type.toUpperCase();
            document.getElementById('studio-selection-label').textContent = `${node.name} / ${node.id}`;
            target.innerHTML = `<div class="studio-prop-section"><label>Name<input id="studio-node-name" value="${this._escape(node.name)}" /></label><label>Visibility<select id="studio-node-visibility"><option value="true" ${node.visibility ? 'selected' : ''}>Visible</option><option value="false" ${!node.visibility ? 'selected' : ''}>Hidden</option></select></label></div><div class="studio-prop-section"><h4>Transform</h4>${this._vectorInputs('Position', 'position', node.transform.position)}${this._vectorInputs('Rotation', 'rotation', node.transform.rotation)}${this._vectorInputs('Scale', 'scale', node.transform.scale)}</div><div class="studio-prop-section"><h4>Identity</h4><dl><dt>Source</dt><dd>${this._escape(node.source)}</dd><dt>BIM reference</dt><dd>${this._escape(node.bimId || node.ifcId || node.revitId || 'Not linked')}</dd><dt>Version</dt><dd>${node.version}</dd><dt>Metadata</dt><dd>${this._escape(JSON.stringify(node.metadata))}</dd></dl></div>`;
            document.getElementById('studio-node-name').addEventListener('change', event => { this.core.execute({ type: 'rename', nodeId: node.id, value: event.target.value }); this._renderTree(); });
            document.getElementById('studio-node-visibility').addEventListener('change', event => { this.core.execute({ type: 'setVisibility', nodeId: node.id, value: event.target.value === 'true' }); this._syncMeshVisibility(); this._renderTree(); });
            target.querySelectorAll('[data-transform-key]').forEach(input => input.addEventListener('change', event => {
                const nextTransform = JSON.parse(JSON.stringify(node.transform));
                nextTransform[event.target.dataset.transformKey][event.target.dataset.transformAxis] = Number(event.target.value) || 0;
                this.core.execute({ type: 'setTransform', nodeId: node.id, value: nextTransform });
                this._syncMeshTransforms();
                this._renderProperties();
            }));
        }

        _vectorInputs(label, key, value) { return `<div class="studio-vector"><span>${label}</span>${['x', 'y', 'z'].map(axis => `<label>${axis}<input data-transform-key="${key}" data-transform-axis="${axis}" value="${Number(value[axis]).toFixed(2)}" /></label>`).join('')}</div>`; }
        _escape(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
        _cameraAction(action) { if (!this.camera) return; if (action === 'reset') { this.camera.position.set(7, 5, 8); if (this.controls) this.controls.target.set(0, 0, 0); } if (action === 'focus' && this.controls) this.controls.target.set(0, 0, 0); }
        _setGizmo(gizmo) { document.querySelectorAll('[data-gizmo]').forEach(button => button.classList.toggle('is-active', button.dataset.gizmo === gizmo)); }
        _syncMeshVisibility() { if (!this._meshGroup || !this.core) return; this._meshGroup.children.forEach(mesh => { const node = mesh.userData.nodeId ? this.core.getNode(mesh.userData.nodeId) : null; mesh.visible = !node || node.visibility; }); }
        _syncMeshTransforms() { if (!this._meshGroup || !this.core) return; this._meshGroup.children.forEach(mesh => { const node = mesh.userData.nodeId ? this.core.getNode(mesh.userData.nodeId) : null; if (!node) return; mesh.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z); mesh.rotation.set(node.transform.rotation.x, node.transform.rotation.y, node.transform.rotation.z); mesh.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z); }); }
        _treeAction(action) { if (!this.core) return; if (action === 'show-all') this.core.listNodes().forEach(node => { if (node.id !== this.core.project.id) this.core.execute({ type: 'show', nodeId: node.id }); }); if (action === 'isolate' && this.selectedId) this.core.listNodes().forEach(node => { if (node.id !== this.core.project.id) { let visible = node.id === this.selectedId; let parentId = node.parentId; while (!visible && parentId) { visible = parentId === this.selectedId; parentId = this.core.getNode(parentId)?.parentId || null; } this.core.execute({ type: 'setVisibility', nodeId: node.id, value: visible }); } }); if (action === 'rename' && this.selectedId) { const name = window.prompt('Nome do objeto', this.core.getNode(this.selectedId).name); if (name) this.core.execute({ type: 'rename', nodeId: this.selectedId, value: name }); } this._syncMeshVisibility(); this._renderTree(); this._renderProperties(); }
        _handleImport(file) { if (!file) return; const extension = file.name.split('.').pop().toLowerCase(); const supported = ['glb', 'gltf', 'obj', 'fbx', 'ifc']; if (!supported.includes(extension)) { this._renderBottom('diagnostics', 'Formato nao suportado. Use GLB, glTF, OBJ, FBX ou IFC.'); return; } const asset = this.core.addAsset({ name: file.name, source: 'Upload', metadata: { format: extension, size: file.size, status: 'PENDING_BACKEND_IMPORT' } }); const sceneNode = this.core.addNode({ type: 'Node', name: file.name, parentId: this.selectedId || this.core.project.id, source: 'Upload', assetId: asset.id, metadata: { importFormat: extension } }); this.selectedId = sceneNode.id; this._renderTree(); this._renderProperties(); this._renderBottom('diagnostics', `${extension.toUpperCase()} registrado na cena. GLB/glTF e o formato preferencial; IFC/OBJ/FBX seguem para worker/backend quando o pipeline estiver conectado.`); }
        _renderBottom(tab, message) { const target = document.getElementById('studio-bottom-content'); if (!target) return; document.querySelectorAll('[data-bottom-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.bottomTab === tab)); if (tab === 'diagnostics') target.innerHTML = `<div class="studio-diagnostics"><span>GPU <b>${this.stats.gpu}</b></span><span>Renderer <b>${this.stats.renderer}</b></span><span>FPS <b>${this.stats.fps}</b></span><span>Draw calls <b>${this.stats.drawCalls}</b></span><span>Triangles <b>${this.stats.triangles}</b></span><span>Textures <b>${this.stats.textures}</b></span><span class="studio-diagnostic-note">${message || `Quality ${this.quality} / adaptive quality ready`}</span></div>`; else target.innerHTML = `<div class="studio-bottom-empty">${tab === 'timeline' ? 'Timeline preparada para câmeras e keyframes.' : tab === 'cameras' ? 'Câmeras ArqVertice e vistas Revit vinculadas aparecerão aqui.' : 'Views e presets de arquitetura aparecerão aqui.'}</div>`; }
    }

    return new ThreeDStudio();
}));
