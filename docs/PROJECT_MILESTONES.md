# ================================================================
# ARQVERTICE STUDIO — MARCOS DO PROJETO (C05)
# PROJECT_MILESTONES.md
# ================================================================

VERSÃO: C05.1
DOCUMENTAÇÃO: OS 9 MARCOS OFICIAIS E CRITÉRIOS DE CONQUISTA

---

## 1. OS 9 MARCOS OFICIAIS (MILESTONES)

O progresso global do projeto é pontuado por **9 marcos oficiais** sequenciais (Prompt C05 Item 8):

1. **BRIEFING APROVADO (`BRIEFING_APROVADO`):**
   - *Critério:* Validação formal de todas as necessidades do cliente no Briefing Técnico Interno (C01).
   - *Evidência:* Registro de aprovação do cliente e documento C01 emitido.

2. **LEVANTAMENTO CONCLUÍDO (`LEVANTAMENTO_CONCLUIDO`):**
   - *Critério:* Topografia, medidas in loco, restrições urbanísticas e fotos catalogadas (C02).
   - *Evidência:* Checklist de levantamento 100% verificado sem dados desconhecidos críticos.

3. **ESTUDOS CONCLUÍDOS (`ESTUDOS_CONCLUIDOS`):**
   - *Critério:* Alternativas espaciais comparadas e decisão técnica formal homologada (C03).
   - *Evidência:* Registro formal em `study_decisions` com justificativa do arquiteto.

4. **CONCEITO APROVADO (`CONCEITO_APROVADO`):**
   - *Critério:* Narrativa, 13 estilos, paleta de cores e matriz Desejado × Evitar consolidadas (C04).
   - *Evidência:* Versão do conceito com status `APPROVED` em `design_concepts`.

5. **PROJETO EM DESENVOLVIMENTO (`PROJETO_EM_DESENVOLVIMENTO`):**
   - *Critério:* Início da modelagem paramétrica detalhada no Autodesk Revit e alocação de entregáveis (C05).
   - *Evidência:* Vínculos de vistas do Revit ativos e entregáveis cadastrados no workspace.

6. **PROJETO CONSOLIDADO (`PROJETO_CONSOLIDADO`):**
   - *Critério:* Conclusão e compatibilização do conjunto executivo de arquitetura, interiores e marcenaria.
   - *Evidência:* 100% dos entregáveis técnicos com status `APPROVED` ou `FINAL`.

7. **VISUALIZAÇÃO CONCLUÍDA (`VISUALIZACAO_CONCLUIDA`):**
   - *Critério:* Geração de imagens e renders fotorrealistas de alta fidelidade para todos os ambientes principais.
   - *Evidência:* Renders com resolução 4K aprovados pela liderança de design.

8. **APRESENTAÇÃO APROVADA (`APRESENTACAO_APROVADA`):**
   - *Critério:* Caderno executivo de apresentação aprovado pelo cliente final.
   - *Evidência:* Ata de apresentação assinada ou confirmação por canal formal do cliente.

9. **ENTREGA (`ENTREGA`):**
   - *Critério:* Emissão das pranchas definitivas para a equipe de canteiro de obras e prefeitura.
   - *Evidência:* Termo de entrega e as-built final emitido.

---

## 2. REGRA CONTRA MARCAÇÃO AUTOMÁTICA PRECOCE

> **Regra Rígida (Prompt C05 Item 8):**
> Nenhum marco pode ser marcado como conquistado (`is_achieved = true`) por estimativa superficial de arquivos ou por automação de IA sem a checagem explícita de seus critérios de aceite.
> Toda conquista de marco deve registrar `achieved_by` (responsável) e `achieved_at` (data/hora auditável).
