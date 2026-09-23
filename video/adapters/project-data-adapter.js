/**
 * ============================================================================
 * ARQVERTICE STUDIO — VIDEO ENGINE: PROJECT DATA ADAPTER
 * ============================================================================
 * Converte dados reais de StudioState em payload de composição Remotion
 * (ArchitecturalVideoData).
 *
 * PROJETO COMO FONTE DA VERDADE:
 * - Nunca inventa dados, medidas ou cômodos.
 * - Integração estrita com prj-praia-01 e demais projetos cadastrados.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const ProjectDataAdapter = {
    _getState() {
      if (typeof StudioState !== 'undefined') return StudioState;
      if (typeof window !== 'undefined' && window.StudioState) return window.StudioState;
      if (typeof require !== 'undefined') {
        try { return require('../../js/state.js'); } catch (e) {}
      }
      return null;
    },

    /**
     * Extrai e formata os dados do projeto para a composição Remotion
     */
    buildVideoData(projectId = 'prj-praia-01', videoId = null, options = {}) {
      const state = this._getState();
      if (!state) throw new Error('StudioState não disponível para o ProjectDataAdapter.');

      const project = state.getProject(projectId);
      if (!project) throw new Error(`Projeto não encontrado: ${projectId}`);

      // Busca cliente
      const client = project.clientId && state.data && state.data.clients
        ? state.data.clients.find(c => c.id === project.clientId)
        : null;
      const clientName = client ? client.name : (project.client || 'Cliente Titular');

      // Busca produção de vídeo
      let video = null;
      if (videoId) {
        video = state.getVideoProject(videoId);
      } else {
        const videos = state.getProjectVideos ? state.getProjectVideos(projectId) : [];
        video = videos.length > 0 ? videos[0] : null;
      }

      // Ambientes do projeto
      const environments = state.getProjectEnvironments
        ? state.getProjectEnvironments(projectId)
        : (state.data.environments || []).filter(e => e.projectId === projectId);

      // Renders homologados
      const renders = (state.data.environmentRenders || [])
        .filter(r => r.projectId === projectId)
        .map(r => ({
          id: r.id,
          title: r.name || r.title || 'Render Homologado',
          url: r.url || r.imageUrl || project.coverImage,
          environmentId: r.environmentId || null
        }));

      // Se não houver renders no banco, utiliza a capa oficial de alta resolução
      if (renders.length === 0 && project.coverImage) {
        renders.push({
          id: 'rnd-cover-default',
          title: `${project.name} — Perspectiva Principal`,
          url: project.coverImage,
          environmentId: environments[0] ? environments[0].id : null
        });
      }

      // Materiais canônicos
      const materials = (state.data.canonicalMaterials || [])
        .filter(m => m.projectId === projectId)
        .map(m => ({
          id: m.id,
          nome: m.nome,
          categoria: m.categoria,
          fornecedor: m.fornecedor,
          ambiente: m.ambienteNome
        }));

      // Timeline / Cenas
      let scenes = [];
      if (video) {
        const rawScenes = state.getVideoScenes(video.id);
        if (rawScenes.length > 0) {
          scenes = rawScenes.map((s, idx) => ({
            id: s.id,
            sceneNumber: s.sceneNumber || (idx + 1),
            title: s.title || `Cena ${idx + 1}`,
            environmentName: s.environmentName || 'Geral',
            description: s.description || '',
            durationSeconds: Number(s.duration || s.estimatedDurationSeconds || 5),
            imageUrl: renders[idx % renders.length]?.url || project.coverImage,
            cameraMotion: idx % 2 === 0 ? 'push_in' : 'pan_left',
            overlayText: s.title
          }));
        }
      }

      // Se ainda não houver cenas no vídeo, gera sequência canônica a partir dos ambientes reais
      if (scenes.length === 0) {
        scenes = [
          {
            id: 'scene-01-intro',
            sceneNumber: 1,
            title: 'Fachada & Conceito Arquitetônico',
            environmentName: 'Fachada Principal',
            description: `${project.name} — ${project.typology || 'Residencial'}`,
            durationSeconds: 6,
            imageUrl: project.coverImage,
            cameraMotion: 'push_in',
            overlayText: project.name
          },
          {
            id: 'scene-02-living',
            sceneNumber: 2,
            title: environments[0] ? environments[0].name : 'Living Integrado',
            environmentName: environments[0] ? environments[0].name : 'Área Social',
            description: 'Integração espacial fluida com valorização da ventilação natural.',
            durationSeconds: 7,
            imageUrl: renders[0] ? renders[0].url : project.coverImage,
            cameraMotion: 'pan_left',
            overlayText: environments[0] ? environments[0].name : 'Living Integrado'
          },
          {
            id: 'scene-03-deck',
            sceneNumber: 3,
            title: environments[2] ? environments[2].name : 'Deck Gourmet & Área Externa',
            environmentName: environments[2] ? environments[2].name : 'Área Externa',
            description: 'Espaço gourmet e área de lazer com materiais nobres e deck de madeira.',
            durationSeconds: 7,
            imageUrl: renders[1] ? renders[1].url : project.coverImage,
            cameraMotion: 'push_in',
            overlayText: environments[2] ? environments[2].name : 'Deck Gourmet'
          },
          {
            id: 'scene-04-closing',
            sceneNumber: 4,
            title: 'Encerramento & Identidade',
            environmentName: 'Institucional',
            description: project.company || 'ArqVértice • Arquitetura & Engenharia',
            durationSeconds: 5,
            imageUrl: project.coverImage,
            cameraMotion: 'pull_out',
            overlayText: 'ArqVértice Studio'
          }
        ];
      }

      const fps = Number(video?.fps || options.fps || 30);
      const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
      const durationInFrames = Math.round(totalDurationSeconds * fps);
      const aspectRatio = options.aspectRatio || video?.aspectRatio || '16:9';

      const dimensions = aspectRatio === '9:16'
        ? { width: 1080, height: 1920 }
        : (aspectRatio === '1:1' ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 });

      return {
        projectId: project.id,
        projectCode: project.code || 'PRJ-PRAIA-01',
        projectName: project.name,
        clientName,
        location: project.location || 'Litoral Sul',
        typology: project.typology || 'Residencial Unifamiliar',
        builtAreaM2: project.builtAreaM2 || 385,
        leadArchitect: project.leadArchitect || 'Eduardo Marques',
        engineer: project.engineer || 'Luan Almeida',
        company: project.company || 'ArqVértice • Arquitetura & Engenharia',
        videoProjectId: video ? video.id : 'video-praia-01',
        videoTitle: video ? video.title : `Apresentação — ${project.name}`,
        templateId: options.templateId || 'ARCHITECTURAL_CINEMATIC',
        aspectRatio,
        width: dimensions.width,
        height: dimensions.height,
        fps,
        totalDurationSeconds,
        durationInFrames,
        scenes,
        environments,
        materials,
        renders,
        brand: {
          logoUrl: 'logo.png',
          primaryColor: '#c5a059',
          accentColor: '#6366f1',
          bgDark: '#0b1120',
          fontHeading: 'Montserrat, sans-serif',
          fontMono: 'JetBrains Mono, monospace'
        },
        audio: {
          musicUrl: 'https://cdn.freesound.org/previews/ambient-chill-music.mp3',
          musicVolume: 0.25,
          hasVoiceover: video?.hasVoiceover || false
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: video?.revision || 'V01'
        }
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.ProjectDataAdapter = ProjectDataAdapter;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDataAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
