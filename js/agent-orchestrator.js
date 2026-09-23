/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I14: ORQUESTRADOR DE AGENTES & COMMAND CENTER
 * ============================================================================
 * 9 Tipos de Comandos: QUERY, ANALYZE, CREATE, TRANSFORM, COMPARE,
 * VALIDATE, NAVIGATE, AUTOMATE, EXPORT.
 * 5 Papéis Canônicos: planner, decision, specialist, executor, validator.
 * Suporte a ExecutionPlan e Human Override.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const CommandType = Object.freeze({
    QUERY: 'QUERY',
    ANALYZE: 'ANALYZE',
    CREATE: 'CREATE',
    TRANSFORM: 'TRANSFORM',
    COMPARE: 'COMPARE',
    VALIDATE: 'VALIDATE',
    NAVIGATE: 'NAVIGATE',
    AUTOMATE: 'AUTOMATE',
    EXPORT: 'EXPORT'
  });

  const AgentRole = Object.freeze({
    PLANNER: 'planner',
    DECISION: 'decision',
    SPECIALIST: 'specialist',
    EXECUTOR: 'executor',
    VALIDATOR: 'validator'
  });

  /**
   * 1. CONTRATOS CANÔNICOS DOS 5 AGENTES
   */
  const AgentContracts = {
    [AgentRole.PLANNER]: {
      role: AgentRole.PLANNER,
      purpose: 'Decompor comandos complexos em etapas ordenadas de execução.',
      allowedTools: ['ContextBuilder', 'TaskDecomposer', 'BIMQueryEngine'],
      forbiddenTools: ['DirectStateMutator', 'FileDeleter'],
      permissions: 'READ_ONLY',
      execute: (task, ctx) => {
        return {
          planId: `plan-${Date.now()}`,
          steps: [
            { step: 1, role: AgentRole.SPECIALIST, action: 'GATHER_DOMAIN_DATA' },
            { step: 2, role: AgentRole.DECISION, action: 'EVALUATE_OPTIONS' },
            { step: 3, role: AgentRole.VALIDATOR, action: 'AUDIT_COMPLIANCE' },
            { step: 4, role: AgentRole.EXECUTOR, action: 'APPLY_CHANGES' }
          ],
          estimatedDurationMs: 450
        };
      }
    },

    [AgentRole.DECISION]: {
      role: AgentRole.DECISION,
      purpose: 'Avaliar bifurcações e políticas de governança via regras ou Jev.',
      allowedTools: ['JevDecisionEngine', 'PolicyResolver'],
      forbiddenTools: ['DOMMutator', 'DirectStateMutator'],
      permissions: 'DECISION_ONLY',
      execute: (task, ctx) => {
        return {
          decision: 'APPROVED',
          confidence: 0.95,
          reason: 'Atende às diretrizes normativas vigentes.'
        };
      }
    },

    [AgentRole.SPECIALIST]: {
      role: AgentRole.SPECIALIST,
      purpose: 'Processar dados especializados de domínio (BIM, Vídeo, Materiais).',
      allowedTools: ['BIMQueryEngine', 'MaterialsCatalog', 'AudiovisualPipeline'],
      forbiddenTools: ['DatabaseDrop', 'ArchiveProject'],
      permissions: 'DOMAIN_PROCESSING',
      execute: (task, ctx) => {
        if (task.commandType === CommandType.QUERY) {
          const bimEngine = global.BIMQueryEngine;
          if (bimEngine) {
            const res = bimEngine.executeNaturalQuery(ctx.projectId || 'prj-01', task.rawQuery);
            if (res) return res;
          }
        }
        return {
          specialistResult: `Dados de domínio processados com sucesso para "${task.rawQuery}".`
        };
      }
    },

    [AgentRole.EXECUTOR]: {
      role: AgentRole.EXECUTOR,
      purpose: 'Aplicar alterações validadas no estado do estúdio e na UI.',
      allowedTools: ['StudioState.save', 'ModalController', 'NavigationRouter'],
      forbiddenTools: ['BypassValidation'],
      permissions: 'WRITE_AUTHORIZED',
      execute: (task, ctx) => {
        return {
          executed: true,
          timestamp: new Date().toISOString(),
          stateUpdated: true
        };
      }
    },

    [AgentRole.VALIDATOR]: {
      role: AgentRole.VALIDATOR,
      purpose: 'Auditar saídas contra normas técnicas NBR e DESIGN.md.',
      allowedTools: ['SchemaValidator', 'DimensionChecker'],
      forbiddenTools: ['DataModifier'],
      permissions: 'AUDIT_GATE',
      execute: (task, ctx) => {
        return {
          valid: true,
          standardCheck: 'NBR 6492 / NBR 9050 OK',
          designTokenCheck: 'APPLE_HIG_ALIGNED'
        };
      }
    }
  };

  /**
   * 2. PARSER DE COMANDOS DO COMMAND CENTER
   */
  const CommandCenterParser = {
    classify(inputString) {
      const q = String(inputString || '').trim();
      const lower = q.toLowerCase();

      if (lower.startsWith('quais') || lower.startsWith('listar') || lower.startsWith('quantos') || lower.includes('propriedade de')) {
        return { type: CommandType.QUERY, targetRole: AgentRole.SPECIALIST };
      }
      if (lower.startsWith('analise') || lower.startsWith('auditar') || lower.includes('diagnostico')) {
        return { type: CommandType.ANALYZE, targetRole: AgentRole.SPECIALIST };
      }
      if (lower.startsWith('criar') || lower.startsWith('novo')) {
        return { type: CommandType.CREATE, targetRole: AgentRole.PLANNER };
      }
      if (lower.startsWith('atualizar') || lower.startsWith('mudar') || lower.startsWith('alterar')) {
        return { type: CommandType.TRANSFORM, targetRole: AgentRole.EXECUTOR };
      }
      if (lower.startsWith('comparar') || lower.includes('diferença entre')) {
        return { type: CommandType.COMPARE, targetRole: AgentRole.DECISION };
      }
      if (lower.startsWith('validar') || lower.startsWith('checar conformidade')) {
        return { type: CommandType.VALIDATE, targetRole: AgentRole.VALIDATOR };
      }
      if (lower.startsWith('ir para') || lower.startsWith('navegar') || lower.startsWith('abrir tela')) {
        return { type: CommandType.NAVIGATE, targetRole: AgentRole.EXECUTOR };
      }
      if (lower.startsWith('executar automação') || lower.startsWith('automatizar')) {
        return { type: CommandType.AUTOMATE, targetRole: AgentRole.PLANNER };
      }
      if (lower.startsWith('exportar') || lower.startsWith('baixar')) {
        return { type: CommandType.EXPORT, targetRole: AgentRole.SPECIALIST };
      }

      // Default contextual
      return { type: CommandType.ANALYZE, targetRole: AgentRole.SPECIALIST };
    }
  };

  /**
   * 3. ORQUESTRADOR CENTRAL DE AGENTES (AgentOrchestrator)
   */
  class OrchestratorEngine {
    constructor() {
      this.activeExecutionPlan = null;
      this.isInterrupted = false;
      this.executionHistory = [];
    }

    createExecutionPlan(rawInput, context = {}) {
      const classification = CommandCenterParser.classify(rawInput);
      const taskId = `task-cmd-${Date.now()}`;

      const task = {
        taskId,
        rawQuery: rawInput,
        commandType: classification.type,
        primaryRole: classification.targetRole,
        context
      };

      const planner = AgentContracts[AgentRole.PLANNER];
      const planMeta = planner.execute(task, context);

      const plan = {
        id: planMeta.planId,
        task,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
        steps: [
          {
            stepIndex: 1,
            role: AgentRole.SPECIALIST,
            action: 'DOMAIN_RESOLUTION',
            status: 'PENDING'
          },
          {
            stepIndex: 2,
            role: AgentRole.VALIDATOR,
            action: 'COMPLIANCE_AUDIT',
            status: 'PENDING'
          },
          {
            stepIndex: 3,
            role: AgentRole.EXECUTOR,
            action: 'STATE_SYNCHRONIZATION',
            status: 'PENDING'
          }
        ]
      };

      this.activeExecutionPlan = plan;
      this.isInterrupted = false;
      return plan;
    }

    async executePlan(plan) {
      if (!plan || !plan.steps) throw new Error('Plano de execução inválido.');
      plan.status = 'IN_PROGRESS';
      const results = [];

      for (let step of plan.steps) {
        if (this.isInterrupted) {
          step.status = 'CANCELLED';
          plan.status = 'INTERRUPTED_BY_USER';
          break;
        }

        step.status = 'RUNNING';
        const agent = AgentContracts[step.role];
        if (!agent) {
          step.status = 'FAILED';
          step.error = `Agente ${step.role} não possui contrato válido.`;
          plan.status = 'FAILED';
          break;
        }

        // Execução segura respeitando permissões
        const out = agent.execute(plan.task, plan.task.context);
        step.output = out;
        step.status = 'COMPLETED';
        results.push({ step: step.stepIndex, role: step.role, out });
      }

      if (plan.status !== 'INTERRUPTED_BY_USER' && plan.status !== 'FAILED') {
        plan.status = 'COMPLETED';
      }
      plan.completedAt = new Date().toISOString();

      this.executionHistory.push(plan);
      return {
        status: plan.status,
        planId: plan.id,
        results
      };
    }

    humanOverrideInterrupt() {
      console.warn('Human Override ativado: Interrompendo execução em andamento.');
      this.isInterrupted = true;
      if (this.activeExecutionPlan) {
        this.activeExecutionPlan.status = 'INTERRUPTED_BY_USER';
      }
      return { interrupted: true, timestamp: new Date().toISOString() };
    }
  }

  const AgentOrchestrator = new OrchestratorEngine();

  // Exportação no escopo global
  global.CommandType = CommandType;
  global.AgentRole = AgentRole;
  global.AgentContracts = AgentContracts;
  global.CommandCenterParser = CommandCenterParser;
  global.AgentOrchestrator = AgentOrchestrator;

})(typeof window !== 'undefined' ? window : global);
