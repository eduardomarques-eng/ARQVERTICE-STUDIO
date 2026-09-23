# ================================================================
# ARQVERTICE STUDIO — INTEGRAÇÃO COM AUTODESK REVIT (C05)
# REVIT_REFERENCE_MODEL.md
# ================================================================

VERSÃO: C05.1
DOCUMENTAÇÃO: MODELO DE REFERÊNCIA, VÍNCULOS E RASTREABILIDADE REVIT

---

## 1. PAPEL DO AUTODESK REVIT NO ARQVERTICE STUDIO

O **Autodesk Revit** é a plataforma oficial de modelagem da informação da construção (BIM) e documentação técnica da ArqVértice.

O ArqVértice Studio **não tenta duplicar as capacidades paramétricas do Revit**, mas atua como a **camada de governança e documentação de resultados**:
- Cada arquivo ou prancha exportada do modelo pode ser marcada com `origin = 'REVIT'`.
- O sistema registra o contexto exato da vista e do pavimento para que qualquer membro da equipe ou cliente saiba de onde aquele documento se origina.

---

## 2. METADADOS ESTRUTURADOS DO REVIT (Prompt C05 Item 6)

Para todo entregável proveniente do Revit, o estúdio registra:

| Metadado | Descrição | Exemplo |
|---|---|---|
| **origin** | Identificador de proveniência | `REVIT` |
| **revit_view_name** | Nome exato da vista no Project Browser | `Planta - Térreo - Executivo & Cotas` |
| **revit_level** | Nível ou pavimento associado | `Pavimento Térreo (Nível 0.00)` |
| **revit_environment** | Ambiente focal ou escopo espacial | `Living & Varanda Integrada` ou `Geral` |
| **revit_version** | Versão do software e build do arquivo | `Autodesk Revit 2026.2` |
| **revit_export_date** | Data e hora exata da exportação | `2026-09-21T11:00:00Z` |
| **revit_notes** | Notas técnicas do modelador BIM | `Folha A101 pronta para plotagem; eixos compatibilizados.` |

---

## 3. PRINCÍPIO DE NÃO-INFERÊNCIA

> **Regra Crucial (Prompt C05 Item 6):**
> O sistema **NÃO deve tentar inferir automaticamente** dados que não estejam formalmente disponíveis no arquivo ou no metadado cadastrado.
> Se uma vista não tiver pavimento explícito, ela deve ser registrada como `Geral` ou `Multi-nível`, sem suposições que possam gerar erros no canteiro de obras.
