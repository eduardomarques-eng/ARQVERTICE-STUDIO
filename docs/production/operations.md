# ARQVERTICE STUDIO — MANUAL DE OPERAÇÕES DE PRODUÇÃO (K21)

> **Documento Oficial de Procedimentos Operacionais Padrão (SOP) & Manutenção**  
> **Versão:** 1.0.0 | **Ambientes:** Staging / Produção

---

## 1. Rotinas Operacionais Diárias

1. **Verificação de Saúde Matinal:**
   ```bash
   curl -s http://127.0.0.1:3000/api/health
   curl -s http://127.0.0.1:3000/healthz/ready
   ```
2. **Auditoria de Backups e Snapshots:**
   - Verificar arquivos gerados em `storage/snapshots/` e `storage/backups/`.
   - Garantir que o último backup tenha sido gerado há menos de 1 hora.
3. **Auditoria de Logs de Erro:**
   - Inspecionar `storage/audit/deployments.audit.json` para histórico de deploys.
   - Verificar ausência de anomalias no log estruturado JSON.

---

## 2. Janelas de Manutenção & Atualização de Infraestrutura

- **Janela Padrão:** Terças e Quintas-feiras das 02:00 às 04:00 BRT.
- **Deploys com Zero-Downtime:** Podem ser executados a qualquer momento em horário comercial graças à comutação atômica Blue-Green.
