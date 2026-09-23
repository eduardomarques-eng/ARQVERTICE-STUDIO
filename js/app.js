/**
 * ============================================================================
 * ARQVERTICE STUDIO — CONTROLADOR PRINCIPAL DA APLICAÇÃO (StudioApp)
 * Roteador Central, Gestor de Modais, Uploads Classificados e Autosave
 * ============================================================================
 */

const StudioApp = {
  activeView: 'dashboard', // 'dashboard', 'projects', 'workspace', 'environment', '3d'

  init() {
    console.log('Inicializando ArqVertice Studio...');
    StudioState.init();
    this.initTheme();
    this.initGlobalEvents();

    // Roteamento inicial
    const state = StudioState.data;
    if (window.location && window.location.pathname === '/3d') {
      this.navigateTo('3d');
    } else if (state.currentView) {
      this.navigateTo(state.currentView, state.selectedProjectId, state.activeProjectTab);
    } else {
      this.navigateTo('dashboard');
    }
  },

  // --------------------------------------------------------------------------
  // ROTEAMENTO DE TELAS
  // --------------------------------------------------------------------------
  navigateTo(view, projectId, tabKey) {
    this.activeView = view;
    StudioState.data.currentView = view;

    if (projectId) {
      StudioState.data.selectedProjectId = projectId;
    }

    if (view === 'workspace' && tabKey) {
      StudioState.data.activeProjectTab = tabKey;
      StudioState.data.selectedProjectTab = tabKey;
    }

    if (view === 'environment' && tabKey) {
      StudioState.data.activeEnvironmentTab = tabKey;
    }

    // Atualizar classe ativa na Sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.classList.remove('active');
    });
    const targetNavItem = document.getElementById(`nav-${view}`);
    if (targetNavItem) targetNavItem.classList.add('active');

    // Fechar dropdowns abertos e menu móvel
    this.closeAllDropdowns();
    this.closeMobileSidebar();

    // Notificar o módulo de IA Contextual da mudança de tela se ativo
    if (window.ContextualAIModule && ContextualAIModule.onScreenChange) {
      ContextualAIModule.onScreenChange(view, projectId, tabKey);
    }

    // Atualizar breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current-view');
    if (breadcrumbCurrent) {
      switch (view) {
        case 'dashboard': breadcrumbCurrent.textContent = 'Painel Geral'; break;
        case 'projects': breadcrumbCurrent.textContent = 'Projetos & Obras'; break;
        case 'workspace': breadcrumbCurrent.textContent = 'Workspace do Projeto'; break;
        case 'environment': breadcrumbCurrent.textContent = 'Ambientes & 3D'; break;
        case 'revit': breadcrumbCurrent.textContent = 'Revit BIM Workspace'; break;
        case '3d': breadcrumbCurrent.textContent = 'ArqVértice 3D Studio'; break;
        default: breadcrumbCurrent.textContent = 'Painel Geral';
      }
    }

    // Renderizar a visão
    switch (view) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'projects':
        renderProjectsList();
        break;
      case 'workspace':
        renderProjectWorkspace();
        break;
      case 'environment':
        renderEnvironmentWorkspace();
        break;
      case 'revit':
        if (window.RevitWorkspaceModule) {
          RevitWorkspaceModule.render();
        }
        break;
      case '3d':
        if (window.ThreeDStudioModule) {
          ThreeDStudioModule.render();
        }
        break;
      default:
        renderDashboard();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Salvar estado
    StudioState.save();

    // Recriar ícones Lucide
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  openProject(projectId, tabKey) {
    this.navigateTo('workspace', projectId, tabKey || 'ambientes');
  },

  setProjectTab(tabKey) {
    StudioState.data.activeProjectTab = tabKey;
    StudioState.data.selectedProjectTab = tabKey;
    StudioState.save();
    renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  setEnvironmentTab(tabKey) {
    StudioState.data.activeEnvironmentTab = tabKey;
    StudioState.save();
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  openEnvironmentWorkspace(envId) {
    StudioState.data.selectedEnvironmentId = envId;
    this.navigateTo('environment');
  },

  openEnvironmentVisualization(envId) {
    StudioState.data.selectedEnvironmentId = envId;
    StudioState.data.activeEnvironmentTab = 'visualizacao';
    this.navigateTo('environment');
  },

  // --------------------------------------------------------------------------
  // FILTROS E BUSCA
  // --------------------------------------------------------------------------
  setSearchQuery(query) {
    StudioState.data.searchQuery = query;
    if (this.activeView === 'projects') {
      renderProjectsList();
      if (window.lucide) lucide.createIcons();
    }
  },

  setProjectFilter(status) {
    StudioState.data.projectFilterStatus = status;
    renderProjectsList();
    if (window.lucide) lucide.createIcons();
  },

  // --------------------------------------------------------------------------
  // MODAIS E FORMULÁRIOS
  // --------------------------------------------------------------------------
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-open'));
    document.body.style.overflow = '';
  },

  // --- Modal de Projeto ---
  openNewProjectModal() {
    const form = document.getElementById('project-form');
    if (form) form.reset();
    document.getElementById('project-modal-title').innerText = 'Cadastrar Novo Projeto';
    document.getElementById('project-form-id').value = '';
    
    // Preencher select de clientes
    const clientSelect = document.getElementById('proj-field-client');
    if (clientSelect) {
      clientSelect.innerHTML = StudioState.data.clients.map(c => `
        <option value="${c.id}">${escapeHTML(c.name)}</option>
      `).join('');
    }

    this.openModal('modal-project');
  },

  openEditProjectModal(projectId) {
    const project = StudioState.data.projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('project-modal-title').innerText = 'Editar Projeto';
    document.getElementById('project-form-id').value = project.id;
    document.getElementById('proj-field-name').value = project.name || '';
    document.getElementById('proj-field-location').value = project.location || '';
    document.getElementById('proj-field-typology').value = project.typology || '';
    document.getElementById('proj-field-status').value = project.status || 'Planejamento';
    document.getElementById('proj-field-area').value = project.builtAreaM2 || '';
    document.getElementById('proj-field-notes').value = project.notes || '';

    const clientSelect = document.getElementById('proj-field-client');
    if (clientSelect) {
      clientSelect.innerHTML = StudioState.data.clients.map(c => `
        <option value="${c.id}" ${c.id === project.clientId ? 'selected' : ''}>${escapeHTML(c.name)}</option>
      `).join('');
    }

    this.openModal('modal-project');
  },

  saveProjectForm(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('project-form-id').value;
    const name = document.getElementById('proj-field-name').value.trim();
    const clientId = document.getElementById('proj-field-client').value;
    const location = document.getElementById('proj-field-location').value.trim();
    const typology = document.getElementById('proj-field-typology').value;
    const status = document.getElementById('proj-field-status').value;
    const area = parseFloat(document.getElementById('proj-field-area').value) || 0;
    const notes = document.getElementById('proj-field-notes').value.trim();

    if (!name) {
      alert('Por favor, informe o nome do projeto.');
      return;
    }

    if (id) {
      // Edição
      const proj = StudioState.data.projects.find(p => p.id === id);
      if (proj) {
        proj.name = name;
        proj.clientId = clientId;
        proj.location = location;
        proj.typology = typology;
        proj.status = status;
        proj.builtAreaM2 = area;
        proj.notes = notes;
        proj.updatedAt = new Date().toISOString();
      }
    } else {
      // Novo
      const newId = 'prj-' + Date.now().toString(36);
      const newProj = {
        id: newId,
        code: 'PRJ-' + (StudioState.data.projects.length + 1).toString().padStart(2, '0'),
        clientId: clientId || StudioState.data.clients[0].id,
        name: name,
        location: location || 'Local a definir',
        plotLotBlock: '',
        zoning: '',
        typology: typology || 'Residencial Unifamiliar',
        builtAreaM2: area,
        landAreaM2: area * 1.3,
        startDate: formatDateInput(new Date()),
        expectedEndDate: '30-12-2027',
        company: 'ArqVértice • Arquitetura & Engenharia',
        status: status || 'Planejamento',
        currentStage: 'Briefing & Estudos',
        leadArchitect: 'Eduardo Marques',
        engineer: 'Luan Almeida',
        siteManager: 'Erick Santiago',
        notes: notes,
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        updatedAt: new Date().toISOString(),
        stages: [
          { key: 'cliente', label: 'Cliente', status: 'concluido' },
          { key: 'briefing', label: 'Briefing Cliente', status: 'em_andamento' },
          { key: 'briefing-tecnico', label: 'Briefing Técnico', status: 'disponivel' },
          { key: 'levantamento', label: 'Levantamento', status: 'disponivel' },
          { key: 'estudos', label: 'Estudos', status: 'disponivel' },
          { key: 'projeto', label: 'Projeto', status: 'pendente' },
          { key: 'ambientes', label: 'Ambientes', status: 'disponivel' },
          { key: 'visualizacao', label: 'Visualização', status: 'bloqueado' },
          { key: 'materiais', label: 'Materiais', status: 'bloqueado' },
          { key: 'moveis', label: 'Móveis', status: 'bloqueado' },
          { key: 'moodboards', label: 'Moodboards', status: 'bloqueado' },
          { key: 'especificacoes', label: 'Especificações', status: 'bloqueado' },
          { key: 'apresentacao', label: 'Apresentação', status: 'bloqueado' },
          { key: 'revisoes', label: 'Revisões', status: 'bloqueado' },
          { key: 'relatorios', label: 'Relatórios', status: 'disponivel' },
          { key: 'entrega', label: 'Entrega', status: 'bloqueado' },
          { key: 'cronograma', label: 'Cronograma', status: 'em_andamento' }
        ]
      };
      StudioState.data.projects.unshift(newProj);
      StudioState.data.selectedProjectId = newId;
    }

    StudioState.save();
    this.closeModal('modal-project');
    this.showToast(id ? 'Projeto atualizado com sucesso!' : 'Novo projeto cadastrado!');
    
    if (this.activeView === 'projects') renderProjectsList();
    else if (this.activeView === 'workspace') renderProjectWorkspace();
    else renderDashboard();
    if (window.lucide) lucide.createIcons();
  },

  archiveProject(projectId) {
    if (!confirm('Deseja arquivar este projeto? Ele poderá ser restaurado a qualquer momento.')) return;
    const p = StudioState.data.projects.find(x => x.id === projectId);
    if (p) {
      p.status = 'Finalizado';
      p.updatedAt = new Date().toISOString();
      StudioState.save();
      this.showToast('Projeto arquivado com sucesso.');
      if (this.activeView === 'projects') renderProjectsList();
      else this.navigateTo('projects');
    }
  },

  // --- Modal de Ambiente ---
  openNewEnvironmentModal(projectId) {
    const form = document.getElementById('env-form');
    if (form) form.reset();
    document.getElementById('env-modal-title').innerText = 'Cadastrar Novo Ambiente';
    document.getElementById('env-form-id').value = '';
    document.getElementById('env-form-project-id').value = projectId || StudioState.data.selectedProjectId;
    this.openModal('modal-environment');
  },

  openEditEnvironmentModal(envId) {
    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env) return;

    document.getElementById('env-modal-title').innerText = 'Editar Ambiente';
    document.getElementById('env-form-id').value = env.id;
    document.getElementById('env-form-project-id').value = env.projectId;
    document.getElementById('env-field-name').value = env.name || '';
    document.getElementById('env-field-type').value = env.type || 'SALA';
    document.getElementById('env-field-area').value = env.areaM2 || '';
    document.getElementById('env-field-floor').value = env.floorLevel || 'Térreo';
    document.getElementById('env-field-status').value = env.status || 'Não iniciado';
    document.getElementById('env-field-progress').value = env.progress || 0;
    document.getElementById('env-field-desc').value = env.description || '';
    document.getElementById('env-field-obj').value = env.objective || '';

    this.openModal('modal-environment');
  },

  saveEnvironmentForm(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('env-form-id').value;
    const projectId = document.getElementById('env-form-project-id').value || StudioState.data.selectedProjectId;
    const name = document.getElementById('env-field-name').value.trim();
    const type = document.getElementById('env-field-type').value;
    const area = parseFloat(document.getElementById('env-field-area').value) || 0;
    const floor = document.getElementById('env-field-floor').value;
    const status = document.getElementById('env-field-status').value;
    const progress = parseInt(document.getElementById('env-field-progress').value, 10) || 0;
    const desc = document.getElementById('env-field-desc').value.trim();
    const obj = document.getElementById('env-field-obj').value.trim();

    if (!name) {
      alert('Informe o nome do ambiente (ex: Suíte Master).');
      return;
    }

    if (id) {
      const env = StudioState.data.environments.find(x => x.id === id);
      if (env) {
        env.name = name;
        env.type = type;
        env.areaM2 = area;
        env.floorLevel = floor;
        env.status = status;
        env.progress = progress;
        env.description = desc;
        env.objective = obj;
        env.updatedAt = new Date().toISOString();
      }
    } else {
      const newEnv = {
        id: 'amb-' + Date.now().toString(36),
        projectId: projectId,
        name: name,
        type: type,
        floorLevel: floor,
        areaM2: area,
        ceilingHeightM: 3.00,
        status: status || 'Não iniciado',
        currentVersion: 'V01',
        progress: progress,
        description: desc || 'Ambiente cadastrado no projeto arquitetônico.',
        objective: obj || 'Atender ao programa de necessidades dos clientes.',
        style: 'Contemporâneo',
        approvedRenderUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
        lastDecision: 'Criação do ambiente no projeto.',
        pendingIssues: [],
        updatedAt: new Date().toISOString(),
        locks: {
          geometry: false,
          layout: false,
          camera: false,
          openings: false,
          materials: false,
          lighting: false,
          furniture: false,
          decor: false,
          landscape: false
        },
        versions: [
          { version: 'V01', date: formatDateInput(new Date()), status: 'Em desenvolvimento', note: 'Concepção inicial do ambiente.' }
        ],
        references: []
      };
      StudioState.data.environments.push(newEnv);
      StudioState.data.selectedEnvironmentId = newEnv.id;
    }

    StudioState.save();
    this.closeModal('modal-environment');
    this.showToast(id ? 'Ambiente atualizado!' : 'Novo ambiente cadastrado!');

    if (this.activeView === 'environment') renderEnvironmentWorkspace();
    else if (this.activeView === 'workspace') renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  duplicateEnvironment(envId) {
    const orig = StudioState.data.environments.find(e => e.id === envId);
    if (!orig) return;

    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'amb-' + Date.now().toString(36);
    copy.name = orig.name + ' (Cópia)';
    copy.status = 'Não iniciado';
    copy.progress = 0;
    copy.currentVersion = 'V01';
    copy.updatedAt = new Date().toISOString();

    StudioState.data.environments.push(copy);
    StudioState.save();
    this.showToast('Ambiente duplicado com sucesso!');

    if (this.activeView === 'workspace') renderProjectWorkspace();
    else renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  archiveEnvironment(envId) {
    if (!confirm('Deseja arquivar este ambiente?')) return;
    StudioState.data.environments = StudioState.data.environments.filter(e => e.id !== envId);
    StudioState.save();
    this.showToast('Ambiente arquivado.');
    this.navigateTo('workspace', StudioState.data.selectedProjectId, 'ambientes');
  },

  toggleEnvLock(envId, lockKey) {
    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env) return;
    if (!env.locks) env.locks = {};
    env.locks[lockKey] = !env.locks[lockKey];
    env.updatedAt = new Date().toISOString();
    StudioState.save();
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  changeEnvironmentVersion(envId, version) {
    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env) return;
    env.currentVersion = version;
    env.updatedAt = new Date().toISOString();
    StudioState.save();
    this.showToast(`Versão ativa alterada para ${version}`);
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  createNewVersion(envId) {
    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env) return;
    const currentNum = env.versions ? env.versions.length + 1 : 1;
    const newVCode = 'V' + currentNum.toString().padStart(2, '0');
    const note = prompt(`Criar iteração ${newVCode}. Digite a nota de revisão:`, `Revisão e ajuste de especificações para ${newVCode}.`);
    if (note === null) return;

    if (!env.versions) env.versions = [];
    env.versions.push({
      version: newVCode,
      date: formatDateInput(new Date()),
      status: 'Em desenvolvimento',
      note: note || 'Nova iteração gerada.'
    });
    env.currentVersion = newVCode;
    env.updatedAt = new Date().toISOString();
    StudioState.save();
    this.showToast(`Nova versão ${newVCode} criada com sucesso!`);
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  addPendingIssue(envId) {
    const input = document.getElementById(`new-pending-input-${envId}`);
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();

    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env) return;
    if (!env.pendingIssues) env.pendingIssues = [];
    env.pendingIssues.push(text);
    env.updatedAt = new Date().toISOString();
    StudioState.save();
    input.value = '';
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  resolvePendingIssue(envId, idx) {
    const env = StudioState.data.environments.find(e => e.id === envId);
    if (!env || !env.pendingIssues) return;
    env.pendingIssues.splice(idx, 1);
    env.updatedAt = new Date().toISOString();
    StudioState.save();
    renderEnvironmentWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  // --- Modal de Tarefa do Cronograma ---
  openNewTaskModal(projectId) {
    const form = document.getElementById('task-form');
    if (form) form.reset();
    document.getElementById('task-modal-title').innerText = 'Cadastrar Nova Entrega';
    document.getElementById('task-form-id').value = '';
    document.getElementById('task-form-project-id').value = projectId || StudioState.data.selectedProjectId;
    const etapaEl = document.getElementById('task-field-etapa');
    if (etapaEl) etapaEl.value = 'projeto';
    this.openModal('modal-task');
  },

  openEditTaskModal(taskId) {
    const task = StudioState.data.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('task-modal-title').innerText = 'Editar Entrega';
    document.getElementById('task-form-id').value = task.id;
    document.getElementById('task-form-project-id').value = task.projectId;
    document.getElementById('task-field-nome').value = task.nome_tarefa || '';
    document.getElementById('task-field-disciplina').value = task.disciplina_projeto || 'Arquitetura';
    const etapaEl = document.getElementById('task-field-etapa');
    if (etapaEl) etapaEl.value = task.etapa || (StudioState.resolveTaskStage ? StudioState.resolveTaskStage(task) : 'projeto');
    document.getElementById('task-field-responsavel').value = task.responsavel || 'Eduardo Marques';
    document.getElementById('task-field-inicio').value = task.data_inicio || '';
    document.getElementById('task-field-conclusao').value = task.data_conclusao || '';
    document.getElementById('task-field-pct').value = task.porcentagem || 0;
    document.getElementById('task-field-desc').value = task.descricao || '';

    this.openModal('modal-task');
  },

  saveTaskForm(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('task-form-id').value;
    const projectId = document.getElementById('task-form-project-id').value || StudioState.data.selectedProjectId;
    const nome = document.getElementById('task-field-nome').value.trim();
    const disciplina = document.getElementById('task-field-disciplina').value;
    const etapa = (document.getElementById('task-field-etapa') ? document.getElementById('task-field-etapa').value : '') || 'projeto';
    const responsavel = document.getElementById('task-field-responsavel').value;
    const inicio = document.getElementById('task-field-inicio').value;
    const conclusao = document.getElementById('task-field-conclusao').value;
    const pct = parseInt(document.getElementById('task-field-pct').value, 10) || 0;
    const desc = document.getElementById('task-field-desc').value.trim();

    if (!nome) {
      alert('Informe o nome da entrega.');
      return;
    }

    if (id) {
      const task = StudioState.data.tasks.find(t => t.id === id);
      if (task) {
        task.nome_tarefa = nome;
        task.disciplina_projeto = disciplina;
        task.etapa = etapa;
        task.responsavel = responsavel;
        task.data_inicio = inicio;
        task.data_conclusao = conclusao;
        task.porcentagem = pct;
        task.descricao = desc;
        task.updatedAt = new Date().toISOString();
      }
    } else {
      const newTask = {
        id: 'tsk-' + Date.now().toString(36),
        projectId: projectId,
        disciplina_projeto: disciplina,
        etapa: etapa,
        nome_tarefa: nome,
        responsavel: responsavel,
        data_inicio: inicio || '01-09-2026',
        data_conclusao: conclusao || '30-10-2026',
        porcentagem: pct,
        descricao: desc,
        status: pct === 100 ? 'Concluído' : pct > 0 ? 'Em Andamento' : 'Não Iniciado',
        updatedAt: new Date().toISOString()
      };
      StudioState.data.tasks.push(newTask);
    }

    StudioState.save();
    this.closeModal('modal-task');
    this.showToast(id ? 'Tarefa atualizada!' : 'Nova entrega adicionada ao cronograma!');

    if (this.activeView === 'workspace') renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  // --- Modal de Upload Classificado (Prompt A04 item 10) ---
  openUploadModal(projectId, envId, version, defaultCategory) {
    document.getElementById('upload-field-proj-id').value = projectId || StudioState.data.selectedProjectId;
    document.getElementById('upload-field-env-id').value = envId || (StudioState.getActiveEnvironment() ? StudioState.getActiveEnvironment().id : '');
    document.getElementById('upload-field-version').value = version || 'V01';
    if (defaultCategory) {
      document.getElementById('upload-field-category').value = defaultCategory;
    }
    this.openModal('modal-upload');
  },

  handleFileUpload(e) {
    if (e) e.preventDefault();
    const projId = document.getElementById('upload-field-proj-id').value;
    const envId = document.getElementById('upload-field-env-id').value;
    const category = document.getElementById('upload-field-category').value;
    const version = document.getElementById('upload-field-version').value;
    const title = document.getElementById('upload-field-title').value.trim() || `Arquivo ${category} ${version}`;
    const fileInput = document.getElementById('upload-file-input');

    const env = StudioState.data.environments.find(x => x.id === envId);
    if (!env) {
      alert('Ambiente de destino não localizado.');
      return;
    }

    // Se houver arquivo selecionado, faz leitura local
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const fileUrl = evt.target.result;
        this.saveUploadedAsset(env, category, version, title, fileUrl);
      };
      reader.readAsDataURL(file);
    } else {
      // Usar imagem padrão de placeholder de arquitetura
      const placeholderUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
      this.saveUploadedAsset(env, category, version, title, placeholderUrl);
    }
  },

  saveUploadedAsset(env, category, version, title, fileUrl) {
    if (!env.references) env.references = [];
    env.references.unshift({
      title: title,
      category: category,
      version: version,
      url: fileUrl,
      uploadedAt: new Date().toISOString()
    });

    if (category === 'render') {
      env.approvedRenderUrl = fileUrl;
      env.currentVersion = version;
    }

    env.updatedAt = new Date().toISOString();
    StudioState.save();
    this.closeModal('modal-upload');
    this.showToast(`Upload classificado (${category.toUpperCase()} • ${version}) vinculado com sucesso!`);

    if (this.activeView === 'environment') renderEnvironmentWorkspace();
    else if (this.activeView === 'workspace') renderProjectWorkspace();
    if (window.lucide) lucide.createIcons();
  },

  // --- Lightbox de Visualização Ampliada ---
  openLightbox(imageUrl, caption) {
    const lightbox = document.getElementById('modal-lightbox');
    if (!lightbox) return;
    document.getElementById('lightbox-img').src = imageUrl;
    document.getElementById('lightbox-caption').innerText = caption || '';
    this.openModal('modal-lightbox');
  },

  // --- Modal de Relatório Executivo Oficial de Cronograma & Obras (Padrão Vercel / PDF) ---
  openReportModal() {
    const project = StudioState.getActiveProject();
    const tasks = StudioState.getProjectTasks(project ? project.id : null);
    this.populateReportData(project, tasks);
    this.openModal('modal-report');
    if (window.lucide) lucide.createIcons();
  },

  populateReportData(project, tasks) {
    const proj = project || StudioState.getActiveProject() || {};
    const taskList = tasks || StudioState.getProjectTasks(proj.id) || [];
    const client = (typeof StudioState !== 'undefined' && StudioState.getClient && proj.clientId)
      ? StudioState.getClient(proj.clientId)
      : null;

    const clienteNome = (client && client.name) || proj.clientName || 'Pedro';
    const obraNome = proj.name || 'Residência de Praia';
    const localizacao = proj.location || 'Loteamento Praia Bela, Litoral Sul';
    const loteQuadra = proj.plotLotBlock || 'Lote 14, Quadra B';
    const areaConst = proj.builtAreaM2 ? `${Number(proj.builtAreaM2).toFixed(2).replace('.', ',')} m²` : '385,00 m²';
    const areaTerreno = proj.landAreaM2 
      ? `${Number(proj.landAreaM2).toFixed(2).replace('.', ',')} m²${proj.landDimensions ? ` (${proj.landDimensions})` : ''}` 
      : '450,00 m² (15m x 30m)';
    const zoneamento = proj.zoning || 'Zona Residencial (ZR-1)';
    const prazos = (proj.startDate || proj.expectedEndDate)
      ? `${proj.startDate || '12-06-2026'} a ${proj.expectedEndDate || '30-11-2026'}`
      : '12/06/2026 a 30/11/2026';

    // 1. Preenchimento da Ficha Técnica (Seção 1)
    const elObra = document.getElementById('rep-cad-obra');
    const elCliente = document.getElementById('rep-cad-cliente');
    const elLocal = document.getElementById('rep-cad-local');
    const elLote = document.getElementById('rep-cad-lote');
    const elAreaConst = document.getElementById('rep-cad-areaconst');
    const elAreaTerreno = document.getElementById('rep-cad-areaterreno');
    const elZona = document.getElementById('rep-cad-zona');
    const elPrazos = document.getElementById('rep-cad-prazos');
    const elSigCliente = document.getElementById('rep-sig-cliente');

    if (elObra) elObra.textContent = obraNome;
    if (elCliente) elCliente.textContent = clienteNome;
    if (elLocal) elLocal.textContent = localizacao;
    if (elLote) elLote.textContent = loteQuadra;
    if (elAreaConst) elAreaConst.textContent = areaConst;
    if (elAreaTerreno) elAreaTerreno.textContent = areaTerreno;
    if (elZona) elZona.textContent = zoneamento;
    if (elPrazos) elPrazos.textContent = prazos;
    if (elSigCliente) elSigCliente.textContent = clienteNome;

    // Emissão
    const now = new Date();
    const dataStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const elEmissao = document.getElementById('report-date-emission');
    if (elEmissao) elEmissao.textContent = dataStr;

    // 2. Cálculo das Disciplinas e Fases
    const phaseDefinitions = [
      { key: 'arq',  disciplina: 'Arquitetura',    nome: 'Arquitetura',        responsavel: 'Eduardo' },
      { key: '3d',   disciplina: '3D',             nome: 'Projeto 3D',         responsavel: 'Eduardo' },
      { key: 'est',  disciplina: 'Estrutura',      nome: 'Projeto Estrutural', responsavel: 'Luan' },
      { key: 'comp', disciplina: 'Complementares', nome: 'Complementares',     responsavel: 'Eduardo' },
      { key: 'obr',  disciplina: 'Obras',          nome: 'Execução da Obra',   responsavel: 'Erick' }
    ];

    const phases = phaseDefinitions.map(def => {
      const pTasks = taskList.filter(t => t.disciplina_projeto === def.disciplina);
      const sum = pTasks.reduce((acc, t) => acc + (Number(t.porcentagem) || 0), 0);
      const pct = pTasks.length > 0 ? Math.round(sum / pTasks.length) : 0;
      const concluidas = pTasks.filter(t => (Number(t.porcentagem) || 0) === 100).length;
      let estado = 'Aguardando';
      if (pTasks.length > 0 && pct >= 100) estado = 'Concluída';
      else if (pct > 0) estado = 'Em Andamento';

      return {
        ...def,
        tasks: pTasks,
        pct,
        concluidas,
        total: pTasks.length,
        estado,
        atual: false
      };
    });

    const comEtapas = phases.filter(f => f.total > 0);
    const faseAtual = comEtapas.find(f => f.pct < 100) || comEtapas[comEtapas.length - 1];
    if (faseAtual) faseAtual.atual = true;

    // Cálculo Global
    const totalCount = taskList.length;
    const sumAll = taskList.reduce((acc, t) => acc + (Number(t.porcentagem) || 0), 0);
    const globalAvg = totalCount > 0 ? Math.round(sumAll / totalCount) : 0;
    const globalDone = taskList.filter(t => (Number(t.porcentagem) || 0) === 100).length;

    // Status Geral Badge
    const elDocStatus = document.getElementById('report-doc-status');
    if (elDocStatus) {
      if (globalAvg >= 100) {
        elDocStatus.textContent = '100% Concluído';
        elDocStatus.style.background = '#dcfce7';
        elDocStatus.style.color = '#15803d';
        elDocStatus.style.borderColor = '#86efac';
      } else {
        elDocStatus.textContent = `Em Andamento (${globalAvg}%)`;
        elDocStatus.style.background = '#dbeafe';
        elDocStatus.style.color = '#1e3a8a';
        elDocStatus.style.borderColor = '#93c5fd';
      }
    }

    // 3. Renderização da Faixa de Fases Impressa (Seção 3)
    const elFaseTrack = document.getElementById('report-fase-track');
    if (elFaseTrack) {
      const printColors = {
        arq:  { forte: '#6d28d9', claro: '#ede9fe' },
        '3d': { forte: '#9d174d', claro: '#fce7f3' },
        est:  { forte: '#b45309', claro: '#fef3c7' },
        comp: { forte: '#0e7490', claro: '#cffafe' },
        obr:  { forte: '#c2410c', claro: '#ffedd5' }
      };

      elFaseTrack.innerHTML = phases.map((f, i) => {
        const cor = printColors[f.key] || printColors.arq;
        const destaque = f.atual;
        const marcador = destaque
          ? `<div style="background:${cor.forte}; color:#ffffff; font-size:0.55rem; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; text-align:center; padding:2px 0; border-radius:3px; margin-bottom:5px;">ESTAMOS AQUI</div>`
          : '<div style="height:15px; margin-bottom:5px;"></div>';

        return `
          <div style="background:${destaque ? cor.claro : '#ffffff'}; border:${destaque ? '2.5px' : '1.5px'} solid ${cor.forte}; border-radius:7px; padding:8px 9px;">
            ${marcador}
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <span style="font-size:0.6rem; font-weight:900; color:${cor.forte};">${i + 1}. ${escapeHTML(f.nome)}</span>
            </div>
            <div style="font-size:1.05rem; font-weight:900; color:${cor.forte}; line-height:1.1; margin:2px 0 4px;">${f.pct}%</div>
            <div style="background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;">
              <div style="width:${f.pct}%; background:${cor.forte}; height:100%;"></div>
            </div>
            <div style="font-size:0.6rem; font-weight:800; color:#334155; margin-top:4px;">${escapeHTML(f.estado)}</div>
            <div style="font-size:0.575rem; font-weight:600; color:#475569;">${f.concluidas} de ${f.total} ${f.total === 1 ? 'etapa' : 'etapas'}</div>
          </div>
        `;
      }).join('');
    }

    // 4. Parecer Técnico Executivo do Cronograma (Seção 4)
    const elParecer = document.getElementById('report-parecer');
    if (elParecer) {
      const concluidas = taskList.filter(t => (Number(t.porcentagem) || 0) === 100);
      const emCurso = taskList
        .filter(t => {
          const v = Number(t.porcentagem) || 0;
          return v > 0 && v < 100;
        })
        .sort((a, b) => (Number(b.porcentagem) || 0) - (Number(a.porcentagem) || 0));
      const aIniciar = taskList
        .filter(t => (Number(t.porcentagem) || 0) === 0)
        .sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao));
      const atrasadas = taskList.filter(t => {
        if ((Number(t.porcentagem) || 0) === 100) return false;
        return getDaysRemaining(t.data_conclusao) < 0;
      });

      const lista = (itens, comPct) => itens
        .map(t => `${escapeHTML(t.descricao_etapa || t.nome_tarefa)}${comPct ? ` (${t.porcentagem}%)` : ''}`)
        .join(', ');

      const blocos = [];
      if (concluidas.length) {
        blocos.push(`<div>• <strong style="color:#14532d;">Etapas concluídas (100%):</strong> ${lista(concluidas, false)}.</div>`);
      }
      if (emCurso.length) {
        blocos.push(`<div>• <strong style="color:#1e3a8a;">Etapas em desenvolvimento ativo:</strong> ${lista(emCurso, true)}.</div>`);
      }
      if (aIniciar.length) {
        blocos.push(`<div>• <strong style="color:#c2410c;">Próximas fases programadas:</strong> ${lista(aIniciar.slice(0, 6), false)}.</div>`);
      }
      if (atrasadas.length) {
        blocos.push(`<div>• <strong style="color:#b91c1c;">Entregas com prazo vencido:</strong> ${lista(atrasadas, true)}. Estas etapas estão em regime de recuperação de prazo.</div>`);
      }

      let fraseResumo = `O empreendimento está com ${globalAvg}% de avanço geral, com ${globalDone} de ${totalCount} entregas concluídas.`;
      if (faseAtual) {
        fraseResumo += ` A fase em curso é ${faseAtual.nome}, com ${faseAtual.pct}% executado (${faseAtual.concluidas} de ${faseAtual.total} etapas fechadas).`;
      }
      if (atrasadas.length > 0) {
        fraseResumo += ` ${atrasadas.length} entrega(s) requerem atenção no prazo.`;
      } else {
        fraseResumo += ' Não há entregas com prazo vencido.';
      }

      elParecer.innerHTML = `
        <p style="margin:0 0 8px 0; color:#020617;">
          Prezado cliente <strong style="color:#020617;">${escapeHTML(clienteNome)}</strong>,
          o presente relatório consolida o acompanhamento físico de projetos e o planejamento executivo da sua
          <strong style="color:#020617;">${escapeHTML(obraNome)}</strong>.
        </p>
        <p style="margin:0 0 8px 0; color:#0f172a; font-weight:600;">${escapeHTML(fraseResumo)}</p>
        <div style="color:#0f172a; display:flex; flex-direction:column; gap:4px;">${blocos.join('')}</div>
      `;
    }

    // 5. Atualização dos KPIs por Disciplina (Seção 5)
    const elTotalVal = document.getElementById('report-kpi-total-val');
    const elTotalBar = document.getElementById('report-kpi-total-bar');
    const elTotalSub = document.getElementById('report-kpi-total-sub');
    if (elTotalVal) elTotalVal.textContent = `${globalAvg}%`;
    if (elTotalBar) elTotalBar.style.width = `${globalAvg}%`;
    if (elTotalSub) elTotalSub.textContent = `${globalDone} de ${totalCount} concluídas`;

    phases.forEach(f => {
      const valEl = document.getElementById(`report-kpi-${f.key}-val`);
      const barEl = document.getElementById(`report-kpi-${f.key}-bar`);
      const subEl = document.getElementById(`report-kpi-${f.key}-sub`);

      if (valEl) valEl.textContent = `${f.pct}%`;
      if (barEl) barEl.style.width = `${f.pct}%`;
      if (subEl) {
        if (f.total === 0) subEl.textContent = 'Não iniciada';
        else subEl.textContent = `${f.concluidas}/${f.total} concluídas`;
      }
    });

    // 6. Quadro Consolidado de Etapas & Entregas (Seção 6)
    const tbody = document.getElementById('report-table-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      const sorted = [...taskList].sort((a, b) => parseDateBR(a.data_conclusao) - parseDateBR(b.data_conclusao));

      sorted.forEach(t => {
        const pct = Number(t.porcentagem) || 0;
        const status = calculateStatus(pct);
        const days = getDaysRemaining(t.data_conclusao);
        const isCritical = status !== 'Concluído' && status !== 'Finalizado' && days <= 7;
        const discKey = getDisciplinaKey(t.disciplina_projeto);

        let statusBg = '#f1f5f9';
        let statusColor = '#1e293b';
        let statusBorder = '#cbd5e1';
        let statusLabel = status;

        if (status === 'Concluído' || status === 'Finalizado' || pct >= 100) {
          statusBg = '#dcfce7';
          statusColor = '#14532d';
          statusBorder = '#86efac';
          statusLabel = 'Finalizado';
        } else if (status === 'Em Andamento' || pct > 0) {
          statusBg = '#dbeafe';
          statusColor = '#1e3a8a';
          statusBorder = '#93c5fd';
          statusLabel = 'Em Andamento';
        }

        let barColor = '#0284c7';
        if (pct >= 100) barColor = '#10b981';
        else if (pct >= 50) barColor = '#f59e0b';
        else if (pct > 0) barColor = '#3b82f6';
        else barColor = '#94a3b8';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="color: #0f172a; font-size: 0.75rem;">${escapeHTML(t.descricao_etapa || t.nome_tarefa)}</strong></td>
          <td><span class="report-badge-disc disc-${discKey}-badge">${escapeHTML(t.disciplina_projeto)}</span></td>
          <td><strong style="color: #1e293b; font-size: 0.75rem;">${escapeHTML(t.projetista || t.responsavel || 'Equipe')}</strong></td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: #0f172a; font-size: 0.75rem;">${escapeHTML(t.data_conclusao)}</span>
            ${isCritical ? `<span style="color: #b91c1c; font-size: 0.6875rem; font-weight: 800; display: block;">⚠️ ${days <= 0 ? 'Atrasada' : days + 'd restantes'}</span>` : ''}
          </td>
          <td>
            <div class="report-table-progress">
              <div class="report-table-track" style="background: #e2e8f0; height: 7px; border-radius: 4px;">
                <div class="report-table-fill" style="width: ${pct}%; background-color: ${barColor}; height: 100%;"></div>
              </div>
              <span class="report-table-percent-text" style="color: #0f172a; font-weight: 800; font-size: 0.75rem;">${pct}%</span>
            </div>
          </td>
          <td style="text-align: center;">
            <span style="font-size: 0.6875rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-block; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
              ${escapeHTML(statusLabel)}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  },

  downloadPDFReport() {
    const reportElem = document.getElementById('report-printable-area');
    if (!reportElem) return;

    this.showToast('Gerando arquivo PDF...');
    const project = StudioState.getActiveProject() || {};
    const slugObra = (project.name || 'Residencia_Praia')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Cronograma_${slugObra}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.report-section-block', '.report-kpi-box', 'tr', '.signatures-wrapper', '.report-legend-block']
      }
    };

    if (window.html2pdf) {
      html2pdf().set(opt).from(reportElem).save().then(() => {
        this.showToast('Relatório PDF baixado com sucesso!');
      }).catch(err => {
        console.error('Erro ao gerar PDF via html2pdf:', err);
        window.print();
      });
    } else {
      window.print();
    }
  },

  printReport() {
    window.print();
  },

  // --------------------------------------------------------------------------
  // DROPDOWNS E HELPERS DE INTERFACE
  // --------------------------------------------------------------------------
  toggleDropdown(dropdownId, event) {
    if (event) event.stopPropagation();
    const target = document.getElementById(dropdownId);
    const isOpen = target ? target.classList.contains('is-open') : false;
    this.closeAllDropdowns();
    if (!isOpen && target) {
      target.classList.add('is-open');
    }
  },

  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('is-open'));
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('mobile-open');
    if (isOpen) {
      this.closeMobileSidebar();
    } else {
      sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    if (window.lucide) lucide.createIcons();
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  },

  initGlobalEvents() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        this.closeAllDropdowns();
      }
    });

    document.addEventListener('keydown', (e) => {
      // Escape fecha modais, dropdowns, drawer mobile e command palette
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeAllDropdowns();
        this.closeMobileSidebar();
        if (window.ContextualAIModule && ContextualAIModule.closeCommandPalette) {
          ContextualAIModule.closeCommandPalette();
        }
      }

      // Ctrl+K ou Cmd+K aciona o Command Center & IA Contextual
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (window.ContextualAIModule && ContextualAIModule.toggleCommandPalette) {
          ContextualAIModule.toggleCommandPalette();
        }
      }
    });
  },

  initTheme() {
    const savedTheme = localStorage.getItem('arqvertice_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('arqvertice_theme', next);
  },

  showToast(msg) {
    const toast = document.getElementById('studio-toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3000);
  },

  openBriefingForm(projectId) {
    alert(`Redirecionando para o questionário de Briefing de 32 Perguntas do projeto selecionado.`);
  },

  copyBriefingLink(projectId) {
    const url = `${window.location.origin}/briefing?project=${projectId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('Link do Briefing copiado para a área de transferência!');
    }).catch(() => {
      prompt('Copie o link do briefing:', url);
    });
  }
};

// Utilitários Globais
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateBR(dateStr) {
  if (!dateStr) return '—';
  if (dateStr instanceof Date) {
    const d = String(dateStr.getDate()).padStart(2, '0');
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const y = dateStr.getFullYear();
    return `${d}-${m}-${y}`;
  }
  if (dateStr.includes('T')) {
    const parts = dateStr.split('T')[0].split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function formatDateInput(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}-${m}-${y}`;
}

function formatRelativeDate(isoStr) {
  if (!isoStr) return 'Recente';
  return 'Há poucas horas';
}

window.StudioApp = StudioApp;
window.escapeHTML = escapeHTML;
window.formatDateBR = formatDateBR;
window.formatRelativeDate = formatRelativeDate;

// Inicializar aplicação ao carregar DOM
document.addEventListener('DOMContentLoaded', () => {
  StudioApp.init();
});
