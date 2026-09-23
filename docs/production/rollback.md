# ARQVERTICE STUDIO — PROCEDIMENTO DE ROLLBACK & DISASTER RECOVERY (K19)

> **Documento Oficial de Engenharia de Confiabilidade & Protocolos de Reversão**  
> **Versão:** 1.0.0 | **SLA de Recuperação:** RTO $\le 15\text{ minutos}$ / RPO $\le 1\text{ hora}$

---

## 1. Gatilhos de Rollback Imediato (Triggers)

O protocolo de rollback deve ser disparado imediatamente nas seguintes situações:
1. **Spike de Erros 500:** Taxa de erro $> 1\%$ nas rotas da API ou Client Viewer nos primeiros 120s.
2. **Crash de Contexto WebGPU:** Falhas repetidas de renderização registradas pelo beacon de telemetria.
3. **Falha de Healthcheck:** Endpoint `/healthz/ready` retornando status degradado ou timeout.
4. **Erro Crítico de Migração:** Divergência de esquema de banco de dados bloqueando escritas de projetos.

---

## 2. Separação de Camadas de Reversão

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. APPLICATION ROLLBACK (Sub-segundo)                                 │
│    - Comutação atômica do Reverse Proxy para o slot anterior           │
│    - Comando: ./scripts/rollback-production.sh --target=vX.Y.Z         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. DATABASE ROLLBACK (Atômico)                                         │
│    - Restauração do snapshot pré-migração com integridade transacional │
│    - Comando: ./scripts/restore-database.sh <snapshot_file>            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. DATA RECOVERY (Disaster Recovery)                                   │
│    - Recuperação a partir de réplica fria S3 ou backup horário         │
│    - Comando: ./scripts/backup-database.sh                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Matriz de Comunicação e Postmortem

Após a estabilização do serviço:
1. Notificar os canais operacionais (`#incident-room` / Slack).
2. Registrar o incidente no `storage/audit/deployments.audit.json`.
3. Conduzir reunião de Postmortem sem culpados (Blameless Postmortem) em até 24 horas.
