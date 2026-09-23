/**
 * js/feature-flags.js
 * Módulo de Governança e Feature Flags — ArqVértice Studio (I22)
 * Implementa controle granular de funcionalidades para evolução contínua desacoplada:
 * JEV, NEW_AI_ROUTER, BIM_FEATURES, VIDEO_FEATURES, NEW_MOTION, EXPERIMENTAL_SKILLS.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'arqvertice_feature_flags_v1';

  // Configurações padrão estáveis para produção
  const DEFAULT_FLAGS = {
    JEV: true,                    // Motor de decisão delimitada Jev
    NEW_AI_ROUTER: true,          // Roteador em camadas com orçamentos de latência e cache LRU
    BIM_FEATURES: true,           // Visualizador 3D, cortes, réguas e queries determinísticas
    VIDEO_FEATURES: true,         // Sistema audiovisual programático com Remotion
    NEW_MOTION: true,             // Microinterações hápticas e física de molas (respeitando reduced-motion)
    EXPERIMENTAL_SKILLS: false    // Skills experimentais em fase de validação
  };

  class FeatureFlagsManager {
    constructor() {
      this.flags = { ...DEFAULT_FLAGS };
      this._loadFromStorage();
    }

    _loadFromStorage() {
      if (typeof localStorage !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            this.flags = { ...this.flags, ...parsed };
          }
        } catch (e) {
          console.warn('[FeatureFlags] Falha ao carregar do localStorage, utilizando padrões estáveis.', e);
        }
      }
    }

    _saveToStorage() {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
        } catch (e) {
          console.warn('[FeatureFlags] Falha ao persistir no localStorage.', e);
        }
      }
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('arqvertice:featureflag_changed', { detail: this.flags }));
      }
    }

    /**
     * Verifica se uma bandeira de funcionalidade está ativa.
     * @param {string} flagKey Nome da flag
     * @returns {boolean}
     */
    isEnabled(flagKey) {
      if (typeof this.flags[flagKey] === 'undefined') {
        console.warn(`[FeatureFlags] Flag [${flagKey}] não reconhecida. Retornando false por segurança.`);
        return false;
      }
      return Boolean(this.flags[flagKey]);
    }

    /**
     * Ativa uma funcionalidade.
     */
    enable(flagKey) {
      if (flagKey in DEFAULT_FLAGS) {
        this.flags[flagKey] = true;
        this._saveToStorage();
        return true;
      }
      return false;
    }

    /**
     * Desativa uma funcionalidade.
     */
    disable(flagKey) {
      if (flagKey in DEFAULT_FLAGS) {
        this.flags[flagKey] = false;
        this._saveToStorage();
        return true;
      }
      return false;
    }

    /**
     * Alterna o estado de uma funcionalidade.
     */
    toggle(flagKey) {
      if (flagKey in DEFAULT_FLAGS) {
        this.flags[flagKey] = !this.flags[flagKey];
        this._saveToStorage();
        return this.flags[flagKey];
      }
      return false;
    }

    /**
     * Retorna todas as flags e seus estados atuais.
     */
    getAll() {
      return { ...this.flags };
    }

    /**
     * Restaura os valores padrão de produção.
     */
    resetDefaults() {
      this.flags = { ...DEFAULT_FLAGS };
      this._saveToStorage();
      return { ...this.flags };
    }
  }

  const FeatureFlags = new FeatureFlagsManager();

  // Exportação isomórfica (Browser & Node.js)
  if (typeof window !== 'undefined') {
    window.FeatureFlags = FeatureFlags;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureFlags;
  }
})();
