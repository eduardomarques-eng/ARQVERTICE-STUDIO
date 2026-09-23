# ================================================================
# ARQVERTICE STUDIO — ENTREGÁVEIS DO PROJETO (C05)
# PROJECT_DELIVERABLES.md
# ================================================================

VERSÃO: C05.1
DOCUMENTAÇÃO: DISCIPLINAS, TIPOS DE ENTREGÁVEIS E CLASSIFICAÇÃO DE ARQUIVOS

---

## 1. AS 8 DISCIPLINAS OFICIAIS

Para manter o rigor e clareza da governança de arquivos, o ArqVértice Studio organiza todos os entregáveis nas **8 disciplinas oficiais** (Prompt C05 Item 4):

1. **ARQUITETURA:** Plantas baixas gerais, cortes esquemáticos e executivos, elevações, fachadas, ampliações de escada e esquadrias.
2. **INTERIORES:** Layout detalhado de ambientes, paginação de pisos, forros refletidos, detalhes de banheiros e cozinha.
3. **PAISAGISMO:** Plantas de espécies vegetais, canteiros perimetrais, deck externo, paginação de caminhos e drenagem superficial.
4. **ILUMINAÇÃO:** Projeto luminotécnico conceitual e executivo, pontos de iluminação, circuitos e especificações de luminárias.
5. **MARCENARIA:** Pranchas de detalhamento milimétrico de marcenaria sob medida, ilhas gourmet, cavas e painéis ripados.
6. **VISUALIZACAO:** Renders 3D hiper-realistas (4K), vistas aéreas, estudos de luz solar e vídeos de passeio virtual.
7. **APRESENTACAO:** Pranchas de prancha conceitual, pranchas síntese, cadernos de apresentação e memoriais descritivos.
8. **OUTRA:** Disciplinas especiais ou relatórios técnicos complementares.

---

## 2. CICLO DE VIDA DO ENTREGÁVEL

Cada entregável passa pelo seguinte ciclo de homologação:

```
[ DRAFT ] ──▶ [ IN_REVIEW ] ──▶ [ APPROVED ] ──▶ [ SUPERSEDED ]
                     │
                     └──▶ [ REJECTED ]
```

- **DRAFT:** Em elaboração técnica pela equipe ou estagiário responsável.
- **IN_REVIEW:** Submetido para conferência do arquiteto coordenador ou engenheiro responsável.
- **APPROVED:** Homologado internamente e liberado para a fase de obra ou apresentação.
- **REJECTED:** Devolvido com apontamento formal de ajustes requeridos (`rejectionReason`).
- **SUPERSEDED:** Versão anterior congelada e arquivada após emissão de nova revisão (ex: V01 substituído por V02).

---

## 3. CLASSIFICAÇÃO DOS ARQUIVOS OFICIAIS

Para diferenciar rascunhos de arquivos chancelados para obra (Prompt C05 Item 17):

| Classificação | Finalidade | Regra de Uso |
|---|---|---|
| **WORKING** | Arquivo de trabalho ativo em edição contínua no Revit ou AutoCAD. | Sujeito a alterações sem aviso prévio; não usar em obra. |
| **REFERENCE** | Arquivo base ou levantamento servindo de consulta geométrica. | Bloqueado para edição direta; serve como vínculo externo. |
| **APPROVED** | Arquivo formalmente verificado e validado pela liderança da ArqVértice. | Liberado para orçamentação e compatibilização. |
| **FINAL** | Prancha ou modelo executivo pronto para plotagem e execução no canteiro. | Versão oficial e vinculante de entrega contratual. |
| **ARCHIVED** | Versão histórica mantida para fins de rastreabilidade e garantia. | Somente leitura no histórico de snapshots. |
