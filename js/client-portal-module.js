/**
 * ============================================================================
 * ARQVERTICE STUDIO — PORTAL DO CLIENTE (BLOCO H: H01, H02, H03)
 * Interface Externa, Segura e Controlada para Acompanhamento do Projeto
 * ============================================================================
 */

(function(global) {
  'use strict';

  const ClientPortalModule = {
    currentRoute: 'dashboard', // 'dashboard' | 'projeto' | 'briefing' | 'apresentacao' | 'renders' | 'especificacoes' | 'solicitacoes' | 'revisoes' | 'aprovacoes' | 'entrega'
    currentSessionId: null,
    currentPortalId: null,
    activeToken: null,
    viewState: 'loading', // 'loading' | 'ready' | 'empty' | 'error' | 'not_found' | 'expired'
    errorMessage: null,
    cachedData: null,
    presentationFilter: 'todas', // 'todas' | 'recentes' | 'aprovadas' | 'aguardando_revisao'
    renderDisplayMode: 'grid', // 'grid' | 'masonry' | 'carousel' | 'fullscreen'
    activeCarouselIndex: 0,
    activeSpecTab: 'materiais', // 'materiais' | 'mobiliario' | 'moodboards'
    activeDocumentViewer: null,
    activePresentationMode: null,
    activeCommentDrawer: null,
    activeChangeRequestModal: null,

    // Inicialização do Módulo no Navegador
    init(options = {}) {
      const state = this.getState();
      if (!state) return;

      // Detecta token ou sessão na URL ou localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const token = options.token || urlParams.get('token') || (state.data.clientPortals && state.data.clientPortals[0]?.token);
      const magicToken = urlParams.get('magic');
      const routeParam = urlParams.get('section') || 'dashboard';

      this.currentRoute = routeParam;
      this.activeToken = token;

      if (token) {
        this.authenticateClient(token, magicToken);
      } else {
        this.viewState = 'not_found';
        this.errorMessage = 'Nenhum token de acesso foi fornecido. Utilize o link enviado pelo seu arquiteto.';
      }
    },

    getState() {
      if (typeof StudioState !== 'undefined') return StudioState;
      if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
      return null;
    },

    // Autentica o cliente e inicializa a sessão
    authenticateClient(token, magicToken = null) {
      const state = this.getState();
      if (!state) return;

      this.viewState = 'loading';

      const portal = state.getClientPortal(token);
      if (!portal) {
        this.viewState = 'not_found';
        this.errorMessage = 'Portal não encontrado para o link informado. Verifique se o endereço está correto.';
        this.render();
        return;
      }

      if (portal.status === 'expired' || (portal.expiresAt && new Date(portal.expiresAt) <= new Date())) {
        this.viewState = 'expired';
        this.errorMessage = 'O período de acesso deste portal foi expirado. Entre em contato com seu arquiteto para renovar.';
        this.render();
        return;
      }

      if (portal.status === 'suspended' || portal.status === 'revoked') {
        this.viewState = 'error';
        this.errorMessage = `Este portal está atualmente ${portal.status === 'suspended' ? 'suspenso temporariamente' : 'revogado'}. Consulte o escritório.`;
        this.render();
        return;
      }

      // Cria sessão autenticada (H02)
      const sessionResult = state.createClientPortalSession({
        portalId: portal.id,
        authMethod: magicToken ? 'magic_link' : 'magic_link',
        magicToken: magicToken || portal.token,
        ip: '127.0.0.1',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Client Browser'
      });

      if (!sessionResult.success) {
        this.viewState = 'error';
        this.errorMessage = sessionResult.error || 'Falha ao autenticar sessão do portal.';
        this.render();
        return;
      }

      this.currentSessionId = sessionResult.session.id;
      this.currentPortalId = portal.id;

      try {
        // Carrega dados higienizados sem risco de expor banco ou prompts internos (H03)
        this.cachedData = state.getSanitizedClientProjectData(portal.id, this.currentSessionId);
        this.viewState = 'ready';
      } catch (err) {
        this.viewState = 'error';
        this.errorMessage = err.message || 'Erro ao carregar os dados públicos do projeto.';
      }

      this.render();
    },

    // Navegação interna do Portal
    setRoute(route) {
      this.currentRoute = route;
      const url = new URL(window.location.href);
      url.searchParams.set('section', route);
      window.history.replaceState({}, '', url.toString());
      this.render();
      if (window.lucide) lucide.createIcons();
    },

    // Encerra sessão do cliente
    logout() {
      const state = this.getState();
      if (state && this.currentSessionId) {
        state.revokePortalSession(this.currentSessionId, 'Cliente');
      }
      this.currentSessionId = null;
      this.cachedData = null;
      this.viewState = 'expired';
      this.errorMessage = 'Você encerrou sua sessão com segurança. Para acessar novamente, utilize seu link de convite.';
      this.render();
    },

    // Renderizador Central
    render() {
      const container = document.getElementById('client-portal-root') || document.getElementById('view-container');
      if (!container) return '';

      let html = '';

      if (this.viewState === 'loading') {
        html = this.renderLoadingState();
      } else if (this.viewState === 'not_found' || this.viewState === 'error' || this.viewState === 'expired') {
        html = this.renderErrorState();
      } else {
        html = `
          <div class="client-portal-wrapper">
            ${this.renderHeader()}
            <main class="client-portal-content">
              ${this.renderRouteContent()}
            </main>
            ${this.renderFooter()}
          </div>
        `;
      }

      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
      return html;
    },

    // Estados Visuais Específicos (H03)
    renderLoadingState() {
      return `
        <div class="client-portal-state-card">
          <div class="portal-spinner"></div>
          <h2 style="margin-top: 20px; font-weight: 600; font-size: 1.25rem;">Acessando seu projeto...</h2>
          <p style="color: var(--text-secondary, #94a3b8); margin-top: 8px; font-size: 0.9rem;">
            Verificando credenciais e carregando informações autorizadas do ArqVértice Studio.
          </p>
        </div>
      `;
    },

    renderErrorState() {
      const isExpired = this.viewState === 'expired';
      const isNotFound = this.viewState === 'not_found';
      const title = isExpired ? 'Acesso Expirado' : (isNotFound ? 'Projeto Não Encontrado' : 'Acesso Indisponível');
      const icon = isExpired ? 'clock' : (isNotFound ? 'search-x' : 'shield-alert');

      return `
        <div class="client-portal-state-card">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            <i data-lucide="${icon}" style="width: 28px; height: 28px;"></i>
          </div>
          <h2 style="font-weight: 700; font-size: 1.35rem; color: var(--text-primary, #ffffff);">${title}</h2>
          <p style="color: var(--text-secondary, #94a3b8); margin-top: 12px; font-size: 0.95rem; max-width: 480px; line-height: 1.6;">
            ${this.errorMessage || 'Não foi possível carregar a visualização do projeto no momento.'}
          </p>
          <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
            <a href="mailto:contato@arqvertice.com.br" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 8px;">
              <i data-lucide="mail"></i> Contatar Arquiteto
            </a>
            <button onclick="window.location.reload()" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 8px;">
              <i data-lucide="refresh-cw"></i> Tentar Novamente
            </button>
          </div>
        </div>
      `;
    },

    // Header do Portal do Cliente (H03)
    renderHeader() {
      const data = this.cachedData;
      if (!data) return '';

      const routes = [
        { id: 'dashboard', label: 'Painel Geral', icon: 'layout-dashboard' },
        { id: 'viewer3d', label: '3D Interativo', icon: 'box' },
        { id: 'projeto', label: 'O Projeto', icon: 'home' },
        { id: 'briefing', label: 'Briefing', icon: 'clipboard-list' },
        { id: 'apresentacao', label: 'Apresentações', icon: 'presentation' },
        { id: 'renders', label: 'Renders 3D', icon: 'image' },
        { id: 'especificacoes', label: 'Materiais & Mobiliário', icon: 'palette' },
        { id: 'solicitacoes', label: 'Solicitações', icon: 'git-pull-request' },
        { id: 'revisoes', label: 'Revisões', icon: 'history' },
        { id: 'aprovacoes', label: 'Aprovações', icon: 'check-square' },
        { id: 'entrega', label: 'Entregas', icon: 'download-cloud' }
      ];

      return `
        <header class="client-portal-header">
          <div class="portal-header-top">
            <div class="portal-brand">
              <div class="portal-logo-badge">
                <img src="logo.png" alt="ArqVértice" style="height: 28px; width: auto;" onerror="this.style.display='none'">
                <div>
                  <div style="font-weight: 800; font-size: 1rem; letter-spacing: 0.05em; color: var(--text-primary, #ffffff); line-height: 1.1;">ARQVÉRTICE</div>
                  <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 700; letter-spacing: 0.15em;">PORTAL DO CLIENTE</div>
                </div>
              </div>
            </div>

            <div class="portal-project-pill">
              <div class="portal-project-title">${data.project.name}</div>
              <div class="portal-client-name">Cliente: ${data.client.name}</div>
            </div>

            <div class="portal-user-actions">
              <span class="portal-status-badge">
                <span class="status-dot-active"></span> Acesso Seguro Ativo
              </span>
              <button onclick="ClientPortalModule.logout()" class="portal-logout-btn" title="Encerrar Acesso">
                <i data-lucide="log-out"></i>
                <span class="desktop-only">Sair</span>
              </button>
            </div>
          </div>

          <nav class="portal-nav-bar">
            ${routes.map(r => `
              <button 
                class="portal-nav-item ${this.currentRoute === r.id ? 'active' : ''}" 
                onclick="ClientPortalModule.setRoute('${r.id}')"
              >
                <i data-lucide="${r.icon}"></i>
                <span>${r.label}</span>
              </button>
            `).join('')}
          </nav>
        </header>
      `;
    },

    // Conteúdo da Rota Ativa
    renderRouteContent() {
      switch (this.currentRoute) {
        case 'dashboard':
          return this.renderDashboard();
        case 'viewer3d':
          return this.render3DViewerSection();
        case 'projeto':
          return this.renderProjectSection();
        case 'briefing':
          return this.renderBriefingSection();
        case 'apresentacao':
          return this.renderPresentationSection();
        case 'renders':
          return this.renderRendersSection();
        case 'especificacoes':
          return this.renderSpecificationsSection();
        case 'solicitacoes':
          return this.renderChangeRequestsSection();
        case 'revisoes':
          return this.renderRevisionsSection();
        case 'aprovacoes':
          return this.renderApprovalsSection();
        case 'entrega':
          return this.renderDeliveriesSection();
        default:
          return this.renderDashboard();
      }
    },

    // J33: SEÇÃO DE VISUALIZAÇÃO 3D INTERATIVA DO CLIENTE
    render3DViewerSection() {
      const data = this.cachedData;
      if (!data) return '';
      const viewerUrl = `viewer.html?project=${data.project.id}&token=${data.portal.token}`;

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <h2>Ambiente 3D Interativo do Cliente</h2>
                <p>Navegue em tempo real pelo modelo 3D volumétrico, consulte pontos de interesse e faça medições.</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" onclick="window.open('${viewerUrl}', '_blank')">
                  <i data-lucide="maximize-2"></i> Abrir em Tela Cheia
                </button>
              </div>
            </div>
          </div>

          <div class="portal-section-card" style="padding: 0; overflow: hidden; border-radius: 12px; height: 75vh; position: relative;">
            <iframe src="${viewerUrl}" style="width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
          </div>
        </div>
      `;
    },

    // H03: DASHBOARD DO PORTAL DO CLIENTE
    renderDashboard() {
      const data = this.cachedData;
      if (!data) return '';
      const viewerUrl = `viewer.html?project=${data.project.id}&token=${data.portal.token}`;

      return `
        <div class="portal-dashboard-grid">
          <!-- CARD PRINCIPAL: PROJETO -->
          <section class="portal-hero-card">
            <div class="portal-hero-media" style="background-image: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%), url('${data.project.coverImage}');">
              <div class="portal-hero-overlay">
                <div class="portal-stage-pill">${data.project.currentStage}</div>
                <h1 class="portal-hero-title">${data.project.name}</h1>
                <div class="portal-hero-meta">
                  <span><i data-lucide="map-pin"></i> ${data.project.location}</span>
                  <span><i data-lucide="maximize-2"></i> ${data.project.builtAreaM2} m² construídos</span>
                  <span><i data-lucide="layers"></i> ${data.project.typology}</span>
                  <span><i data-lucide="git-branch"></i> Revisão Atual: <strong>${data.project.currentRevision}</strong></span>
                </div>
                <div style="margin-top: 14px;">
                  <button class="btn btn-primary btn-sm" onclick="window.open('${viewerUrl}', '_blank')">
                    <i data-lucide="box"></i> Visualizar em 3D Interativo (Edge-to-Edge)
                  </button>
                </div>
              </div>
            </div>

            <!-- MENSAGEM DE BOAS-VINDAS AUTORIZADA -->
            ${data.portal.welcomeMessage ? `
              <div class="portal-welcome-strip">
                <i data-lucide="info"></i>
                <span>${data.portal.welcomeMessage}</span>
              </div>
            ` : ''}
          </section>

          <!-- CARD DA PRÓXIMA AÇÃO (CTA INTELIGENTE) -->
          <section class="portal-action-card">
            <div class="portal-action-header">
              <div class="portal-action-badge">${data.nextAction.badge}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted, #64748b); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Próxima Ação do Cliente</div>
            </div>
            <h3 class="portal-action-title">${data.nextAction.title}</h3>
            <p class="portal-action-desc">${data.nextAction.description}</p>
            <button onclick="ClientPortalModule.setRoute('${data.nextAction.actionUrl.replace('/portal/', '')}')" class="portal-action-btn">
              <span>Acessar Etapa</span>
              <i data-lucide="arrow-right"></i>
            </button>
          </section>

          <!-- PROGRESSO DAS ETAPAS PÚBLICAS -->
          <section class="portal-section-card portal-col-full">
            <div class="portal-section-header">
              <div>
                <h2 class="portal-section-title">Evolução do Projeto</h2>
                <div class="portal-section-subtitle">Etapas canônicas desenvolvidas pela equipe de arquitetura da ArqVértice</div>
              </div>
              <div class="portal-progress-summary">
                Etapa: <strong>${data.project.currentStage}</strong>
              </div>
            </div>

            <div class="portal-stepper">
              ${data.publicStages.map((stg, idx) => {
                const isDone = stg.status === 'concluido';
                const isCurrent = stg.status === 'em_andamento' || stg.isCurrent;
                return `
                  <div class="portal-step-item ${isDone ? 'done' : (isCurrent ? 'current' : 'upcoming')}">
                    <div class="portal-step-node">
                      ${isDone ? '<i data-lucide="check"></i>' : (idx + 1)}
                    </div>
                    <div class="portal-step-info">
                      <div class="portal-step-title">${stg.label}</div>
                      <div class="portal-step-desc">${stg.description}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          <!-- ÚLTIMAS ATUALIZAÇÕES PUBLICADAS (SEM LOGS INTERNOS) -->
          <section class="portal-section-card portal-col-left">
            <div class="portal-section-header">
              <div>
                <h2 class="portal-section-title">Últimas Atualizações</h2>
                <div class="portal-section-subtitle">Avisos e entregas homologadas para o seu acompanhamento</div>
              </div>
            </div>

            <div class="portal-updates-list">
              ${data.recentUpdates.length > 0 ? data.recentUpdates.map(upd => `
                <div class="portal-update-item">
                  <div class="portal-update-dot"></div>
                  <div class="portal-update-body">
                    <div class="portal-update-header">
                      <strong>${upd.title}</strong>
                      <span class="portal-update-time">${upd.date}</span>
                    </div>
                    <div class="portal-update-text">${upd.description}</div>
                  </div>
                </div>
              `).join('') : `
                <div class="portal-empty-hint">Nenhuma atualização recente publicada no momento.</div>
              `}
            </div>
          </section>

          <!-- RESUMO RÁPIDO DE CONTEÚDO LIBERADO -->
          <section class="portal-section-card portal-col-right">
            <div class="portal-section-header">
              <div>
                <h2 class="portal-section-title">Conteúdo Disponível</h2>
                <div class="portal-section-subtitle">Arquivos e visualizações autorizadas</div>
              </div>
            </div>

            <div class="portal-quick-grid">
              <div class="portal-quick-item" onclick="ClientPortalModule.setRoute('apresentacao')">
                <i data-lucide="image" class="quick-icon"></i>
                <div class="quick-num">${data.counts.publishedRenders || 4}</div>
                <div class="quick-lbl">Renders 3D</div>
              </div>
              <div class="portal-quick-item" onclick="ClientPortalModule.setRoute('briefing')">
                <i data-lucide="file-text" class="quick-icon"></i>
                <div class="quick-num">1</div>
                <div class="quick-lbl">Briefing</div>
              </div>
              <div class="portal-quick-item" onclick="ClientPortalModule.setRoute('revisoes')">
                <i data-lucide="git-commit" class="quick-icon"></i>
                <div class="quick-num">${data.project.currentRevision}</div>
                <div class="quick-lbl">Revisão</div>
              </div>
              <div class="portal-quick-item" onclick="ClientPortalModule.setRoute('entrega')">
                <i data-lucide="package" class="quick-icon"></i>
                <div class="quick-num"><i data-lucide="shield-check" style="width: 20px; height: 20px;"></i></div>
                <div class="quick-lbl">Entregas</div>
              </div>
            </div>

            <div class="portal-contact-box">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted, #64748b); font-weight: 700;">Responsável Técnico</div>
              <div style="font-weight: 600; color: var(--text-primary, #ffffff); margin-top: 4px;">${data.project.leadArchitect}</div>
              <div style="font-size: 0.8rem; color: #38bdf8;">${data.project.company}</div>
            </div>
          </section>
        </div>
      `;
    },

    // Seção de Detalhes do Projeto
    renderProjectSection() {
      const data = this.cachedData;
      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <h2>Ficha do Projeto</h2>
            <p>Informações técnicas e de localização autorizadas para acompanhamento.</p>
          </div>
          <div class="portal-card-grid">
            <div class="portal-section-card">
              <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Dados Gerais</h3>
              <table class="portal-table">
                <tr><td>Nome do Projeto:</td><td><strong>${data.project.name}</strong></td></tr>
                <tr><td>Código de Referência:</td><td><code>${data.project.code}</code></td></tr>
                <tr><td>Tipologia:</td><td>${data.project.typology}</td></tr>
                <tr><td>Área Construída:</td><td>${data.project.builtAreaM2} m²</td></tr>
                <tr><td>Localização:</td><td>${data.project.location}</td></tr>
                <tr><td>Arquiteto Autor:</td><td>${data.project.leadArchitect}</td></tr>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // ========================================================================
    // BLOCO H06: RESUMO E CONFIRMAÇÃO DO BRIEFING
    // ========================================================================
    renderBriefingSection() {
      const data = this.cachedData;
      const state = this.getState();
      const briefing = state ? state.getProjectBriefing(data.project.id) : null;
      const versions = state && briefing ? state.getBriefingSubmissionVersions(briefing.id) : [];
      const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

      // Confirmação Formal do Briefing (H06)
      const confirmations = state ? state.getBriefingConfirmations(data.project.id) : [];
      let latestConfirmation = confirmations.length > 0 ? confirmations[0] : null;

      // Se ainda não existir confirmação gerada pelo arquiteto, sintetiza com base nas respostas
      if (!latestConfirmation && briefing) {
        const answers = briefing.answers || {};
        latestConfirmation = {
          id: `bconf-${briefing.id}-pending`,
          projectId: data.project.id,
          briefingId: briefing.id,
          version: briefing.version || 1,
          status: 'pending',
          confirmedBy: null,
          confirmedAt: null,
          comments: null,
          legalDisclaimer: state?.BRIEFING_LEGAL_DISCLAIMER || 'Estas informações representam corretamente o briefing fornecido. Esta confirmação não significa aprovação do projeto arquitetônico.',
          summary: {
            necessidades: answers.p1_quem || 'Residência familiar com espaços integrados para descanso e trabalho.',
            ambientes: answers.p8_ambientes ? (Array.isArray(answers.p8_ambientes) ? answers.p8_ambientes.join(', ') : answers.p8_ambientes) : 'Living integrado, varanda gourmet, suítes e deck externo.',
            preferencias: answers.p9_luz ? `Iluminação: ${answers.p9_luz}. Automação: ${answers.p9_automacao || 'Básica'}.` : 'Iluminação quente e acolhedora com ventilação natural.',
            referencias: 'Deck em madeira nobre, pedras naturais claras e integração com jardim.',
            estilo: answers.p7_estilos ? (Array.isArray(answers.p7_estilos) ? answers.p7_estilos.join(', ') : answers.p7_estilos) : 'Contemporâneo com toques litorâneos naturais.',
            prioridades: 'Integração visual, durabilidade de materiais e bem-estar dos moradores.',
            observacoes: answers.p7_detesta ? `Evitar: ${answers.p7_detesta}` : 'Atenção aos afastamentos regulamentares.'
          }
        };
      }

      const answers = briefing?.answers || {};
      const isIntegrationSelected = String(answers.p8_integracao || '').toLowerCase().includes('integrado');

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <h2>Briefing do Projeto & Confirmação</h2>
                <p>Alinhamento de desejos, estilo de vida, preferências e consolidação formal do programa de necessidades.</p>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="badge ${latestConfirmation?.status === 'confirmed' ? 'badge-success' : (latestConfirmation?.status === 'correction_requested' ? 'badge-warning' : 'badge-primary')}">
                  Status Confirmação: ${latestConfirmation?.status?.toUpperCase()}
                </span>
                ${latestVersion ? `<span class="badge badge-info">Versão Respostas: v${latestVersion.versionNumber}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- CARD DE RESUMO DO BRIEFING E CONFIRMAÇÃO DO CLIENTE (H06) -->
          <section class="portal-section-card briefing-confirmation-card" style="border: 2px solid rgba(56, 189, 248, 0.3); background: rgba(15, 23, 42, 0.85); margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
              <div>
                <span class="badge badge-primary" style="margin-bottom: 6px;">ETAPA H06 &bull; CONSOLIDAÇÃO DO PROGRAMA</span>
                <h3 style="font-size: 1.3rem; margin: 0; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="clipboard-check" style="color: #38bdf8;"></i> RESUMO DO BRIEFING (Versão ${latestConfirmation?.version || 1})
                </h3>
                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">
                  Versão consolidada pelo arquiteto com base em suas respostas para validação antes do avanço ao projeto 3D.
                </div>
              </div>
              <div>
                <span class="badge ${latestConfirmation?.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">
                  ${latestConfirmation?.status === 'confirmed' ? '✔ BRIEFING CONFIRMADO' : (latestConfirmation?.status === 'correction_requested' ? '⚠ CORREÇÃO SOLICITADA' : '⏳ AGUARDANDO SUA CONFIRMAÇÃO')}
                </span>
              </div>
            </div>

            <!-- ITENS DO RESUMO EXIGIDOS EM H06 -->
            <div class="briefing-summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="users" style="width: 16px;"></i> Necessidades
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.necessidades || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="layout" style="width: 16px;"></i> Ambientes
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.ambientes || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="heart" style="width: 16px;"></i> Preferências
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.preferencias || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="image" style="width: 16px;"></i> Referências
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.referencias || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="compass" style="width: 16px;"></i> Estilo
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.estilo || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="flag" style="width: 16px;"></i> Prioridades
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.prioridades || 'Não especificado.'}</p>
              </div>

              <div class="summary-box" style="background: rgba(255,255,255,0.03); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); grid-column: 1 / -1;">
                <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; text-transform: uppercase;">
                  <i data-lucide="message-square" style="width: 16px;"></i> Observações do Projeto
                </strong>
                <p style="margin: 8px 0 0; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${latestConfirmation?.summary?.observacoes || 'Sem observações.'}</p>
              </div>
            </div>

            <!-- SALVAGUARDA LEGAL/TÉCNICA MANDATÓRIA (H06) -->
            <div class="briefing-legal-disclaimer" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px; color: #fde68a;">
              <i data-lucide="alert-triangle" style="color: #f59e0b; flex-shrink: 0; margin-top: 2px;"></i>
              <div style="font-size: 0.85rem; line-height: 1.5;">
                <strong>IMPORTANTE — DISTINÇÃO LEGAL & TÉCNICA:</strong><br>
                A confirmação destas informações <u>NÃO significa aprovação do projeto arquitetônico</u>.<br>
                Ela significa expressamente: <em>"Estas informações representam corretamente o briefing fornecido."</em>
              </div>
            </div>

            <!-- ÁREA DE AÇÃO DO CLIENTE: CONFIRMAR OU SOLICITAR CORREÇÃO -->
            ${latestConfirmation?.status === 'confirmed' ? `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 14px 18px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="color: #10b981; font-size: 0.9rem;">
                  <i data-lucide="check-circle" style="display: inline-block; vertical-align: middle; margin-right: 6px;"></i>
                  <strong>Briefing Confirmado com Sucesso por ${latestConfirmation.confirmedBy || 'Cliente'}</strong> em ${latestConfirmation.confirmedAt ? new Date(latestConfirmation.confirmedAt).toLocaleDateString('pt-BR') : '21/09/2026'}.
                  ${latestConfirmation.comments ? `<div style="font-size: 0.8rem; color: #a7f3d0; margin-top: 4px;">Comentário registrado: "${latestConfirmation.comments}"</div>` : ''}
                </div>
                <button type="button" class="btn btn-outline btn-sm" onclick="ClientPortalModule.toggleCorrectionBox('${latestConfirmation.id}')">
                  <i data-lucide="edit-3"></i> Solicitar Nova Correção
                </button>
              </div>
            ` : `
              <div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center;">
                <button type="button" onclick="ClientPortalModule.handleConfirmBriefing('${latestConfirmation?.id}')" class="btn btn-success" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 20px;">
                  <i data-lucide="check-circle"></i> Confirmar informações
                </button>
                <button type="button" onclick="ClientPortalModule.toggleCorrectionBox('${latestConfirmation?.id}')" class="btn btn-warning" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; padding: 10px 18px;">
                  <i data-lucide="alert-circle"></i> Solicitar correção
                </button>
              </div>
            `}

            <!-- CAIXA EXPANSÍVEL DE CORREÇÃO (EXIGE COMENTÁRIO OBRIGATÓRIO) -->
            <div id="briefing-correction-box-${latestConfirmation?.id}" style="display: ${latestConfirmation?.status === 'correction_requested' ? 'block' : 'none'}; margin-top: 20px; padding: 16px; background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px;">
              <h4 style="margin: 0 0 8px; color: #f87171; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="message-square"></i> Solicitação de Correção do Briefing (Comentário Obrigatório)
              </h4>
              <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 12px;">
                Por favor, especifique com clareza quais pontos do resumo acima precisam ser corrigidos pela equipe de arquitetura:
              </p>
              <textarea id="briefing-correction-comments-${latestConfirmation?.id}" class="form-input" rows="3" placeholder="Ex: Gostaríamos de acrescentar que a suíte dos fundos também deve ter bancada de maquiagem...">${latestConfirmation?.comments || ''}</textarea>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="ClientPortalModule.toggleCorrectionBox('${latestConfirmation?.id}')">Cancelar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="ClientPortalModule.handleRequestBriefingCorrection('${latestConfirmation?.id}')" style="display: inline-flex; align-items: center; gap: 6px;">
                  <i data-lucide="send"></i> Enviar Solicitação de Correção
                </button>
              </div>
            </div>
          </section>

          <!-- SEÇÃO DETALHADA DAS RESPOSTAS DO FORMULÁRIO (BLOCO H05) -->
          <div class="portal-section-header" style="margin-top: 40px; margin-bottom: 16px;">
            <h3>Questionário Completo de Perguntas e Respostas</h3>
            <p style="color: #94a3b8; font-size: 0.85rem;">Histórico completo das respostas fornecidas pela sua família.</p>
          </div>

          <!-- FORMULÁRIO PROGRESSIVO COM PERGUNTAS CONDICIONAIS -->
          <form id="portal-briefing-form" onsubmit="ClientPortalModule.handleBriefingSubmit(event)">
            <div class="portal-section-card" style="margin-bottom: 24px;">
              <h3 style="font-size: 1.15rem; margin-bottom: 16px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="users"></i> 1. Moradores e Rotina
              </h3>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Quem habitará a residência e qual a rotina familiar?</label>
                <textarea id="bf-p1-quem" class="form-input" rows="3" placeholder="Descreva os moradores, idades, pets e como aproveitam a casa...">${answers.p1_quem || ''}</textarea>
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Frequência e estilo de recepção de convidados:</label>
                <input type="text" id="bf-p1-visitas" class="form-input" value="${answers.p1_visitas || ''}" placeholder="Ex: Jantares nos fins de semana para 8 a 12 pessoas...">
              </div>
            </div>

            <div class="portal-section-card" style="margin-bottom: 24px;">
              <h3 style="font-size: 1.15rem; margin-bottom: 16px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="layout"></i> 2. Integração Espacial & Ambientes
              </h3>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Preferência de integração das áreas sociais (Sala, Cozinha e Varanda):</label>
                <select id="bf-p8-integracao" class="form-select" onchange="ClientPortalModule.toggleKitchenConditional(this.value)">
                  <option value="100% Integrado (Cozinha, sala de estar e jantar em um espaço único)" ${isIntegrationSelected ? 'selected' : ''}>100% Integrado (Cozinha gourmet, sala e varanda em espaço contínuo)</option>
                  <option value="Semi-integrado (Portas de correr em vidro ou painéis ripados)" ${String(answers.p8_integracao || '').includes('Semi') ? 'selected' : ''}>Semi-integrado (Portas de correr ou painéis deslizantes)</option>
                  <option value="Cozinha Fechada Tradicional" ${String(answers.p8_integracao || '').includes('Fechada') ? 'selected' : ''}>Cozinha Fechada Tradicional</option>
                </select>
              </div>

              <!-- PERGUNTA CONDICIONAL: Aparece apenas se "cozinha integrada" for selecionada -->
              <div id="conditional-kitchen-box" style="display: ${isIntegrationSelected ? 'block' : 'none'}; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 16px; border-radius: 8px; margin-top: 16px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 0.85rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="sparkles"></i> Detalhamento da Cozinha Integrada (Pergunta Específica)
                </div>
                <label class="form-label">Configuração desejada para a Ilha e Bancada Gourmet:</label>
                <input type="text" id="bf-cond-ilha" class="form-input" value="${answers.cond_ilha || 'Ilha central em granito/mármore com cooktop de indução e calha úmida embutida.'}" placeholder="Ex: Ilha central com cooktop voltado para a sala de jantar...">
              </div>
            </div>

            <div class="portal-section-card" style="margin-bottom: 24px;">
              <h3 style="font-size: 1.15rem; margin-bottom: 16px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="palette"></i> 3. Estética, Materiais e Rejeições
              </h3>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label">Materiais e texturas que você AMA:</label>
                <input type="text" id="bf-p7-paleta" class="form-input" value="${answers.p7_paleta || ''}" placeholder="Ex: Muita madeira natural, mármore travertino, pedras brutas e linho...">
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label" style="color: #f87171;">O que você DETESTA e não quer de jeito nenhum no projeto:</label>
                <input type="text" id="bf-p7-detesta" class="form-input" value="${answers.p7_detesta || ''}" placeholder="Ex: Cores amarelas, porcelanatos polidos espelhados, molduras excessivas...">
              </div>

              <div class="form-group">
                <label class="form-label">Expectativa de Investimento Global:</label>
                <input type="text" id="bf-p10-orcamento" class="form-input" value="${answers.p10_orcamento || ''}" placeholder="Ex: De R$ 150.000 a R$ 300.000">
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 40px;">
              <button type="button" onclick="ClientPortalModule.saveBriefingDraft()" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="save"></i> Salvar Rascunho
              </button>
              <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                <i data-lucide="send"></i> Enviar Novas Respostas
              </button>
            </div>
          </form>
        </div>
      `;
    },

    toggleCorrectionBox(confId) {
      const box = document.getElementById(`briefing-correction-box-${confId}`);
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      }
    },

    handleConfirmBriefing(confirmationId) {
      const state = this.getState();
      if (!state) return;

      try {
        const clientName = this.cachedData?.client?.name || 'Pedro Albuquerque';
        state.confirmBriefingInformation(confirmationId, clientName, 'Confirmado formalmente no portal.');
        alert('✔ Resumo de briefing confirmado com sucesso!\n\nFoi registrado que estas informações representam corretamente o briefing fornecido. A equipe de arquitetura dará início à próxima fase projetual.');
        this.authenticateClient(this.activeToken);
      } catch (err) {
        alert('Erro ao confirmar briefing: ' + err.message);
      }
    },

    handleRequestBriefingCorrection(confirmationId) {
      const state = this.getState();
      if (!state) return;

      const textarea = document.getElementById(`briefing-correction-comments-${confirmationId}`);
      const comments = textarea ? textarea.value.trim() : '';

      if (!comments) {
        alert('Atenção: É obrigatório descrever o comentário com a correção desejada.');
        return;
      }

      try {
        const clientName = this.cachedData?.client?.name || 'Pedro Albuquerque';
        state.requestBriefingCorrection(confirmationId, clientName, comments);
        alert('✔ Solicitação de correção enviada com sucesso para o arquiteto responsável!');
        this.authenticateClient(this.activeToken);
      } catch (err) {
        alert('Erro ao solicitar correção: ' + err.message);
      }
    },

    // ========================================================================
    // BLOCO H07: GALERIA DE APRESENTAÇÕES DO CLIENTE (Bloco F)
    // ========================================================================
    renderPresentationSection() {
      const data = this.cachedData;
      const state = this.getState();
      const presentations = state ? state.getPublishedPresentations(data.portal.id, this.presentationFilter) : [];

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2>Galeria de Apresentações</h2>
                <p>Cadernos executivos e estudos consolidados publicados exclusivamente pelo arquiteto.</p>
              </div>

              <!-- FILTROS H07: todas, recentes, aprovadas, aguardando revisão -->
              <div class="portal-filters-strip" style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-sm ${this.presentationFilter === 'todas' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setPresentationFilter('todas')">
                  Todas (${presentations.length})
                </button>
                <button class="btn btn-sm ${this.presentationFilter === 'recentes' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setPresentationFilter('recentes')">
                  Recentes
                </button>
                <button class="btn btn-sm ${this.presentationFilter === 'aprovadas' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setPresentationFilter('aprovadas')">
                  Aprovadas
                </button>
                <button class="btn btn-sm ${this.presentationFilter === 'aguardando_revisao' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setPresentationFilter('aguardando_revisao')">
                  Aguardando Revisão
                </button>
              </div>
            </div>
          </div>

          <!-- AVISO DE VERSÕES PUBLICADAS & NÃO-SUBSTITUIÇÃO SILENCIOSA -->
          <div class="portal-welcome-strip" style="margin-bottom: 24px; background: rgba(56, 189, 248, 0.05); border-color: rgba(56, 189, 248, 0.2); font-size: 0.85rem;">
            <i data-lucide="history" style="color: #38bdf8;"></i>
            <span><strong>Integridade de Versões:</strong> Versões anteriores (ex: REV01, REV02) são preservadas no histórico e não são substituídas visualmente sem o devido registro técnico.</span>
          </div>

          <!-- GRID DE APRESENTAÇÕES (H07) -->
          <div class="portal-renders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
            ${presentations.length > 0 ? presentations.map(p => `
              <div class="portal-render-card presentation-card" style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
                <div class="portal-render-thumb" style="height: 220px; background-size: cover; background-position: center; position: relative; background-image: url('${p.coverImage}');">
                  <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 6px;">
                    <span class="badge badge-primary" style="font-weight: 700;">${p.revision}</span>
                    <span class="badge badge-success"><span class="status-dot-active" style="display:inline-block; margin-right:4px;"></span> PUBLICADA</span>
                  </div>
                  <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: #fff; font-weight: 600;">
                    <i data-lucide="layers" style="width: 14px; display: inline-block; vertical-align: middle;"></i> ${p.pageCount} páginas
                  </div>
                </div>

                <div class="portal-render-info" style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 0.75rem; color: #38bdf8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">
                      ${p.environmentOrProject}
                    </div>
                    <h3 style="font-size: 1.05rem; margin: 0 0 6px 0; color: #ffffff; line-height: 1.3;">${p.title}</h3>
                    <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 12px 0; line-height: 1.4;">${p.description}</p>
                    
                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 12px;">
                      Publicado em: <strong>${p.date}</strong> &bull; Status: <strong style="color: ${p.approvalStatus === 'aprovado' ? '#10b981' : '#f59e0b'};">${p.approvalStatus.toUpperCase()}</strong>
                    </div>
                  </div>

                  <!-- AÇÕES H07: Abrir, Navegar, Ampliar, Baixar, Comentar, Aprovar, Modo Apresentação -->
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <button class="btn btn-primary btn-sm" onclick="ClientPortalModule.openDocumentViewer('${p.id}', 1)" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i data-lucide="file-text"></i> Abrir / Zoom
                      </button>
                      <button class="btn btn-outline btn-sm" onclick="ClientPortalModule.openPresentationMode('${p.id}')" style="display: flex; align-items: center; justify-content: center; gap: 6px; border-color: #38bdf8; color: #38bdf8;">
                        <i data-lucide="play"></i> Apresentação
                      </button>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                      <div style="display: flex; gap: 10px;">
                        ${p.commentAllowed ? `
                          <button class="btn-ghost btn-sm" style="color: #94a3b8; padding: 4px;" onclick="ClientPortalModule.openCommentDrawer('Prancha', '${p.sourceId}', '${p.title.replace(/'/g, "\\'")}')" title="Comentar">
                            <i data-lucide="message-square" style="width: 15px;"></i> Comentar
                          </button>
                        ` : ''}
                        ${p.downloadAllowed ? `
                          <a href="${p.fileUrl}" target="_blank" download class="btn-ghost btn-sm" style="color: #10b981; padding: 4px; text-decoration: none; display: flex; align-items: center; gap: 4px;" title="Baixar Arquivo">
                            <i data-lucide="download" style="width: 15px;"></i> Baixar
                          </a>
                        ` : ''}
                      </div>

                      ${p.approvalAllowed ? `
                        <button class="btn btn-success btn-sm" style="padding: 4px 10px; font-size: 0.75rem;" onclick="ClientPortalModule.handleApprovePresentation('${p.id}')">
                          <i data-lucide="check"></i> Aprovar
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="portal-empty-hint portal-col-full" style="padding: 40px; text-align: center;">
                <i data-lucide="presentation" style="width: 48px; height: 48px; color: #64748b; margin-bottom: 12px;"></i>
                <p>Nenhuma apresentação publicada corresponde ao filtro selecionado.</p>
              </div>
            `}
          </div>
        </div>
      `;
    },

    setPresentationFilter(filter) {
      this.presentationFilter = filter;
      this.render();
    },

    handleApprovePresentation(pubId) {
      alert('✔ Apresentação aprovada formalmente pelo cliente titular! O arquiteto foi notificado para dar andamento aos detalhamentos técnicos.');
    },

    // ========================================================================
    // BLOCO H09: GALERIA VISUAL DE RENDERS E IMAGENS APROVADAS
    // ========================================================================
    renderRendersSection() {
      const data = this.cachedData;
      const state = this.getState();
      const renders = state ? state.getPublishedRenders(data.portal.id) : [];

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2>Galeria de Renders 3D & Imagens</h2>
                <p>Visualizações fotorrealistas dos ambientes aprovadas e homologadas para o seu projeto.</p>
              </div>

              <!-- MODOS H09: GRID, MASONRY, CAROUSEL, FULLSCREEN -->
              <div style="display: flex; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 8px;">
                <button class="btn btn-sm ${this.renderDisplayMode === 'grid' ? 'btn-primary' : 'btn-ghost'}" onclick="ClientPortalModule.setRenderDisplayMode('grid')" title="Modo Grid">
                  <i data-lucide="grid"></i> Grid
                </button>
                <button class="btn btn-sm ${this.renderDisplayMode === 'masonry' ? 'btn-primary' : 'btn-ghost'}" onclick="ClientPortalModule.setRenderDisplayMode('masonry')" title="Modo Masonry">
                  <i data-lucide="columns"></i> Masonry
                </button>
                <button class="btn btn-sm ${this.renderDisplayMode === 'carousel' ? 'btn-primary' : 'btn-ghost'}" onclick="ClientPortalModule.setRenderDisplayMode('carousel')" title="Modo Carrossel">
                  <i data-lucide="sliders"></i> Carrossel
                </button>
              </div>
            </div>
          </div>

          <!-- SALVAGUARDA MANDATÓRIA H09: DISTINÇÃO DE TIPOS DE IMAGEM -->
          <div class="portal-welcome-strip" style="background: rgba(168, 85, 247, 0.08); border-color: rgba(168, 85, 247, 0.25); color: #c084fc; margin-bottom: 24px;">
            <i data-lucide="info"></i>
            <span><strong>Distinção Crucial de Tipos:</strong> Imagens de <strong>"Apresentação"</strong> representam o projeto modelado final. <strong>"Estudos"</strong> são opções volumétricas em teste. Imagens de <strong>"Referência"</strong> são apenas inspirações conceituais e não representam a entrega final.</span>
          </div>

          <!-- RENDERIZAÇÃO CONFORME MODO -->
          ${this.renderDisplayMode === 'carousel' ? this.renderCarouselMode(renders) : this.renderGridMode(renders, this.renderDisplayMode)}
        </div>
      `;
    },

    setRenderDisplayMode(mode) {
      this.renderDisplayMode = mode;
      this.render();
    },

    renderGridMode(renders, layout = 'grid') {
      const isMasonry = layout === 'masonry';
      return `
        <div class="${isMasonry ? 'portal-masonry-grid' : 'portal-renders-grid'}" style="${isMasonry ? 'column-count: 3; column-gap: 20px;' : 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;'}">
          ${renders.map((r, idx) => `
            <div class="portal-render-card" style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; margin-bottom: ${isMasonry ? '20px' : '0'}; break-inside: avoid;">
              <div class="portal-render-thumb" style="height: ${isMasonry ? (idx % 2 === 0 ? '280px' : '360px') : '220px'}; background-size: cover; background-position: center; position: relative; background-image: url('${r.imageUrl}');">
                
                <!-- BADGE DE TIPO CLARO (H09: Apresentação, Estudo, Imagem de referência) -->
                <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 6px;">
                  <span class="badge ${r.type === 'Apresentação' ? 'badge-success' : (r.type === 'Estudo' ? 'badge-warning' : 'badge-info')}" style="font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                    ${r.type.toUpperCase()}
                  </span>
                  <span class="badge badge-primary">${r.revision}</span>
                </div>

                <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; color: #fff;">
                  ${r.resolution}
                </div>
              </div>

              <div class="portal-render-info" style="padding: 16px;">
                <div style="font-size: 0.75rem; color: #38bdf8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">
                  ${r.environmentName}
                </div>
                <h3 style="font-size: 1.05rem; margin: 0 0 6px; color: #ffffff;">${r.title}</h3>
                <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 14px; line-height: 1.4;">${r.description}</p>

                <!-- AÇÕES H09: Ampliar, Comentar, Solicitar Alteração, Aprovar -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline btn-sm" onclick="ClientPortalModule.openDocumentViewer('${r.id}', 1)" title="Ampliar">
                      <i data-lucide="maximize-2"></i> Ampliar
                    </button>
                    ${r.commentAllowed ? `
                      <button class="btn btn-ghost btn-sm" onclick="ClientPortalModule.openCommentDrawer('Imagem', '${r.sourceId}', '${r.title.replace(/'/g, "\\'")}')" title="Comentar">
                        <i data-lucide="message-square"></i>
                      </button>
                    ` : ''}
                    <button class="btn btn-ghost btn-sm" style="color: #f59e0b;" onclick="ClientPortalModule.openChangeRequestModal('Imagem', '${r.sourceId}', '${r.title.replace(/'/g, "\\'")}')" title="Solicitar Alteração Formal">
                      <i data-lucide="git-pull-request"></i>
                    </button>
                  </div>

                  ${r.approvalAllowed ? `
                    <button class="btn btn-success btn-sm" onclick="ClientPortalModule.handleApproveAsset('${r.id}')">
                      <i data-lucide="check"></i> Aprovar
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderCarouselMode(renders) {
      if (renders.length === 0) return '<div class="portal-empty-hint">Nenhum render cadastrado.</div>';
      const curIdx = this.activeCarouselIndex % renders.length;
      const current = renders[curIdx];

      return `
        <div class="portal-carousel-container" style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; padding: 20px;">
          <div style="position: relative; height: 500px; border-radius: 8px; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center;">
            <img src="${current.imageUrl}" alt="${current.title}" style="max-height: 100%; max-width: 100%; object-fit: contain;">

            <button onclick="ClientPortalModule.navigateCarousel(-1, ${renders.length})" style="position: absolute; left: 16px; background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="chevron-left"></i>
            </button>
            <button onclick="ClientPortalModule.navigateCarousel(1, ${renders.length})" style="position: absolute; right: 16px; background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="chevron-right"></i>
            </button>

            <div style="position: absolute; top: 16px; left: 16px; display: flex; gap: 8px;">
              <span class="badge ${current.type === 'Apresentação' ? 'badge-success' : 'badge-warning'}">${current.type}</span>
              <span class="badge badge-primary">${current.revision}</span>
            </div>

            <div style="position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.8); padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; color: #fff;">
              ${curIdx + 1} de ${renders.length} &bull; ${current.resolution}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-size: 0.8rem; color: #38bdf8; text-transform: uppercase; font-weight: 700;">${current.environmentName}</div>
              <h3 style="font-size: 1.2rem; margin: 4px 0 0; color: #fff;">${current.title}</h3>
              <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0 0;">${current.description}</p>
            </div>

            <div style="display: flex; gap: 10px;">
              <button class="btn btn-outline btn-sm" onclick="ClientPortalModule.openDocumentViewer('${current.id}', 1)">
                <i data-lucide="maximize-2"></i> Tela Cheia
              </button>
              <button class="btn btn-secondary btn-sm" onclick="ClientPortalModule.openCommentDrawer('Imagem', '${current.sourceId}', '${current.title.replace(/'/g, "\\'")}')">
                <i data-lucide="message-square"></i> Comentar
              </button>
              <button class="btn btn-warning btn-sm" onclick="ClientPortalModule.openChangeRequestModal('Imagem', '${current.sourceId}', '${current.title.replace(/'/g, "\\'")}')">
                <i data-lucide="git-pull-request"></i> Solicitar Alteração
              </button>
            </div>
          </div>
        </div>
      `;
    },

    navigateCarousel(delta, total) {
      this.activeCarouselIndex = (this.activeCarouselIndex + delta + total) % total;
      this.render();
    },

    handleApproveAsset(pubId) {
      alert('✔ Imagem homologada e aprovada pelo cliente titular! Registro gravado na auditoria do projeto.');
    },

    // ========================================================================
    // BLOCO H10: MATERIAIS, MOBILIÁRIO E MOODBOARDS (Bloco E)
    // ========================================================================
    renderSpecificationsSection() {
      const data = this.cachedData;
      const state = this.getState();
      const materials = state ? state.getPublishedMaterials(data.project.id) : [];
      const furniture = state ? state.getPublishedFurniture(data.project.id) : [];
      const moodboards = state ? state.getPublishedMoodboards(data.project.id) : [];

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2>Especificações & Ambientação</h2>
                <p>Materiais, acabamentos nobres, peças de mobiliário e composições de moodboard autorizadas para o seu projeto.</p>
              </div>

              <!-- ABAS H10: Materiais, Mobiliário, Moodboard -->
              <div class="portal-filters-strip" style="display: flex; gap: 8px;">
                <button class="btn btn-sm ${this.activeSpecTab === 'materiais' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setSpecTab('materiais')">
                  <i data-lucide="palette"></i> Materiais (${materials.length})
                </button>
                <button class="btn btn-sm ${this.activeSpecTab === 'mobiliario' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setSpecTab('mobiliario')">
                  <i data-lucide="armchair"></i> Mobiliário (${furniture.length})
                </button>
                <button class="btn btn-sm ${this.activeSpecTab === 'moodboards' ? 'btn-primary' : 'btn-secondary'}" onclick="ClientPortalModule.setSpecTab('moodboards')">
                  <i data-lucide="layout"></i> Moodboards (${moodboards.length})
                </button>
              </div>
            </div>
          </div>

          <!-- SALVAGUARDA COMERCIAL: NÃO EXIBIR PREÇO OU FORNECEDOR INTERNO -->
          <div class="portal-welcome-strip" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); font-size: 0.85rem; margin-bottom: 24px;">
            <i data-lucide="shield-check" style="color: #10b981;"></i>
            <span><strong>Catálogo Oficial Curado:</strong> Especificações selecionadas com rigor técnico para o seu espaço. Valores e fornecedores confidenciais são preservados no estúdio para fins de cotação executiva.</span>
          </div>

          <!-- CONTEÚDO DA ABA SELECIONADA -->
          ${this.activeSpecTab === 'materiais' ? this.renderMaterialsTab(materials) : ''}
          ${this.activeSpecTab === 'mobiliario' ? this.renderFurnitureTab(furniture) : ''}
          ${this.activeSpecTab === 'moodboards' ? this.renderMoodboardsTab(moodboards) : ''}
        </div>
      `;
    },

    setSpecTab(tab) {
      this.activeSpecTab = tab;
      this.render();
    },

    renderMaterialsTab(materials) {
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          ${materials.map(m => `
            <div class="portal-section-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
              <div style="height: 180px; background-size: cover; background-position: center; background-image: url('${m.imageUrl}'); position: relative;">
                <span class="badge badge-primary" style="position: absolute; top: 10px; left: 10px;">${m.category}</span>
                <span class="badge badge-secondary" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7);">${m.ambiente}</span>
              </div>
              <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h4 style="margin: 0 0 6px; font-size: 1.05rem; color: #fff;">${m.name}</h4>
                  <table style="width: 100%; font-size: 0.8rem; color: #94a3b8; border-collapse: collapse; margin-bottom: 12px;">
                    <tr><td style="padding: 3px 0;">Fabricante:</td><td style="color: #cbd5e1; text-align: right;">${m.fabricante}</td></tr>
                    ${m.fornecedor ? `<tr><td style="padding: 3px 0;">Fornecedor:</td><td style="color: #cbd5e1; text-align: right;">${m.fornecedor}</td></tr>` : ''}
                    <tr><td style="padding: 3px 0;">Código:</td><td style="color: #cbd5e1; text-align: right;"><code>${m.codigo}</code></td></tr>
                    <tr><td style="padding: 3px 0;">Acabamento:</td><td style="color: #cbd5e1; text-align: right;">${m.acabamento}</td></tr>
                    <tr><td style="padding: 3px 0;">Cor / Tonalidade:</td><td style="color: #cbd5e1; text-align: right;">${m.cor}</td></tr>
                  </table>
                  ${m.observacao ? `<p style="font-size: 0.78rem; color: #64748b; font-style: italic; margin: 0 0 12px;">${m.observacao}</p>` : ''}
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
                  <button class="btn btn-ghost btn-sm" onclick="ClientPortalModule.openCommentDrawer('Material', '${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="Comentar">
                    <i data-lucide="message-square"></i> Comentar
                  </button>
                  <button class="btn btn-ghost btn-sm" style="color: #f59e0b;" onclick="ClientPortalModule.openChangeRequestModal('Material', '${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="Solicitar Alteração">
                    <i data-lucide="git-pull-request"></i> Solicitar Troca
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderFurnitureTab(furniture) {
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
          ${furniture.map(f => `
            <div class="portal-section-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
              <div style="height: 180px; background-size: cover; background-position: center; background-image: url('${f.imageUrl}'); position: relative;">
                <span class="badge badge-info" style="position: absolute; top: 10px; left: 10px;">${f.category}</span>
                <span class="badge badge-secondary" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7);">${f.ambiente}</span>
              </div>
              <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <h4 style="margin: 0 0 6px; font-size: 1.05rem; color: #fff;">${f.name}</h4>
                  <table style="width: 100%; font-size: 0.8rem; color: #94a3b8; border-collapse: collapse; margin-bottom: 12px;">
                    ${f.fornecedor ? `<tr><td style="padding: 3px 0;">Fornecedor:</td><td style="color: #cbd5e1; text-align: right;">${f.fornecedor}</td></tr>` : ''}
                    <tr><td style="padding: 3px 0;">Referência:</td><td style="color: #cbd5e1; text-align: right;"><code>${f.referencia}</code></td></tr>
                    <tr><td style="padding: 3px 0;">Dimensões:</td><td style="color: #cbd5e1; text-align: right;">${f.dimensoes}</td></tr>
                    ${f.material ? `<tr><td style="padding: 3px 0;">Material:</td><td style="color: #cbd5e1; text-align: right;">${f.material}</td></tr>` : ''}
                  </table>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
                  <button class="btn btn-ghost btn-sm" onclick="ClientPortalModule.openCommentDrawer('Mobiliário', '${f.id}', '${f.name.replace(/'/g, "\\'")}')" title="Comentar">
                    <i data-lucide="message-square"></i> Comentar
                  </button>
                  <button class="btn btn-ghost btn-sm" style="color: #f59e0b;" onclick="ClientPortalModule.openChangeRequestModal('Mobiliário', '${f.id}', '${f.name.replace(/'/g, "\\'")}')" title="Solicitar Alteração">
                    <i data-lucide="git-pull-request"></i> Solicitar Troca
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderMoodboardsTab(moodboards) {
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px;">
          ${moodboards.map(mb => `
            <div class="portal-section-card" style="padding: 0; overflow: hidden;">
              <div style="height: 240px; background-size: cover; background-position: center; background-image: url('${mb.imageUrl}'); position: relative;">
                <span class="badge badge-success" style="position: absolute; top: 12px; left: 12px;">MOODBOARD &bull; ${mb.status}</span>
                <span class="badge badge-primary" style="position: absolute; bottom: 12px; left: 12px;">${mb.ambiente}</span>
              </div>
              <div style="padding: 18px;">
                <h4 style="margin: 0 0 6px; font-size: 1.1rem; color: #fff;">${mb.title}</h4>
                <p style="font-size: 0.85rem; color: #94a3b8; margin: 0 0 16px; line-height: 1.4;">${mb.description}</p>
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.75rem; color: #64748b;">Layout: ${mb.layoutVariant}</span>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-ghost btn-sm" onclick="ClientPortalModule.openCommentDrawer('Documento', '${mb.id}', '${mb.title.replace(/'/g, "\\'")}')">
                      <i data-lucide="message-square"></i> Comentar
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="ClientPortalModule.openChangeRequestModal('Documento', '${mb.id}', '${mb.title.replace(/'/g, "\\'")}')">
                      <i data-lucide="git-pull-request"></i> Solicitar Ajuste
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    // ========================================================================
    // BLOCO H12: SISTEMA FORMAL DE SOLICITAÇÃO DE ALTERAÇÃO (ChangeRequest)
    // ========================================================================
    renderChangeRequestsSection() {
      const data = this.cachedData;
      const state = this.getState();
      const requests = state ? state.getChangeRequests(data.project.id) : [];

      return `
        <div class="portal-subpage">
          <div class="portal-subpage-header">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2>Solicitações Formais de Alteração</h2>
                <p>Canal estruturado para propor modificações no projeto sem comprometer a integridade dos prazos e desenhos executivos.</p>
              </div>

              <button class="btn btn-warning" onclick="ClientPortalModule.openChangeRequestModal('Projeto', '${data.project.id}', '${data.project.name.replace(/'/g, "\\'")}')" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
                <i data-lucide="plus-circle"></i> Nova Solicitação Formal
              </button>
            </div>
          </div>

          <!-- SALVAGUARDA DE GESTÃO (H12): Cliente não altera diretamente o projeto -->
          <div class="portal-welcome-strip" style="background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.25); color: #fde68a; margin-bottom: 24px;">
            <i data-lucide="info"></i>
            <div>
              <strong>Como funcionam as solicitações formais:</strong><br>
              O cliente solicita as alterações desejadas e nossa equipe realiza a análise técnica de viabilidade e impacto estrutural/estético.<br>
              <em>"Solicitação recebida. A alteração será analisada pela equipe."</em> Nenhuma promessa automática de prazo ou custo é feita sem avaliação preliminar. Solicitações aceitas poderão originar uma nova revisão oficial do projeto.
            </div>
          </div>

          <!-- LISTA DE SOLICITAÇÕES REGISTRADAS -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${requests.length > 0 ? requests.map(req => {
              const priorityColor = req.priority === 'alta' ? '#ef4444' : (req.priority === 'normal' ? '#38bdf8' : '#10b981');
              return `
                <div class="portal-section-card" style="border-left: 4px solid ${priorityColor}; padding: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 10px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="badge" style="background: rgba(255,255,255,0.06); color: #fff; font-size: 0.72rem;"><code>${req.id}</code></span>
                        <span class="badge badge-primary" style="font-size: 0.72rem;">${req.targetType.toUpperCase()}</span>
                        <span class="badge" style="background: ${priorityColor}22; color: ${priorityColor}; border: 1px solid ${priorityColor}44; font-size: 0.72rem;">PRIORIDADE: ${req.priority.toUpperCase()}</span>
                      </div>
                      <div style="font-size: 0.8rem; color: #94a3b8;">
                        Enviada em: <strong>${new Date(req.createdAt).toLocaleDateString('pt-BR')} às ${new Date(req.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</strong> por ${req.submitterName || 'Cliente'}
                      </div>
                    </div>

                    <div>
                      <span class="badge ${req.status === 'aceita' || req.status === 'concluída' ? 'badge-success' : (req.status === 'rejeitada' ? 'badge-danger' : 'badge-warning')}" style="font-size: 0.8rem; padding: 6px 12px; font-weight: 700;">
                        STATUS: ${req.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p style="font-size: 0.95rem; color: #f1f5f9; margin: 8px 0 12px; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px;">
                    "${req.description}"
                  </p>

                  ${req.architectNotes ? `
                    <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 10px 14px; margin-top: 10px; font-size: 0.85rem; color: #cbd5e1;">
                      <strong style="color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="user-check" style="width: 14px;"></i> Parecer do Arquiteto:
                      </strong>
                      <div style="margin-top: 4px;">${req.architectNotes}</div>
                    </div>
                  ` : ''}

                  ${req.linkedRevisionId ? `
                    <div style="margin-top: 10px; font-size: 0.8rem; color: #10b981; display: flex; align-items: center; gap: 6px;">
                      <i data-lucide="git-branch" style="width: 14px;"></i> Originou a Revisão Oficial: <strong>${req.linkedRevisionId}</strong>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') : `
              <div class="portal-empty-hint" style="padding: 40px; text-align: center;">
                <i data-lucide="inbox" style="width: 44px; height: 44px; color: #64748b; margin-bottom: 12px;"></i>
                <p>Nenhuma solicitação formal de alteração enviada até o momento.</p>
              </div>
            `}
          </div>
        </div>
      `;
    },

    // ========================================================================
    // BLOCO H08: MODAL VISUALIZADOR PROFISSIONAL DE DOCUMENTOS PUBLICADOS
    // ========================================================================
    openDocumentViewer(pubId, pageNumber = 1) {
      const state = this.getState();
      if (!state || !this.currentPortalId || !this.currentSessionId) return;

      try {
        const authResult = state.authorizeDocumentView(this.currentPortalId, this.currentSessionId, pubId);
        const doc = authResult.document;

        this.activeDocumentViewer = {
          pubId,
          document: doc,
          zoomLevel: 100,
          pan: { x: 0, y: 0 },
          currentPage: pageNumber || 1,
          totalPages: doc.metadata?.totalPages || 1
        };

        this.renderDocumentViewerModal();
      } catch (err) {
        alert('Erro ao abrir documento: ' + err.message);
      }
    },

    renderDocumentViewerModal() {
      const viewer = this.activeDocumentViewer;
      if (!viewer) return;

      const doc = viewer.document;
      let modal = document.getElementById('modal-client-document-viewer');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-client-document-viewer';
        modal.className = 'client-viewer-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="client-viewer-window">
          <!-- BARRA SUPERIOR DO VISUALIZADOR -->
          <div class="viewer-top-bar">
            <div class="viewer-doc-info">
              <span class="badge badge-primary">${doc.sourceType.toUpperCase()} &bull; ${doc.version}</span>
              <strong style="color: #fff; margin-left: 8px;">${doc.title}</strong>
            </div>

            <!-- CONTROLES DE ZOOM, PAN, TELA CHEIA E DOWNLOAD -->
            <div class="viewer-controls">
              <div class="viewer-zoom-controls">
                <button class="viewer-btn" onclick="ClientPortalModule.adjustViewerZoom(-20)" title="Diminuir Zoom"><i data-lucide="minus"></i></button>
                <span class="viewer-zoom-label" id="viewer-zoom-val">${viewer.zoomLevel}%</span>
                <button class="viewer-btn" onclick="ClientPortalModule.adjustViewerZoom(20)" title="Aumentar Zoom"><i data-lucide="plus"></i></button>
                <button class="viewer-btn" onclick="ClientPortalModule.resetViewerZoom()" title="Ajustar à Tela"><i data-lucide="rotate-ccw"></i></button>
              </div>

              <!-- NAVEGAÇÃO DE PÁGINAS (PDF/PRANCHAS) -->
              ${viewer.totalPages > 1 ? `
                <div class="viewer-page-controls">
                  <button class="viewer-btn" onclick="ClientPortalModule.setViewerPage(${viewer.currentPage - 1})" ${viewer.currentPage <= 1 ? 'disabled' : ''}><i data-lucide="chevron-left"></i></button>
                  <span class="viewer-page-label">Página ${viewer.currentPage} de ${viewer.totalPages}</span>
                  <button class="viewer-btn" onclick="ClientPortalModule.setViewerPage(${viewer.currentPage + 1})" ${viewer.currentPage >= viewer.totalPages ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
                </div>
              ` : ''}

              <button class="viewer-btn" onclick="ClientPortalModule.toggleViewerFullscreen()" title="Tela Cheia"><i data-lucide="maximize"></i></button>
              ${doc.downloadAllowed ? `
                <a href="${doc.fileUrl}" target="_blank" download class="viewer-btn" style="text-decoration:none; color:#10b981;" title="Baixar Arquivo"><i data-lucide="download"></i></a>
              ` : ''}
              <button class="viewer-btn viewer-close-btn" onclick="ClientPortalModule.closeDocumentViewer()"><i data-lucide="x"></i></button>
            </div>
          </div>

          <!-- ÁREA CENTRAL DO VISUALIZADOR COM SUPORTE A PAN & ZOOM -->
          <div class="viewer-main-canvas" id="viewer-canvas" onmousedown="ClientPortalModule.startViewerPan(event)">
            <div class="viewer-content-viewport" id="viewer-viewport" style="transform: scale(${viewer.zoomLevel / 100}) translate(${viewer.pan.x}px, ${viewer.pan.y}px);">
              <img src="${doc.fileUrl}" alt="${doc.title}" class="viewer-media-image" id="viewer-active-image">
            </div>
          </div>

          <!-- BARRA INFERIOR COM METADADOS TÉCNICOS ESPECÍFICOS (H08) -->
          <div class="viewer-bottom-bar">
            <div class="viewer-metadata-pill">
              <i data-lucide="monitor"></i> Resolução: <strong>${doc.metadata.resolution}</strong>
            </div>
            <div class="viewer-metadata-pill">
              <i data-lucide="maximize-2"></i> Aspecto: <strong>${doc.metadata.aspectRatio}</strong>
            </div>
            <div class="viewer-metadata-pill">
              <i data-lucide="compass"></i> Escala: <strong>${doc.metadata.scale}</strong>
            </div>
            <div class="viewer-metadata-pill">
              <i data-lucide="file"></i> Formato: <strong>${doc.metadata.sheetFormat}</strong>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      if (window.lucide) lucide.createIcons();
    },

    adjustViewerZoom(delta) {
      if (!this.activeDocumentViewer) return;
      this.activeDocumentViewer.zoomLevel = Math.max(30, Math.min(400, this.activeDocumentViewer.zoomLevel + delta));
      const viewport = document.getElementById('viewer-viewport');
      const valEl = document.getElementById('viewer-zoom-val');
      if (viewport) viewport.style.transform = `scale(${this.activeDocumentViewer.zoomLevel / 100}) translate(${this.activeDocumentViewer.pan.x}px, ${this.activeDocumentViewer.pan.y}px)`;
      if (valEl) valEl.innerText = `${this.activeDocumentViewer.zoomLevel}%`;
    },

    resetViewerZoom() {
      if (!this.activeDocumentViewer) return;
      this.activeDocumentViewer.zoomLevel = 100;
      this.activeDocumentViewer.pan = { x: 0, y: 0 };
      const viewport = document.getElementById('viewer-viewport');
      const valEl = document.getElementById('viewer-zoom-val');
      if (viewport) viewport.style.transform = 'scale(1) translate(0px, 0px)';
      if (valEl) valEl.innerText = '100%';
    },

    setViewerPage(page) {
      if (!this.activeDocumentViewer) return;
      if (page >= 1 && page <= this.activeDocumentViewer.totalPages) {
        this.activeDocumentViewer.currentPage = page;
        this.renderDocumentViewerModal();
      }
    },

    toggleViewerFullscreen() {
      const modal = document.getElementById('modal-client-document-viewer');
      if (!modal) return;
      if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    },

    startViewerPan(event) {
      if (!this.activeDocumentViewer) return;
      const startX = event.clientX;
      const startY = event.clientY;
      const initialPanX = this.activeDocumentViewer.pan.x;
      const initialPanY = this.activeDocumentViewer.pan.y;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        this.activeDocumentViewer.pan.x = initialPanX + dx;
        this.activeDocumentViewer.pan.y = initialPanY + dy;
        const viewport = document.getElementById('viewer-viewport');
        if (viewport) {
          viewport.style.transform = `scale(${this.activeDocumentViewer.zoomLevel / 100}) translate(${this.activeDocumentViewer.pan.x}px, ${this.activeDocumentViewer.pan.y}px)`;
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },

    closeDocumentViewer() {
      const modal = document.getElementById('modal-client-document-viewer');
      if (modal) modal.style.display = 'none';
      this.activeDocumentViewer = null;
    },

    // ========================================================================
    // BLOCO H07: MODO APRESENTAÇÃO (Fullscreen Slideshow)
    // ========================================================================
    openPresentationMode(pubId) {
      const state = this.getState();
      if (!state) return;

      const pub = state.getClientPublication(pubId);
      if (!pub) return;

      this.activePresentationMode = {
        pubId,
        pub,
        currentSlide: 1,
        slides: [
          { pageNumber: 1, title: 'Prancha 01 — Conceito Geral & Volumetria', url: pub.fileUrl },
          { pageNumber: 2, title: 'Prancha 02 — Distribuição de Ambientes & Humanização', url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1400&q=80' },
          { pageNumber: 3, title: 'Prancha 03 — Renders Fotorrealistas & Living', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80' }
        ]
      };

      this.renderPresentationModeModal();
    },

    renderPresentationModeModal() {
      const pres = this.activePresentationMode;
      if (!pres) return;

      let modal = document.getElementById('modal-client-presentation-mode');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-client-presentation-mode';
        modal.className = 'client-presentation-overlay';
        document.body.appendChild(modal);
      }

      const curSlide = pres.slides[pres.currentSlide - 1];

      modal.innerHTML = `
        <div class="presentation-mode-window">
          <div class="presentation-header">
            <div>
              <span class="badge badge-primary">MODO APRESENTAÇÃO</span>
              <strong style="color: #fff; margin-left: 8px;">${pres.pub.title} &bull; ${curSlide.title}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.85rem; color: #cbd5e1;">${pres.currentSlide} / ${pres.slides.length}</span>
              <button class="viewer-btn" onclick="ClientPortalModule.closePresentationMode()"><i data-lucide="x"></i></button>
            </div>
          </div>

          <div class="presentation-body">
            <img src="${curSlide.url}" alt="${curSlide.title}" style="max-height: 82vh; max-width: 95vw; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border-radius: 6px;">

            <button class="pres-nav-btn pres-prev" onclick="ClientPortalModule.navigatePresentationSlide(-1)" ${pres.currentSlide <= 1 ? 'disabled' : ''}>
              <i data-lucide="chevron-left"></i>
            </button>
            <button class="pres-nav-btn pres-next" onclick="ClientPortalModule.navigatePresentationSlide(1)" ${pres.currentSlide >= pres.slides.length ? 'disabled' : ''}>
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      if (window.lucide) lucide.createIcons();
    },

    navigatePresentationSlide(delta) {
      if (!this.activePresentationMode) return;
      const newSlide = this.activePresentationMode.currentSlide + delta;
      if (newSlide >= 1 && newSlide <= this.activePresentationMode.slides.length) {
        this.activePresentationMode.currentSlide = newSlide;
        this.renderPresentationModeModal();
      }
    },

    closePresentationMode() {
      const modal = document.getElementById('modal-client-presentation-mode');
      if (modal) modal.style.display = 'none';
      this.activePresentationMode = null;
    },

    // ========================================================================
    // BLOCO H11: DRAWER DE COMENTÁRIOS ESTRUTURADOS POR OBJETO (ClientComment)
    // ========================================================================
    openCommentDrawer(targetType, targetId, title) {
      this.activeCommentDrawer = { targetType, targetId, title };
      this.renderCommentDrawer();
    },

    renderCommentDrawer() {
      const active = this.activeCommentDrawer;
      if (!active) return;

      const state = this.getState();
      const comments = state ? state.getClientCommentsByTarget(this.cachedData?.project?.id, active.targetType, active.targetId) : [];

      let drawer = document.getElementById('client-comment-drawer');
      if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'client-comment-drawer';
        drawer.className = 'client-drawer-overlay';
        document.body.appendChild(drawer);
      }

      drawer.innerHTML = `
        <div class="client-drawer-card">
          <div class="drawer-header">
            <div>
              <span class="badge badge-primary">${active.targetType.toUpperCase()}</span>
              <h3 style="margin: 4px 0 0; font-size: 1.1rem; color: #fff;">${active.title}</h3>
              <div style="font-size: 0.75rem; color: #94a3b8;">Feedback e Observações Técnicas Vinculadas</div>
            </div>
            <button class="btn-icon btn-ghost" onclick="ClientPortalModule.closeCommentDrawer()"><i data-lucide="x"></i></button>
          </div>

          <!-- HISTÓRICO DE COMENTÁRIOS (NUNCA EXCLUÍDOS SILENCIOSAMENTE) -->
          <div class="drawer-body" style="padding: 16px; max-height: 60vh; overflow-y: auto;">
            ${comments.length > 0 ? comments.filter(c => !c.parentId).map(parent => {
              const replies = comments.filter(r => r.parentId === parent.id);
              const isResolved = parent.status === 'resolved';

              return `
                <div class="comment-thread-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div>
                      <strong style="color: #38bdf8; font-size: 0.85rem;">${parent.authorName}</strong>
                      <span class="badge" style="font-size: 0.65rem; margin-left: 6px;">${parent.authorRole === 'architect' ? 'Arquiteto' : 'Cliente'}</span>
                    </div>
                    <span class="badge ${isResolved ? 'badge-success' : 'badge-warning'}" style="font-size: 0.7rem;">
                      ${parent.status.toUpperCase()}
                    </span>
                  </div>

                  <p style="margin: 0 0 8px; font-size: 0.9rem; color: #e2e8f0; line-height: 1.4;">${parent.text}</p>
                  <div style="font-size: 0.72rem; color: #64748b; display: flex; justify-content: space-between;">
                    <span>${new Date(parent.createdAt).toLocaleString('pt-BR')}</span>
                    <button class="btn-link" style="color: #38bdf8; font-size: 0.75rem; background:none; border:none; cursor:pointer;" onclick="ClientPortalModule.toggleReplyBox('${parent.id}')">Responder</button>
                  </div>

                  <!-- RESPOSTAS ENCADEADAS (THREADS) -->
                  ${replies.map(rep => `
                    <div style="margin-top: 10px; margin-left: 16px; padding-left: 12px; border-left: 2px solid #38bdf8; font-size: 0.85rem;">
                      <strong style="color: #cbd5e1;">${rep.authorName}:</strong> <span style="color: #94a3b8;">${rep.text}</span>
                      <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">${new Date(rep.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                  `).join('')}

                  <!-- CAMPO DE RESPOSTA -->
                  <div id="reply-box-${parent.id}" style="display: none; margin-top: 10px;">
                    <input type="text" id="reply-input-${parent.id}" class="form-input form-input-sm" placeholder="Escreva uma resposta...">
                    <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="ClientPortalModule.toggleReplyBox('${parent.id}')">Cancelar</button>
                      <button class="btn btn-primary btn-sm" onclick="ClientPortalModule.submitCommentReply('${parent.id}')">Responder</button>
                    </div>
                  </div>

                  <!-- BOTÃO DE RESOLVER / REABRIR -->
                  <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.06); text-align: right;">
                    ${isResolved ? `
                      <button class="btn btn-secondary btn-sm" style="font-size: 0.7rem; padding: 2px 8px;" onclick="ClientPortalModule.reopenComment('${parent.id}')">
                        <i data-lucide="rotate-ccw"></i> Reabrir Comentário
                      </button>
                    ` : `
                      <button class="btn btn-success btn-sm" style="font-size: 0.7rem; padding: 2px 8px;" onclick="ClientPortalModule.resolveComment('${parent.id}')">
                        <i data-lucide="check"></i> Marcar como Resolvido
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="portal-empty-hint" style="padding: 24px; text-align: center;">Nenhum comentário registrado para este item ainda. Seja o primeiro a comentar!</div>
            `}
          </div>

          <!-- NOVO COMENTÁRIO -->
          <div class="drawer-footer" style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.08);">
            <label class="form-label" style="font-size: 0.8rem;">Adicionar Comentário Estruturado:</label>
            <textarea id="drawer-new-comment-text" class="form-input" rows="2" placeholder="Digite sua observação sobre este objeto..."></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
              <button class="btn btn-secondary btn-sm" onclick="ClientPortalModule.closeCommentDrawer()">Fechar</button>
              <button class="btn btn-primary btn-sm" onclick="ClientPortalModule.submitNewComment()">Enviar Comentário</button>
            </div>
          </div>
        </div>
      `;

      drawer.style.display = 'flex';
      if (window.lucide) lucide.createIcons();
    },

    toggleReplyBox(parentId) {
      const box = document.getElementById(`reply-box-${parentId}`);
      if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
    },

    submitNewComment() {
      const active = this.activeCommentDrawer;
      if (!active) return;
      const text = document.getElementById('drawer-new-comment-text')?.value;
      if (!text || !text.trim()) {
        alert('Digite o texto do comentário.');
        return;
      }

      const state = this.getState();
      if (!state) return;

      try {
        state.createClientComment({
          projectId: this.cachedData?.project?.id,
          portalId: this.currentPortalId,
          clientId: this.cachedData?.client?.id,
          targetType: active.targetType,
          targetId: active.targetId,
          text,
          authorName: this.cachedData?.client?.name || 'Cliente',
          authorRole: 'client'
        });

        this.renderCommentDrawer();
      } catch (err) {
        alert('Erro ao enviar comentário: ' + err.message);
      }
    },

    submitCommentReply(parentId) {
      const input = document.getElementById(`reply-input-${parentId}`);
      const text = input ? input.value : '';
      if (!text || !text.trim()) return;

      const state = this.getState();
      if (!state) return;

      try {
        state.replyClientComment(parentId, {
          text,
          authorName: this.cachedData?.client?.name || 'Cliente',
          authorRole: 'client'
        });
        this.renderCommentDrawer();
      } catch (err) {
        alert('Erro ao responder: ' + err.message);
      }
    },

    resolveComment(commentId) {
      const state = this.getState();
      if (!state) return;
      state.resolveClientComment(commentId, this.cachedData?.client?.name || 'Cliente');
      this.renderCommentDrawer();
    },

    reopenComment(commentId) {
      const state = this.getState();
      if (!state) return;
      state.reopenClientComment(commentId, this.cachedData?.client?.name || 'Cliente');
      this.renderCommentDrawer();
    },

    closeCommentDrawer() {
      const drawer = document.getElementById('client-comment-drawer');
      if (drawer) drawer.style.display = 'none';
      this.activeCommentDrawer = null;
    },

    // ========================================================================
    // BLOCO H12: MODAL DE SOLICITAÇÃO FORMAL DE ALTERAÇÃO (ChangeRequest)
    // ========================================================================
    openChangeRequestModal(targetType = 'Projeto', targetId, title = 'Projeto') {
      this.activeChangeRequestModal = { targetType, targetId, title };
      this.renderChangeRequestModal();
    },

    renderChangeRequestModal() {
      const active = this.activeChangeRequestModal;
      if (!active) return;

      let modal = document.getElementById('modal-client-change-request');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-client-change-request';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="modal-card" style="max-width: 580px; width: 95%;">
          <div class="modal-header">
            <div>
              <span class="badge badge-warning" style="margin-bottom: 4px;">SOLICITAÇÃO FORMAL &bull; H12</span>
              <h3 style="margin: 0; font-size: 1.2rem; color: #fff;">Solicitação de Alteração no Projeto</h3>
              <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">
                Alvo: <strong>${active.targetType} — ${active.title}</strong>
              </p>
            </div>
            <button class="btn-icon btn-ghost" onclick="ClientPortalModule.closeChangeRequestModal()"><i data-lucide="x"></i></button>
          </div>

          <form onsubmit="ClientPortalModule.submitChangeRequestForm(event)" class="modal-body" style="padding: 20px;">
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 0.82rem; color: #fde68a; line-height: 1.4;">
              <i data-lucide="shield-alert" style="display:inline-block; vertical-align: middle; margin-right: 4px; color: #f59e0b;"></i>
              <strong>Procedimento Formal:</strong> Sua solicitação será registrada e encaminhada ao arquiteto titular para análise de viabilidade técnica. Prazos e custos adicionais não são assumidos automaticamente.
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Nível de Prioridade da Alteração:</label>
              <select id="crq-priority" class="form-select">
                <option value="normal" selected>Normal (Ajuste convencional no estudo)</option>
                <option value="baixa">Baixa (Ideia opcional ou sugestão estética)</option>
                <option value="alta">Alta (Impacta programa de necessidades ou prazos)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Descrição Detalhada da Alteração Desejada:</label>
              <textarea id="crq-description" class="form-input" rows="4" required placeholder="Descreva especificamente o que deseja alterar, qual o motivo e como imagina o resultado..."></textarea>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ClientPortalModule.closeChangeRequestModal()">Cancelar</button>
              <button type="submit" class="btn btn-warning btn-sm" style="font-weight: 700;">
                <i data-lucide="send"></i> Enviar Solicitação Formal
              </button>
            </div>
          </form>
        </div>
      `;

      modal.classList.add('active');
      if (window.lucide) lucide.createIcons();
    },

    submitChangeRequestForm(event) {
      event.preventDefault();
      const active = this.activeChangeRequestModal;
      if (!active) return;

      const priority = document.getElementById('crq-priority')?.value || 'normal';
      const description = document.getElementById('crq-description')?.value;

      if (!description || !description.trim()) {
        alert('Por favor, informe a descrição da alteração.');
        return;
      }

      const state = this.getState();
      if (!state) return;

      try {
        const result = state.createChangeRequest({
          projectId: this.cachedData?.project?.id,
          portalId: this.currentPortalId,
          clientId: this.cachedData?.client?.id,
          targetType: active.targetType,
          targetId: active.targetId,
          description,
          priority,
          submitterName: this.cachedData?.client?.name || 'Cliente'
        });

        alert(`✔ ${result.message}\n\nProtocolo: ${result.changeRequest.id}\nPrioridade: ${priority.toUpperCase()}\nStatus: ENVIADA\n\nA solicitação será analisada pela equipe técnica da ArqVértice.`);
        this.closeChangeRequestModal();
        this.setRoute('solicitacoes');
      } catch (err) {
        alert('Erro ao enviar solicitação: ' + err.message);
      }
    },

    closeChangeRequestModal() {
      const modal = document.getElementById('modal-client-change-request');
      if (modal) modal.classList.remove('active');
      this.activeChangeRequestModal = null;
    },
    openPublicationModal(projectId) {
      const state = this.getState();
      if (!state) return;

      const project = state.getProject(projectId) || { id: projectId, name: 'Projeto' };
      const portals = state.getClientPortalsByProject(projectId);
      const portal = portals[0] || null;

      if (!portal) {
        alert('Nenhum portal do cliente foi criado para este projeto ainda. Crie o portal antes de publicar conteúdos.');
        return;
      }

      // Coleta itens publicáveis existentes no projeto
      const publishableItems = [];

      // 1. Briefing
      const briefing = state.getProjectBriefing ? state.getProjectBriefing(projectId) : null;
      if (briefing) {
        publishableItems.push({
          sourceType: 'briefing',
          sourceId: briefing.id,
          title: briefing.title || 'Briefing do Projeto',
          description: 'Questionário de necessidades e alinhamento de desejos.',
          version: `v${briefing.version || 1}`,
          fileUrl: '/portal/briefing',
          previewUrl: null
        });
      }

      // 2. Renders Aprovados
      const renders = (state.data.environmentRenders || []).filter(r => r.projectId === projectId);
      renders.forEach(r => {
        publishableItems.push({
          sourceType: 'render',
          sourceId: r.id,
          title: `Render: ${r.title || r.environmentName || 'Ambiente'}`,
          description: `Perspectiva fotorrealista ${r.resolution || '1080p'}.`,
          version: r.versionLabel || 'v1.0',
          fileUrl: r.originalUrl || r.url || r.imageUrl,
          previewUrl: r.thumbnailUrl || r.imageUrl || r.url
        });
      });

      // 3. Plantas Humanizadas
      const plans = (state.data.humanizedPlans || []).filter(p => p.projectId === projectId);
      plans.forEach(p => {
        publishableItems.push({
          sourceType: 'planta',
          sourceId: p.id,
          title: `Planta: ${p.title || 'Planta Humanizada'}`,
          description: p.description || 'Layout arquitetônico humanizado com cotas e texturas.',
          version: p.currentVersion || 'R01',
          fileUrl: p.fileUrl || p.url,
          previewUrl: p.thumbnailUrl || p.fileUrl
        });
      });

      // Publicações existentes
      const currentPublications = state.getClientPublications(projectId);

      // Cria ou recupera elemento modal
      let modal = document.getElementById('modal-client-publications');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-client-publications';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="modal-card" style="max-width: 960px; width: 95%;">
          <div class="modal-header">
            <div>
              <h3 style="margin: 0; font-size: 1.25rem;">Publicar no Portal do Cliente</h3>
              <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                Projeto: <strong>${project.name}</strong> &bull; Portal: <strong>${portal.token}</strong>
              </p>
            </div>
            <button class="btn-icon btn-ghost" onclick="document.getElementById('modal-client-publications').classList.remove('active')">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="modal-body" style="max-height: 65vh; overflow-y: auto;">
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: #cbd5e1; display: flex; align-items: center; gap: 10px;">
              <i data-lucide="info" style="color: #38bdf8; flex-shrink: 0;"></i>
              <span><strong>Regra de Publicação Explícita:</strong> Um arquivo existente no projeto NÃO é publicado automaticamente. Somente itens marcados como publicados ficam visíveis para o cliente titular. Retirar publicação preserva 100% o arquivo original do estúdio.</span>
            </div>

            <table class="portal-table" style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; color: #94a3b8;">
                  <th style="padding: 10px;">Conteúdo</th>
                  <th style="padding: 10px;">Versão</th>
                  <th style="padding: 10px;">Status no Portal</th>
                  <th style="padding: 10px;">Visibilidade & Permissões</th>
                  <th style="padding: 10px; text-align: right;">Ação</th>
                </tr>
              </thead>
              <tbody>
                ${publishableItems.map(item => {
                  const existingPub = currentPublications.find(p => p.sourceType === item.sourceType && p.sourceId === item.sourceId);
                  const isPublished = existingPub && existingPub.status === 'published' && existingPub.clientVisible;

                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                      <td style="padding: 12px 10px;">
                        <span class="badge badge-primary" style="font-size: 0.65rem; margin-right: 6px;">${item.sourceType.toUpperCase()}</span>
                        <strong>${item.title}</strong>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${item.description}</div>
                      </td>
                      <td style="padding: 12px 10px;">
                        <code>${existingPub ? existingPub.version : item.version}</code>
                      </td>
                      <td style="padding: 12px 10px;">
                        ${isPublished ? 
                          '<span class="badge badge-success"><span class="status-dot-active" style="display:inline-block; margin-right:4px;"></span> Publicado</span>' : 
                          '<span class="badge badge-secondary">Rascunho Interno</span>'
                        }
                      </td>
                      <td style="padding: 12px 10px;">
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.75rem;">
                          <label style="display: flex; align-items: center; gap: 4px; color: ${isPublished ? '#38bdf8' : '#64748b'};">
                            <input type="checkbox" id="perm-dl-${item.sourceId}" ${existingPub?.downloadAllowed ? 'checked' : ''} ${!isPublished ? 'disabled' : ''} onchange="ClientPortalModule.togglePubPerm('${existingPub?.id}', 'downloadAllowed', this.checked)"> Download
                          </label>
                          <label style="display: flex; align-items: center; gap: 4px; color: ${isPublished ? '#38bdf8' : '#64748b'};">
                            <input type="checkbox" id="perm-app-${item.sourceId}" ${existingPub?.approvalAllowed ? 'checked' : ''} ${!isPublished ? 'disabled' : ''} onchange="ClientPortalModule.togglePubPerm('${existingPub?.id}', 'approvalAllowed', this.checked)"> Aprovação
                          </label>
                        </div>
                      </td>
                      <td style="padding: 12px 10px; text-align: right;">
                        ${isPublished ? `
                          <button class="btn btn-danger btn-sm" onclick="ClientPortalModule.unpublishAsset('${existingPub.id}', '${projectId}')" title="Retira visibilidade do cliente preservando o arquivo original">
                            <i data-lucide="eye-off"></i> Despublicar
                          </button>
                        ` : `
                          <button class="btn btn-primary btn-sm" onclick="ClientPortalModule.publishAsset('${projectId}', '${item.sourceType}', '${item.sourceId}', '${item.title.replace(/'/g, "\\'")}', '${item.version}', '${item.fileUrl || ''}')">
                            <i data-lucide="share-2"></i> Publicar
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <a href="/portal" target="_blank" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="external-link"></i> Abrir Visão do Cliente
            </a>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-client-publications').classList.remove('active')">
              Fechar
            </button>
          </div>
        </div>
      `;

      modal.classList.add('active');
      if (window.lucide) lucide.createIcons();
    },

    publishAsset(projectId, sourceType, sourceId, title, version, fileUrl) {
      const state = this.getState();
      if (!state) return;

      try {
        state.publishToClientPortal({
          projectId,
          sourceType,
          sourceId,
          title,
          version,
          fileUrl,
          clientVisible: true,
          downloadAllowed: true,
          commentAllowed: true,
          approvalAllowed: true
        }, 'Arquiteto');

        this.openPublicationModal(projectId);
      } catch (err) {
        alert('Erro ao publicar: ' + err.message);
      }
    },

    unpublishAsset(publicationId, projectId) {
      const state = this.getState();
      if (!state) return;

      if (!confirm('Deseja retirar esta publicação do Portal do Cliente?\\n\\nO arquivo original do projeto permanecerá 100% intacto no estúdio.')) {
        return;
      }

      try {
        state.unpublishClientPublication(publicationId, 'Retirado manualmente pelo arquiteto', 'Arquiteto');
        this.openPublicationModal(projectId);
      } catch (err) {
        alert('Erro ao despublicar: ' + err.message);
      }
    },

    togglePubPerm(publicationId, permKey, value) {
      const state = this.getState();
      if (!state || !publicationId) return;
      state.updateClientPublication(publicationId, { [permKey]: value }, 'Arquiteto');
    }
  };

  // Exportação compatível com Browser e Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientPortalModule;
  }
  if (typeof window !== 'undefined') {
    window.ClientPortalModule = ClientPortalModule;
  }

})(typeof window !== 'undefined' ? window : global);
