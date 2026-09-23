/**
 * ============================================================================
 * ARQVERTICE STUDIO — MOTOR DO QUESTIONÁRIO PÚBLICO (BriefingEngine)
 * Lógica Condicional, Autosave, Uploads Classificados, Revisão e Aprovação (B01 a B06)
 * ============================================================================
 */

const BriefingEngine = {
  token: null,
  briefing: null,
  project: null,
  client: null,
  currentStep: 1,
  answers: {},
  uploads: [],
  autosaveTimeout: null,

  init() {
    console.log('Inicializando BriefingEngine da ArqVértice...');
    StudioState.init();

    // Obter token dos parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');

    if (!this.token) {
      this.renderInvalidLink('Nenhum código de acesso foi fornecido na URL. Solicite o link exclusivo à equipe da ArqVértice.');
      return;
    }

    // Buscar briefing pelo token seguro
    this.briefing = StudioState.getBriefingByToken(this.token);

    if (!this.briefing) {
      this.renderInvalidLink('O link de briefing é inválido, expirou ou foi cancelado pela administração. Entre em contato com seu arquiteto.');
      return;
    }

    // Carregar projeto e cliente associados
    this.project = StudioState.data.projects.find(p => p.id === this.briefing.projectId) || { name: 'Projeto Arquitetônico' };
    this.client = StudioState.data.clients.find(c => c.id === this.briefing.clientId) || { name: 'Cliente Titular' };

    // Inicializar respostas e uploads locais
    this.answers = Object.assign({}, this.briefing.answers || {});
    this.uploads = Array.isArray(this.briefing.uploads) ? [...this.briefing.uploads] : [];

    // Se o status for REPORT_SENT, APPROVED ou REVISION_REQUESTED, exibir a tela de confirmação/aprovação (B05/B06)
    if (this.briefing.status === 'REPORT_SENT' || this.briefing.status === 'APPROVED' || this.briefing.status === 'REVISION_REQUESTED') {
      this.renderConfirmationPortal();
      return;
    }

    // Se já foi submetido e está sob revisão da equipe (B04)
    if (this.briefing.status === 'SUBMITTED' || this.briefing.status === 'UNDER_REVIEW') {
      this.renderSubmittedPortal();
      return;
    }

    // Caso contrário, renderizar formulário interativo de 10 etapas (B01-B04)
    this.renderQuestionnairePortal();
  },

  // --------------------------------------------------------------------------
  // ESTADOS DE ACESSO E MENSAGENS DO PORTAL
  // --------------------------------------------------------------------------
  renderInvalidLink(message) {
    const root = document.getElementById('briefing-root');
    if (!root) return;

    root.innerHTML = `
      <div class="briefing-portal-card error-card animate-fade-in">
        <div class="card-icon error"><i data-lucide="shield-alert"></i></div>
        <h2>Acesso Não Autorizado</h2>
        <p>${escapeHTML(message)}</p>
        <div class="card-action">
          <a href="mailto:contato@arqvertice.com.br" class="btn btn-outline">
            <i data-lucide="mail"></i> Falar com o Suporte
          </a>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  renderSubmittedPortal() {
    const root = document.getElementById('briefing-root');
    if (!root) return;

    const snap = this.briefing.submissionSnapshot || {};
    const dateFormatted = formatDateBR(snap.submittedAt || this.briefing.updatedAt);

    root.innerHTML = `
      <div class="briefing-portal-card success-card animate-fade-in">
        <div class="card-icon success"><i data-lucide="check-circle-2"></i></div>
        <div class="badge-tag">BRIEFING RECEBIDO COM SUCESSO</div>
        <h2>Obrigado, ${escapeHTML(this.client.name || 'Cliente')}!</h2>
        <p>Suas respostas e referências foram enviadas com sucesso para a equipe técnica da <strong>ArqVértice</strong> em <strong>${dateFormatted}</strong>.</p>
        <div class="submission-summary-box">
          <div class="summary-item"><span class="label">Projeto:</span> <strong>${escapeHTML(this.project.name)}</strong></div>
          <div class="summary-item"><span class="label">Status:</span> <span class="badge-status-pill status-in-progress">Em Análise Técnica</span></div>
          <div class="summary-item"><span class="label">Próximo Passo:</span> A equipe consolidará suas preferências e emitirá o <strong>Relatório Executivo de Confirmação</strong> para sua validação.</div>
        </div>
        <p class="text-sm text-muted">Caso necessite complementar alguma informação urgente, entre em contato diretamente pelo WhatsApp da ArqVértice.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  renderConfirmationPortal() {
    const root = document.getElementById('briefing-root');
    if (!root) return;

    const brf = this.briefing;
    const isApproved = brf.status === 'APPROVED';
    const isRevision = brf.status === 'REVISION_REQUESTED';

    root.innerHTML = `
      <div class="briefing-confirmation-wrap animate-fade-in">
        <!-- Topo do Portal de Aprovação -->
        <header class="client-header">
          <div class="client-brand">
            <img src="logo.png" alt="ArqVértice" class="client-logo">
            <div>
              <h3>ARQVÉRTICE STUDIO</h3>
              <span>ARQUITETURA & INTERIORES</span>
            </div>
          </div>
          <div class="client-status">
            ${isApproved 
              ? `<span class="badge-status-pill status-completed"><i data-lucide="check"></i> BRIEFING HOMOLOGADO</span>`
              : isRevision
              ? `<span class="badge-status-pill status-review"><i data-lucide="clock"></i> REVISÃO EM ANDAMENTO</span>`
              : `<span class="badge-status-pill status-in-progress"><i data-lucide="file-check"></i> AGUARDANDO SUA APROVAÇÃO</span>`
            }
          </div>
        </header>

        <!-- Banner Explicativo -->
        <div class="approval-hero-banner">
          <h1>Relatório Executivo de Briefing — Versão 0${brf.version || 1}</h1>
          <p>Consolidamos todas as suas preferências, rotina, escolhas de estilo e necessidades para o projeto <strong>${escapeHTML(this.project.name)}</strong>. Por favor, confira o parecer técnico abaixo.</p>
        </div>

        <!-- Ações de Aprovação no Topo -->
        <div class="approval-action-bar">
          <button class="btn btn-outline" onclick="BriefingEngine.downloadReportPDF()">
            <i data-lucide="download"></i> Baixar Relatório (PDF)
          </button>
          ${!isApproved ? `
            <button class="btn btn-secondary" onclick="BriefingEngine.openRevisionModal()">
              <i data-lucide="message-square"></i> Solicitar Alterações
            </button>
            <button class="btn btn-primary" onclick="BriefingEngine.approveBriefing()">
              <i data-lucide="check-circle"></i> Aprovar Briefing Formalmente
            </button>
          ` : `
            <div class="approved-msg-box">
              <i data-lucide="award"></i>
              <span>Este briefing foi aprovado e homologado pelo cliente em ${formatDateBR(brf.updatedAt)}. O projeto está liberado para a fase de Estudos e Modelagem 3D.</span>
            </div>
          `}
        </div>

        <!-- Documento do Relatório de Confirmação (Prompt B05) -->
        <div class="report-document-sheet" id="report-printable-content">
          ${this.buildConfirmationReportHTML()}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // --------------------------------------------------------------------------
  // PORTAL DO QUESTIONÁRIO (B01 - B04)
  // --------------------------------------------------------------------------
  renderQuestionnairePortal() {
    const root = document.getElementById('briefing-root');
    if (!root) return;

    const totalSteps = BRIEFING_SECTIONS.length;
    const progressPct = Math.round(((this.currentStep - 1) / (totalSteps - 1)) * 100);
    const activeSection = BRIEFING_SECTIONS[this.currentStep - 1];

    root.innerHTML = `
      <div class="briefing-portal-layout animate-fade-in">
        <!-- CABEÇALHO DO CLIENTE COM AUTOSAVE -->
        <header class="portal-topbar">
          <div class="topbar-brand">
            <img src="logo.png" alt="ArqVértice" class="portal-logo">
            <div class="portal-titles">
              <h2>ARQVÉRTICE STUDIO</h2>
              <span>BRIEFING EXECUTIVO &bull; ${escapeHTML(this.project.name)}</span>
            </div>
          </div>

          <div class="topbar-right">
            <div class="portal-save-indicator" id="portal-save-status">
              <i data-lucide="check"></i> <span>Salvo</span>
            </div>
          </div>
        </header>

        <!-- BARRA DE PROGRESSO EM ETAPAS CURTAS -->
        <div class="portal-stepper-wrap">
          <div class="stepper-track">
            ${BRIEFING_SECTIONS.map(s => `
              <div 
                class="stepper-step ${s.step === this.currentStep ? 'active' : s.step < this.currentStep ? 'completed' : ''}"
                onclick="BriefingEngine.jumpToStepDirect(${s.step})"
                title="${s.step}. ${s.title}"
              >
                <div class="step-circle">${s.step < this.currentStep ? '✓' : s.step}</div>
                <span class="step-label">${s.title}</span>
              </div>
            `).join('')}
          </div>
          <div class="stepper-progress-bar">
            <div class="stepper-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <!-- ÁREA PRINCIPAL DO FORMULÁRIO -->
        <main class="portal-main-sheet">
          <div class="section-intro">
            <div class="section-tag" style="background: ${activeSection.color}20; color: ${activeSection.color};">
              <i data-lucide="${activeSection.icon}"></i>
              <span>ETAPA 0${activeSection.step} DE 10</span>
            </div>
            <h1 class="section-heading">${activeSection.title}</h1>
            <p class="section-sub">${activeSection.subtitle}</p>
          </div>

          <!-- Conteúdo da Etapa Ativa -->
          <div class="section-questions-container">
            ${this.currentStep === 10 ? this.renderReviewStep() : this.renderCurrentStepQuestions()}
          </div>

          <!-- BARRA DE NAVEGAÇÃO INFERIOR -->
          <footer class="portal-nav-bar">
            ${this.currentStep > 1 ? `
              <button class="btn btn-outline" onclick="BriefingEngine.prevStep()">
                <i data-lucide="arrow-left"></i> <span>Voltar</span>
              </button>
            ` : '<div></div>'}

            <div class="nav-step-info">
              <span>Etapa <strong>${this.currentStep}</strong> de ${totalSteps}</span>
            </div>

            ${this.currentStep < totalSteps ? `
              <button class="btn btn-primary" onclick="BriefingEngine.nextStep()">
                <span>Avançar</span> <i data-lucide="arrow-right"></i>
              </button>
            ` : `
              <button class="btn btn-success btn-lg" onclick="BriefingEngine.submitBriefingFinal()">
                <i data-lucide="send"></i> <span>Enviar Briefing para a ArqVértice</span>
              </button>
            `}
          </footer>
        </main>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO DE PERGUNTAS E TIPOS
  // --------------------------------------------------------------------------
  renderCurrentStepQuestions() {
    const activeSection = BRIEFING_SECTIONS[this.currentStep - 1];
    const questions = BRIEFING_QUESTIONS.filter(q => q.section === activeSection.id);

    return questions.map(q => {
      const isVisible = this.isQuestionVisible(q);
      if (!isVisible) return '';

      return `
        <div class="question-card" id="q-wrap-${q.code}">
          <label class="question-label" for="q-input-${q.code}">
            <span class="q-title">${escapeHTML(q.label)}</span>
            ${q.required ? '<span class="q-req" title="Campo obrigatório">*</span>' : ''}
          </label>
          ${q.hint ? `<p class="q-hint">${escapeHTML(q.hint)}</p>` : ''}

          <div class="question-input-wrapper">
            ${this.renderQuestionInput(q)}
          </div>
        </div>
      `;
    }).join('');
  },

  renderQuestionInput(q) {
    const val = this.answers[q.code];

    switch (q.type) {
      case 'texto':
      case 'email':
        return `
          <input 
            type="${q.type === 'email' ? 'email' : 'text'}" 
            id="q-input-${q.code}" 
            class="portal-input" 
            placeholder="${escapeHTML(q.placeholder || '')}"
            value="${escapeHTML(val || '')}"
            oninput="BriefingEngine.handleAnswerChange('${q.code}', this.value)"
          >
        `;

      case 'longo':
        return `
          <textarea 
            id="q-input-${q.code}" 
            class="portal-textarea" 
            rows="3" 
            placeholder="${escapeHTML(q.placeholder || '')}"
            oninput="BriefingEngine.handleAnswerChange('${q.code}', this.value)"
          >${escapeHTML(val || '')}</textarea>
        `;

      case 'radio':
        return `
          <div class="radio-options-grid">
            ${q.options.map((opt, i) => {
              const isChecked = val === opt;
              return `
                <label class="radio-tile ${isChecked ? 'selected' : ''}">
                  <input 
                    type="radio" 
                    name="group-${q.code}" 
                    value="${escapeHTML(opt)}"
                    ${isChecked ? 'checked' : ''}
                    onchange="BriefingEngine.handleAnswerChange('${q.code}', this.value)"
                  >
                  <span class="radio-indicator"></span>
                  <span class="radio-text">${escapeHTML(opt)}</span>
                </label>
              `;
            }).join('')}
          </div>
          ${q.allowsOther ? `
            <div class="other-input-wrap">
              <input 
                type="text" 
                class="portal-input" 
                placeholder="Outro (especifique)..."
                value="${escapeHTML(this.answers[q.code + '_outro'] || '')}"
                oninput="BriefingEngine.handleAnswerChange('${q.code}_outro', this.value)"
              >
            </div>
          ` : ''}
        `;

      case 'checkbox':
        const selectedArr = Array.isArray(val) ? val : [];
        return `
          <div class="checkbox-options-grid">
            ${q.options.map(opt => {
              const isChecked = selectedArr.includes(opt);
              return `
                <label class="checkbox-tile ${isChecked ? 'selected' : ''}">
                  <input 
                    type="checkbox" 
                    value="${escapeHTML(opt)}"
                    ${isChecked ? 'checked' : ''}
                    onchange="BriefingEngine.handleCheckboxToggle('${q.code}', this.value)"
                  >
                  <span class="checkbox-indicator"></span>
                  <span class="checkbox-text">${escapeHTML(opt)}</span>
                </label>
              `;
            }).join('')}
          </div>
        `;

      case 'cartoes':
        return this.renderCardsQuestion(q);

      case 'upload':
        return this.renderUploadSection(q);

      default:
        return `<input type="text" class="portal-input" value="${escapeHTML(val || '')}" oninput="BriefingEngine.handleAnswerChange('${q.code}', this.value)">`;
    }
  },

  renderCardsQuestion(q) {
    const val = this.answers[q.code];
    const isMultiple = q.multiple === true;
    const selectedList = isMultiple ? (Array.isArray(val) ? val : []) : [val];

    return `
      <div class="visual-cards-grid">
        ${q.cards.map(c => {
          const isSelected = selectedList.includes(c.valor);
          return `
            <div 
              class="visual-card-item ${isSelected ? 'is-selected' : ''}" 
              onclick="BriefingEngine.handleCardClick('${q.code}', '${escapeHTML(c.valor)}', ${isMultiple})"
            >
              ${c.imgUrl ? `
                <div class="card-photo-wrap">
                  <img src="${c.imgUrl}" alt="${escapeHTML(c.valor)}" loading="lazy">
                </div>
              ` : ''}
              <div class="card-meta">
                <div class="card-title-row">
                  ${c.icon ? `<i data-lucide="${c.icon}"></i>` : ''}
                  <h4>${escapeHTML(c.valor)}</h4>
                  <span class="select-check"><i data-lucide="check"></i></span>
                </div>
                ${c.desc ? `<p class="card-desc">${escapeHTML(c.desc)}</p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${q.allowsOther ? `
        <div class="other-input-wrap">
          <input 
            type="text" 
            class="portal-input" 
            placeholder="Outro ambiente ou item personalizado..."
            value="${escapeHTML(this.answers[q.code + '_outro'] || '')}"
            oninput="BriefingEngine.handleAnswerChange('${q.code}_outro', this.value)"
          >
        </div>
      ` : ''}
    `;
  },

  // --------------------------------------------------------------------------
  // B03: UPLOAD E REFERÊNCIAS VINCULADAS
  // --------------------------------------------------------------------------
  renderUploadSection(q) {
    // Obter lista de ambientes que o cliente selecionou na etapa 5
    const selectedEnvironments = Array.isArray(this.answers.p8_ambientes) ? this.answers.p8_ambientes : [];

    return `
      <div class="portal-upload-container">
        <!-- Zona de Drag and Drop -->
        <div class="upload-dropzone" id="portal-dropzone" onclick="document.getElementById('portal-file-input').click()">
          <i data-lucide="upload-cloud"></i>
          <p class="dropzone-primary">Arraste imagens ou clique para selecionar do dispositivo</p>
          <p class="dropzone-sub">Suporta JPG, PNG, WEBP e PDF (até 20MB por arquivo)</p>
          <input 
            type="file" 
            id="portal-file-input" 
            style="display: none;" 
            multiple 
            accept="image/*,.pdf"
            onchange="BriefingEngine.handleFileSelection(this.files)"
          >
        </div>

        <!-- Galeria de Arquivos Anexados -->
        <div class="portal-uploads-gallery" id="portal-uploads-gallery">
          ${this.uploads.length === 0 ? `
            <div class="empty-upload-hint">
              <span>Nenhum arquivo anexado ainda. Você pode adicionar referências de ambientes, fotos ou projetos existentes.</span>
            </div>
          ` : this.uploads.map((up, idx) => `
            <div class="upload-item-card">
              <div class="upload-thumb">
                <img src="${up.url}" alt="${escapeHTML(up.title)}">
              </div>
              <div class="upload-info">
                <input 
                  type="text" 
                  class="upload-title-input" 
                  value="${escapeHTML(up.title)}" 
                  placeholder="Legenda da imagem..."
                  onchange="BriefingEngine.updateUploadMeta(${idx}, 'title', this.value)"
                >
                <div class="upload-selectors">
                  <!-- Categoria (Prompt B03 item 25) -->
                  <select class="form-select select-xs" onchange="BriefingEngine.updateUploadMeta(${idx}, 'category', this.value)">
                    <option value="referencia" ${up.category === 'referencia' ? 'selected' : ''}>Referência Geral</option>
                    <option value="arquitetura" ${up.category === 'arquitetura' ? 'selected' : ''}>Arquitetura</option>
                    <option value="interior" ${up.category === 'interior' ? 'selected' : ''}>Interiores</option>
                    <option value="mobiliario" ${up.category === 'mobiliario' ? 'selected' : ''}>Mobiliário</option>
                    <option value="material" ${up.category === 'material' ? 'selected' : ''}>Material</option>
                    <option value="iluminacao" ${up.category === 'iluminacao' ? 'selected' : ''}>Iluminação</option>
                    <option value="foto" ${up.category === 'foto' ? 'selected' : ''}>Foto do Imóvel</option>
                    <option value="planta" ${up.category === 'planta' ? 'selected' : ''}>Planta</option>
                  </select>

                  <!-- Vínculo com Ambiente (Prompt B03 item 26) -->
                  <select class="form-select select-xs" onchange="BriefingEngine.updateUploadMeta(${idx}, 'environmentName', this.value)">
                    <option value="">(Ambiente Geral)</option>
                    ${selectedEnvironments.map(envName => `
                      <option value="${escapeHTML(envName)}" ${up.environmentName === envName ? 'selected' : ''}>${escapeHTML(envName)}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <button class="btn-icon btn-ghost text-danger" title="Remover" onclick="BriefingEngine.removeUpload(${idx})">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleFileSelection(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileDataUrl = e.target.result;
        this.uploads.push({
          id: 'up-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: 'referencia',
          environmentName: '',
          url: fileDataUrl,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString()
        });
        this.triggerAutosave();
        this.renderQuestionnairePortal();
      };
      reader.readAsDataURL(file);
    });
  },

  updateUploadMeta(index, key, value) {
    if (this.uploads[index]) {
      this.uploads[index][key] = value;
      this.triggerAutosave();
    }
  },

  removeUpload(index) {
    this.uploads.splice(index, 1);
    this.triggerAutosave();
    this.renderQuestionnairePortal();
  },

  // --------------------------------------------------------------------------
  // AVALIAÇÃO CONDICIONAL & MANIPULAÇÃO DE RESPOSTAS
  // --------------------------------------------------------------------------
  isQuestionVisible(q) {
    if (!q.condition) return true;
    const { field, operator, value } = q.condition;
    const currentVal = this.answers[field];

    if (operator === 'equals') return currentVal === value;
    if (operator === 'not_equals') return currentVal !== value;
    if (operator === 'contains') {
      if (Array.isArray(currentVal)) return currentVal.includes(value);
      if (typeof currentVal === 'string') return currentVal.includes(value);
      return false;
    }
    return true;
  },

  handleAnswerChange(code, value) {
    this.answers[code] = value;
    this.triggerAutosave();
  },

  handleCheckboxToggle(code, option) {
    if (!Array.isArray(this.answers[code])) {
      this.answers[code] = [];
    }
    const idx = this.answers[code].indexOf(option);
    if (idx > -1) {
      this.answers[code].splice(idx, 1);
    } else {
      this.answers[code].push(option);
    }
    this.triggerAutosave();
    this.renderQuestionnairePortal();
  },

  handleCardClick(code, cardValue, isMultiple) {
    if (isMultiple) {
      if (!Array.isArray(this.answers[code])) {
        this.answers[code] = [];
      }
      const idx = this.answers[code].indexOf(cardValue);
      if (idx > -1) {
        this.answers[code].splice(idx, 1);
      } else {
        this.answers[code].push(cardValue);
      }
    } else {
      this.answers[code] = cardValue;
    }
    this.triggerAutosave();
    this.renderQuestionnairePortal();
  },

  triggerAutosave() {
    const indicator = document.getElementById('portal-save-status');
    if (indicator) {
      indicator.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Salvando...</span>';
      indicator.classList.remove('is-saved');
    }

    clearTimeout(this.autosaveTimeout);
    this.autosaveTimeout = setTimeout(() => {
      // Persistir no briefing local
      this.briefing.answers = this.answers;
      this.briefing.uploads = this.uploads;
      this.briefing.updatedAt = new Date().toISOString();
      if (this.briefing.status === 'SENT') {
        this.briefing.status = 'IN_PROGRESS';
      }
      StudioState.save();

      if (indicator) {
        indicator.innerHTML = '<i data-lucide="check"></i> <span>Salvo</span>';
        indicator.classList.add('is-saved');
      }
      if (window.lucide) lucide.createIcons();
    }, 600);
  },

  // --------------------------------------------------------------------------
  // NAVEGAÇÃO DE ETAPAS
  // --------------------------------------------------------------------------
  jumpToStepDirect(step) {
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderQuestionnairePortal();
  },

  nextStep() {
    // Validar campos obrigatórios visíveis da etapa atual
    const activeSection = BRIEFING_SECTIONS[this.currentStep - 1];
    const questions = BRIEFING_QUESTIONS.filter(q => q.section === activeSection.id && this.isQuestionVisible(q));

    for (const q of questions) {
      if (q.required) {
        const val = this.answers[q.code];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '')) {
          alert(`Por favor, preencha o campo obrigatório: "${q.label}".`);
          const elem = document.getElementById(`q-wrap-${q.code}`);
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    if (this.currentStep < BRIEFING_SECTIONS.length) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderQuestionnairePortal();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderQuestionnairePortal();
    }
  },

  // --------------------------------------------------------------------------
  // ETAPA 10: TELA DE REVISÃO DO CLIENTE (B04)
  // --------------------------------------------------------------------------
  renderReviewStep() {
    return `
      <div class="review-step-container">
        <div class="review-intro-box">
          <i data-lucide="sparkles"></i>
          <div>
            <h3>Tudo pronto para enviar seu briefing!</h3>
            <p>Revise suas respostas abaixo. Se desejar alterar qualquer item antes do envio definitivo, clique em <strong>Editar</strong> ao lado da seção.</p>
          </div>
        </div>

        <div class="review-sections-list">
          ${BRIEFING_SECTIONS.slice(0, 9).map(sec => {
            const secQuestions = BRIEFING_QUESTIONS.filter(q => q.section === sec.id && this.isQuestionVisible(q));
            return `
              <div class="review-section-card">
                <div class="review-card-header">
                  <div class="review-sec-title">
                    <i data-lucide="${sec.icon}"></i>
                    <h4>${sec.title}</h4>
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="BriefingEngine.jumpToStepDirect(${sec.step})">
                    <i data-lucide="edit-2"></i> Editar
                  </button>
                </div>
                <div class="review-items-grid">
                  ${secQuestions.map(q => {
                    const ans = this.answers[q.code];
                    const formatAnswer = () => {
                      if (!ans) return '<span class="text-muted">(Não informado)</span>';
                      if (Array.isArray(ans)) return ans.join(', ');
                      return escapeHTML(ans);
                    };
                    return `
                      <div class="review-field">
                        <span class="field-label">${escapeHTML(q.label)}:</span>
                        <div class="field-val">${formatAnswer()}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}

          <!-- Referências Anexadas -->
          <div class="review-section-card">
            <div class="review-card-header">
              <div class="review-sec-title">
                <i data-lucide="image"></i>
                <h4>Imagens & Referências Anexadas (${this.uploads.length})</h4>
              </div>
              <button class="btn btn-outline btn-sm" onclick="BriefingEngine.jumpToStepDirect(9)">
                <i data-lucide="edit-2"></i> Adicionar Mais
              </button>
            </div>
            <div class="review-thumbs-row">
              ${this.uploads.length === 0 ? `
                <p class="text-sm text-muted">Nenhuma imagem anexada.</p>
              ` : this.uploads.map(up => `
                <div class="review-mini-thumb">
                  <img src="${up.url}" alt="${escapeHTML(up.title)}">
                  <span>${escapeHTML(up.title)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="review-confirm-prompt">
          <label class="confirm-checkbox-tile">
            <input type="checkbox" id="client-confirm-checkbox" checked>
            <span>Confirmo que as informações acima refletem fielmente as intenções, rotina e necessidades da nossa família/empresa para este projeto.</span>
          </label>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUBMISSÃO DEFINITIVA COM SNAPSHOT IMUTÁVEL (B04)
  // --------------------------------------------------------------------------
  submitBriefingFinal() {
    const check = document.getElementById('client-confirm-checkbox');
    if (check && !check.checked) {
      alert('Por favor, confirme a caixa de verificação antes de enviar o briefing.');
      return;
    }

    if (!confirm('Deseja realmente enviar seu briefing para a ArqVértice? Após o envio, a equipe técnica iniciará a análise e consolidação.')) {
      return;
    }

    // Gerar Snapshot Imutável (Prompt B04 item 39)
    const snapshot = {
      submittedAt: new Date().toISOString(),
      submittedByName: this.answers.cliente_nome || this.client.name,
      submittedByEmail: this.answers.cliente_email || this.client.email,
      submittedByPhone: this.answers.cliente_telefone || this.client.phone,
      answers: JSON.parse(JSON.stringify(this.answers)),
      uploadsCount: this.uploads.length,
      version: this.briefing.version || 1
    };

    this.briefing.submissionSnapshot = snapshot;
    this.briefing.status = 'SUBMITTED';
    this.briefing.updatedAt = new Date().toISOString();

    // Notificação Interna para a ArqVértice (Prompt B04 item 41)
    if (!StudioState.data.notifications) StudioState.data.notifications = [];
    StudioState.data.notifications.unshift({
      id: 'notif-' + Date.now().toString(36),
      type: 'approval',
      title: 'Novo Briefing Recebido',
      desc: `${this.client.name} submeteu o briefing do projeto "${this.project.name}".`,
      time: 'Agora mesmo',
      read: false
    });

    StudioState.save();
    this.renderSubmittedPortal();
  },

  // --------------------------------------------------------------------------
  // RELATÓRIO DE CONFIRMAÇÃO & APROVAÇÃO (B05 & B06)
  // --------------------------------------------------------------------------
  buildConfirmationReportHTML() {
    const brf = this.briefing;
    const ans = brf.answers || {};
    const conf = brf.confirmation || {};

    return `
      <div class="report-a4-page">
        <!-- Cabeçalho Institucional -->
        <div class="rep-header">
          <div class="rep-logo-block">
            <h2 class="rep-brand-title">ARQVÉRTICE STUDIO</h2>
            <span class="rep-brand-sub">ARQUITETURA &bull; INTERIORES &bull; ENGENHARIA</span>
          </div>
          <div class="rep-meta-block">
            <div class="rep-doc-title">RELATÓRIO EXECUTIVO DE BRIEFING</div>
            <div class="rep-version">DOCUMENTO OFICIAL &bull; VERSÃO 0${brf.version || 1}</div>
            <div class="rep-date">Emissão: ${formatDateBR(brf.updatedAt)}</div>
          </div>
        </div>

        <!-- Identificação Cadastral -->
        <div class="rep-section-box">
          <h3 class="rep-sec-title">1. Identificação do Empreendimento</h3>
          <div class="rep-grid-2">
            <div><strong>Cliente Titular:</strong> ${escapeHTML(ans.cliente_nome || this.client.name)}</div>
            <div><strong>Projeto:</strong> ${escapeHTML(this.project.name)}</div>
            <div><strong>Localização:</strong> ${escapeHTML(ans.projeto_local || this.project.location)}</div>
            <div><strong>Tipologia:</strong> ${escapeHTML(ans.projeto_tipo || this.project.typology)}</div>
          </div>
        </div>

        <!-- Perfil e Rotina -->
        <div class="rep-section-box">
          <h3 class="rep-sec-title">2. Perfil dos Usuários e Rotina da Casa</h3>
          <p><strong>Quem habita:</strong> ${escapeHTML(ans.p1_quem || 'Não informado')}</p>
          <p><strong>Rotina e Dinâmica:</strong> ${escapeHTML(ans.p1_rotina || 'Não informado')}</p>
          <p><strong>Visitas e Recepção:</strong> ${escapeHTML(ans.p1_visitas || 'Não informado')}</p>
          ${ans.p1_animais && ans.p1_animais !== 'Não' ? `<p><strong>Animais de Estimação:</strong> ${escapeHTML(ans.p1_animais)} — ${escapeHTML(ans.p1_animais_detalhes || '')}</p>` : ''}
        </div>

        <!-- Programa e Ambientes -->
        <div class="rep-section-box">
          <h3 class="rep-sec-title">3. Programa de Ambientes Homologado</h3>
          <div class="rep-badges-wrap">
            ${Array.isArray(ans.p8_ambientes) ? ans.p8_ambientes.map(a => `<span class="rep-chip">${escapeHTML(a)}</span>`).join('') : 'Não informado'}
          </div>
          <p style="margin-top: 10px;"><strong>Integração Social:</strong> ${escapeHTML(ans.p8_integracao || 'Conceito Aberto')}</p>
          ${ans.p3_sonho ? `<p><strong>Desejos Especiais:</strong> ${escapeHTML(ans.p3_sonho)}</p>` : ''}
        </div>

        <!-- Estilo, Cores e Rejeições -->
        <div class="rep-section-box">
          <h3 class="rep-sec-title">4. Estilo Arquitetônico & Diretrizes Visuais</h3>
          <p><strong>Estilo Escolhido:</strong> ${Array.isArray(ans.p7_estilos) ? ans.p7_estilos.join(', ') : (ans.p7_estilos || 'Contemporâneo')}</p>
          <p><strong>Paleta Cromática:</strong> ${escapeHTML(ans.p7_paleta || 'Neutros e claros')}</p>
          <p><strong>Materiais que Ama:</strong> ${escapeHTML(ans.p4_materiais_ama || 'Madeira, mármores e pedras naturais')}</p>
          <div class="rep-rejection-callout">
            <strong>RESTRIÇÕES CRÍTICAS (O que NÃO quer no projeto):</strong>
            <p>${escapeHTML(ans.p7_detesta || 'Nenhuma rejeição crítica informada.')}</p>
          </div>
        </div>

        <!-- Orçamento e Prazos -->
        <div class="rep-section-box">
          <h3 class="rep-sec-title">5. Alinhamento Orçamentário e Cronograma</h3>
          <div class="rep-grid-2">
            <div><strong>Faixa Estimada de Investimento:</strong> ${escapeHTML(ans.p10_orcamento || 'A definir')}</div>
            <div><strong>Expectativa de Entrega:</strong> ${escapeHTML(ans.p5_prazo || 'Conforme cronograma técnico')}</div>
          </div>
        </div>

        <!-- Interpretação Técnica ArqVértice (Prompt B04 item 40 e B05 item 45) -->
        <div class="rep-section-box highlight-internal">
          <h3 class="rep-sec-title">6. Diretrizes Técnicas da Equipe ArqVértice</h3>
          <p>${escapeHTML(conf.technicalInterpretation || 'Com base nas respostas consolidadas, a ArqVértice priorizará a integração fluida entre o living e a área gourmet, com vãos generosos para iluminação natural e especificações de marcenaria de alto padrão. As restrições informadas foram adicionadas como parâmetros rígidos para a equipe de 3D e cálculo estrutural.')}</p>
          <div class="rep-architect-signature">
            <span>Responsável Técnico: <strong>Eduardo Marques (Arquiteto Projetista)</strong></span>
          </div>
        </div>

        <!-- Bloco de Assinatura e Homologação do Cliente (Prompt B06 item 53) -->
        <div class="rep-signature-block">
          <div class="rep-sig-line">
            <div class="line"></div>
            <strong>${escapeHTML(ans.cliente_nome || this.client.name)}</strong>
            <span>Cliente Titular</span>
          </div>
          <div class="rep-sig-line">
            <div class="line"></div>
            <strong>ArqVértice Arquitetura e Interiores</strong>
            <span>Coordenação de Projetos</span>
          </div>
        </div>
      </div>
    `;
  },

  downloadReportPDF() {
    const reportElem = document.getElementById('report-printable-content');
    if (!reportElem) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Relatorio_Briefing_${this.project.name.replace(/\s+/g, '_')}_V0${this.briefing.version || 1}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      html2pdf().set(opt).from(reportElem).save();
    } else {
      window.print();
    }
  },

  openRevisionModal() {
    const note = prompt('O que você gostaria de corrigir ou acrescentar neste briefing?', '');
    if (note === null || note.trim() === '') return;

    if (!this.briefing.revisions) this.briefing.revisions = [];
    this.briefing.revisions.push({
      version: this.briefing.version,
      note: note.trim(),
      requestedAt: new Date().toISOString(),
      requestedBy: this.client.name
    });

    this.briefing.status = 'REVISION_REQUESTED';
    this.briefing.version = (this.briefing.version || 1) + 1;
    this.briefing.updatedAt = new Date().toISOString();

    StudioState.save();
    alert('Sua solicitação de revisão foi enviada para a ArqVértice. A equipe fará os ajustes solicitados.');
    this.renderConfirmationPortal();
  },

  approveBriefing() {
    if (!confirm('Deseja homologar e aprovar definitivamente este briefing? Esta ação formalizará as diretrizes para o início dos estudos preliminares.')) {
      return;
    }

    this.briefing.status = 'APPROVED';
    this.briefing.updatedAt = new Date().toISOString();
    this.briefing.approvedSnapshot = {
      approvedAt: new Date().toISOString(),
      approvedBy: this.client.name,
      version: this.briefing.version,
      answers: JSON.parse(JSON.stringify(this.briefing.answers))
    };

    // Atualizar status do projeto (Prompt B06 item 55)
    if (this.project) {
      this.project.currentStage = 'Estudos Preliminares & 3D';
      const stageBriefing = (this.project.stages || []).find(s => s.key === 'briefing');
      if (stageBriefing) stageBriefing.status = 'concluido';
      const stageEstudos = (this.project.stages || []).find(s => s.key === 'estudos');
      if (stageEstudos) stageEstudos.status = 'em_andamento';
    }

    StudioState.save();
    alert('Briefing APROVADO com sucesso! O projeto foi liberado para as próximas etapas.');
    this.renderConfirmationPortal();
  }
};

window.BriefingEngine = BriefingEngine;

document.addEventListener('DOMContentLoaded', () => {
  BriefingEngine.init();
});
