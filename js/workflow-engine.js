/**
 * ============================================================================
 * ARQVERTICE STUDIO — BLOCO I15: MOTOR DE WORKFLOWS & AUTOMAÇÃO SEGURA
 * ============================================================================
 * Gatilhos: manual, contextual, scheduled, event-driven.
 * Reversibilidade: reversible, irreversible, requiresApproval.
 * Modos: DryRun (preview) vs Live Execution.
 * Tratamento de Falha: stop, retry, fallback, rollback, human_review.
 * Idempotência via hashing e log estruturado de execução.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const TriggerType = Object.freeze({
    MANUAL: 'manual',
    CONTEXTUAL: 'contextual',
    SCHEDULED: 'scheduled',
    EVENT_DRIVEN: 'event-driven'
  });

  const FailurePolicy = Object.freeze({
    STOP: 'stop',
    RETRY: 'retry',
    FALLBACK: 'fallback',
    ROLLBACK: 'rollback',
    HUMAN_REVIEW: 'human_review'
  });

  class WorkflowEngineService {
    constructor() {
      this.registeredWorkflows = new Map();
      this.executionLogs = [];
      this.idempotencyLedger = new Map(); // hash -> previousResult
      this._registerBuiltInWorkflows();
    }

    _registerBuiltInWorkflows() {
      // 1. Workflow de Fechamento de Fase do Projeto
      this.registerWorkflow({
        id: 'STAGE_COMPLETION_CHECK',
        name: 'Validação de Fechamento de Fase',
        triggerType: TriggerType.MANUAL,
        steps: [
          {
            id: 'check-locks',
            name: 'Verificar Travas de Edição',
            reversible: true,
            requiresApproval: false,
            run: (ctx) => ({ status: 'OK', locksVerified: true })
          },
          {
            id: 'audit-qa',
            name: 'Auditoria de Prontidão Multidisciplinar',
            reversible: true,
            requiresApproval: false,
            run: (ctx) => ({ status: 'OK', readinessScore: 95 })
          },
          {
            id: 'advance-stage',
            name: 'Avançar Fase Oficial',
            reversible: false, // Irreversível sem intervenção
            requiresApproval: true,
            run: (ctx) => ({ status: 'ADVANCED', newStage: 'Anteprojeto' })
          }
        ]
      });

      // 2. Workflow de Exportação de Pranchas em Lote
      this.registerWorkflow({
        id: 'BATCH_SHEET_EXPORT',
        name: 'Exportação em Lote de Pranchas Executivas',
        triggerType: TriggerType.CONTEXTUAL,
        steps: [
          {
            id: 'validate-sheets',
            name: 'Conferir Margens e Carimbos NBR 6492',
            reversible: true,
            requiresApproval: false,
            run: (ctx) => ({ valid: true, sheetsApproved: 4 })
          },
          {
            id: 'compile-pdf',
            name: 'Compilar Caderno Técnico SVG/PDF',
            reversible: true,
            requiresApproval: false,
            run: (ctx) => ({ generatedPdfUrl: '/exports/pranchas-executivas.pdf' })
          }
        ]
      });
    }

    registerWorkflow(config) {
      if (!config.id || !Array.isArray(config.steps)) {
        throw new Error('Workflow requer id e lista de steps.');
      }
      this.registeredWorkflows.set(config.id, {
        id: config.id,
        name: config.name || config.id,
        triggerType: config.triggerType || TriggerType.MANUAL,
        failurePolicy: config.failurePolicy || FailurePolicy.ROLLBACK,
        steps: config.steps,
        createdAt: new Date().toISOString()
      });
      return this.registeredWorkflows.get(config.id);
    }

    _generateHash(workflowId, input) {
      return `${workflowId}_${JSON.stringify(input)}`;
    }

    /**
     * Executa um workflow no modo real ou Dry-Run
     */
    async runWorkflow(workflowId, input = {}, options = {}) {
      const wf = this.registeredWorkflows.get(workflowId);
      if (!wf) throw new Error(`Workflow "${workflowId}" não encontrado.`);

      const isDryRun = Boolean(options.dryRun);
      const executionId = `wf-exec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const hash = this._generateHash(workflowId, input);

      // Verificação de idempotência (apenas no modo real)
      if (!isDryRun && this.idempotencyLedger.has(hash)) {
        console.log(`[Idempotência] Retornando resultado prévio para hash: ${hash}`);
        return {
          idempotentReplay: true,
          ...this.idempotencyLedger.get(hash)
        };
      }

      const executionRecord = {
        executionId,
        workflowId: wf.id,
        workflowName: wf.name,
        triggerType: wf.triggerType,
        isDryRun,
        startedAt: new Date().toISOString(),
        stepsExecuted: [],
        rollbackExecuted: false,
        status: 'RUNNING'
      };

      const stepRollbacks = [];
      const startTime = Date.now();

      for (let step of wf.steps) {
        const stepLog = {
          stepId: step.id,
          stepName: step.name,
          reversible: step.reversible !== false,
          requiresApproval: Boolean(step.requiresApproval),
          startedAt: new Date().toISOString(),
          status: 'PENDING'
        };

        // Verificação de aprovação obrigatória
        if (step.requiresApproval && !isDryRun && !options.userApproved) {
          stepLog.status = 'BLOCKED_PENDING_APPROVAL';
          executionRecord.status = 'WAITING_HUMAN_APPROVAL';
          executionRecord.stepsExecuted.push(stepLog);
          break;
        }

        try {
          if (isDryRun) {
            // No dry run, apenas simula sem mutação
            stepLog.output = { simulated: true, stepPreview: `Simulação de ${step.name}` };
            stepLog.status = 'SIMULATED';
          } else {
            const out = step.run(input);
            stepLog.output = out;
            stepLog.status = 'SUCCESS';

            if (typeof step.rollback === 'function') {
              stepRollbacks.unshift(step.rollback);
            }
          }
        } catch (err) {
          stepLog.status = 'FAILED';
          stepLog.error = String(err.message || err);
          executionRecord.status = 'FAILED';
          executionRecord.stepsExecuted.push(stepLog);

          // Execução de Rollback automático se a política exigir
          if (wf.failurePolicy === FailurePolicy.ROLLBACK && stepRollbacks.length > 0) {
            console.warn(`Acionando Rollback para workflow ${wf.id}...`);
            stepRollbacks.forEach(rbFn => {
              try { rbFn(input); } catch (rbErr) { console.error('Erro no rollback:', rbErr); }
            });
            executionRecord.rollbackExecuted = true;
          }
          break;
        }

        stepLog.durationMs = Date.now() - startTime;
        executionRecord.stepsExecuted.push(stepLog);
      }

      if (executionRecord.status !== 'FAILED' && executionRecord.status !== 'WAITING_HUMAN_APPROVAL') {
        executionRecord.status = isDryRun ? 'DRY_RUN_COMPLETED' : 'SUCCESS';
      }
      executionRecord.durationTotalMs = Date.now() - startTime;
      executionRecord.completedAt = new Date().toISOString();

      this.executionLogs.push(executionRecord);
      if (!isDryRun && executionRecord.status === 'SUCCESS') {
        this.idempotencyLedger.set(hash, executionRecord);
      }

      return executionRecord;
    }

    getAuditLogs() {
      return this.executionLogs;
    }
  }

  const WorkflowEngine = new WorkflowEngineService();

  // Exportação no escopo global
  global.TriggerType = TriggerType;
  global.FailurePolicy = FailurePolicy;
  global.WorkflowEngine = WorkflowEngine;

})(typeof window !== 'undefined' ? window : global);
