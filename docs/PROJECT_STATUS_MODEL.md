# ================================================================
# ARQVERTICE STUDIO — MODELO DE ESTADOS DO PROJETO (C05)
# PROJECT_STATUS_MODEL.md
# ================================================================

VERSÃO: C05.1
DOCUMENTAÇÃO: OS 11 ESTADOS OFICIAIS DO CICLO DE VIDA DO PROJETO

---

## 1. MÁQUINA DE ESTADOS DO PROJETO

O ciclo de vida de todo projeto no **ArqVértice Studio** evolui através de **11 estados oficiais e rastreáveis** (Prompt C05 Item 3):

```
1. PLANEJAMENTO
       │
2. BRIEFING_APROVADO (C01)
       │
3. LEVANTAMENTO (C02)
       │
4. ESTUDOS (C03)
       │
5. CONCEITO (C04)
       │
6. DESENVOLVIMENTO (C05)
       │
7. VISUALIZAÇÃO
       │
8. APRESENTAÇÃO
       │
9. REVISÃO
       │
10. ENTREGA
       │
11. FINALIZADO
```

---

## 2. DEFINIÇÃO E CRITÉRIOS DE TRANSIÇÃO

| Estado | Descrição | Critério de Entrada | Critério de Saída |
|---|---|---|---|
| **PLANEJAMENTO** | Fase preliminar de alinhamento de escopo, montagem de equipe e proposta comercial. | Criação do projeto no estúdio. | Contrato firmado e envio do briefing. |
| **BRIEFING_APROVADO** | Necessidades e expectativas do cliente consolidadas no Briefing Técnico Interno (C01). | Aprovação formal do briefing pelo cliente. | Handover dos dados de lote e programa para o levantamento. |
| **LEVANTAMENTO** | Coleta in loco de medidas, topografia, fotos e estruturação da base do projeto (C02). | Início da visita técnica ou recebimento de arquivos DWG/Revit base. | Checklist de base 100% comprovado (`UNKNOWN` resolvidos). |
| **ESTUDOS** | Geração e contraste lado a lado de alternativas (A, B, C...) de layout, volumetria e fachada (C03). | Início dos estudos preliminares espaciais. | Decisão homologada pelo arquiteto e registrada na memória técnica. |
| **CONCEITO** | Consolidação da linguagem, narrativa, 13 estilos, paleta de cores e matriz Desejado × Evitar (C04). | Estudos preliminares promovidos ao conceito. | Homologação formal (`APPROVED`) da versão do conceito. |
| **DESENVOLVIMENTO** | Modelagem executiva detalhada no Autodesk Revit e detalhamentos 2D/3D no workspace central (C05). | Conceito aprovado liberado para equipe de projetos. | Pranchas executivas e compatibilização concluídas. |
| **VISUALIZAÇÃO** | Produção de perspectivas fotorrealistas e renders hiper-realistas (Corona/3ds Max) baseados no C04. | Modelagem do Revit pronta para render. | Pacote de imagens principais aprovado internamente. |
| **APRESENTAÇÃO** | Montagem do caderno executivo e material de apresentação para validação com o cliente. | Imagens e pranchas aprovadas internamente. | Apresentação realizada e aprovada pelo cliente. |
| **REVISÃO** | Incorporação de apontamentos de compatibilização ou ajustes pós-apresentação. | Solicitação formal de revisão pelo cliente ou engenharia. | Resolução da revisão com registro de impacto e responsável. |
| **ENTREGA** | Emissão do acervo final completo para canteiro de obras e licenças municipais. | Todas as pranchas e memoriais aprovados como `FINAL`. | Protocolo de entrega formal assinado. |
| **FINALIZADO** | Projeto concluído, obra liberada ou entregue com as-built arquivado. | Entrega física concluída. | Arquivamento do projeto para portfólio. |

---

## 3. RASTREABILIDADE E AUDITORIA

Toda alteração de estado global é registrada no histórico do projeto (`statusHistory`), contendo:
- Estado anterior e novo estado;
- Timestamp UTC da alteração;
- Nome do arquiteto ou líder responsável pela transição;
- Justificativa técnica ou ata de reunião que motivou a mudança.
