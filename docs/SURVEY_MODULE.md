# ARQVERTICE STUDIO — MÓDULO DE LEVANTAMENTO (C02)
## Manual Operacional de Organização da Base do Projeto e Integração Revit

---

### 1. Visão Geral e Princípios Fundamentais

O **Módulo de Levantamento (Bloco C02)** constitui o ambiente operacional interno do ArqVértice Studio onde toda a base documental, técnica e imagética é estruturada antes da fase de estudos volumétricos e visualização 3D.

#### Premissas Arquiteturais Invioláveis:
1. **O Revit é o Hub do Modelo BIM:** O ArqVértice Studio **não substitui** o Autodesk Revit, não atua como AutoCAD nem edita geometria BIM diretamente nesta etapa. O sistema consome e organiza os resultados produzidos pela equipe no Revit.
2. **Preservação de Originais:** Nenhum arquivo original sofre alteração destrutiva. O sistema cria derivados otimizados (thumbnails e previews), mantendo hashes e URLs originais íntegros.
3. **Versionamento Não-Destrutivo:** O envio de uma nova prancha ou imagem nunca sobrescreve o arquivo anterior silenciosamente; gera sequenciais (ex: `PLANTA V01`, `PLANTA V02`) com controle de status (`CURRENT`, `APPROVED`, `SUPERSEDED`).
4. **Governança Antialucinação da IA:** Qualquer geometria, cota ou elemento que não possua respaldo em planta ou perspectiva oficial é categorizado estritamente como `UNKNOWN` ou `NOT_CONFIRMED`.

---

### 2. As 10 Subáreas de Trabalho

O Workspace de Levantamento está dividido em 10 subáreas especializadas:

| # | Subárea | Finalidade Operacional | Tipos de Ativo Primários |
|---|---|---|---|
| **01** | **PROJETO** | Visão panorâmica da base, métricas de cobertura, status do Revit e ativos recentes. | Todos os ativos |
| **02** | **PAVIMENTOS** | Organização vertical por níveis (Térreo, Superior, Cobertura, Terreno/Implantação). | `PLANTA`, `CORTE`, `ELEVACAO` |
| **03** | **AMBIENTES** | Fichas dos ambientes com checklist de validação (8 itens) e contexto consolidado. | Todos vinculados a cômodos |
| **04** | **PLANTAS** | Galeria técnica de plantas baixas com escala, orientação solar e versionamento. | `PLANTA`, `PLANTA_HUMANIZADA` |
| **05** | **PERSPECTIVAS** | Rastreabilidade de vistas do Revit (câmeras, fases, finalidade estética). | `PERSPECTIVA`, `VISTA` |
| **06** | **ELEVAÇÕES** | Fachadas externas e elevações internas para validação de aberturas e alturas. | `ELEVACAO`, `FACHADA` |
| **07** | **CORTES** | Cortes técnicos e esquemáticos indicando pé-direito, cotas de lajes e desníveis. | `CORTE` |
| **08** | **FOTOS** | Registros de vistoria, topografia e elementos existentes a preservar. | `FOTO` |
| **09** | **REFERÊNCIAS** | Gestão de conjuntos temáticos (`REFERENCE_SET`) com priorização de materiais e estilo. | `MATERIAL`, `MOVEL`, `ILUMINACAO`, `ESTILO` |
| **10** | **DOCUMENTOS** | Laudos geotécnicos de sondagem, certidões de lote, convenções e modelos brutos BIM/CAD. | `OUTRO`, `MODELO_3D` |

---

### 3. Integração e Rastreabilidade do Revit

Ao catalogar perspectivas ou plantas provenientes do Autodesk Revit, o módulo registra:
- **Vista do Modelo (`revit_view_name`):** Nome exato da vista configurada no navegador de projetos do Revit (ex: `3D - Living Social`).
- **Fase de Projeto (`revit_phase`):** Parâmetro de phasing do Revit (`Existente`, `Demolir`, `Nova Construção`, `Fase 01`).
- **Identificação da Câmera (`revit_camera_name`):** Nome e lente da câmera posicionada no modelo (ex: `Cam_Living_01`, 24mm).
- **Finalidade:** Objetivo técnico da imagem (ex: validação de amplitude visual, estudo solar de brises).

---

### 4. Checklist do Levantamento por Ambiente

Cada ambiente possui um checklist obrigatório composto por 8 itens estruturados:
1. `planta_recebida`: Planta baixa arquitetônica vinculada ao ambiente.
2. `perspectiva_recebida`: Perspectiva volumétrica ou captura do Revit anexada.
3. `referencias_recebidas`: Referências visuais e de acabamentos cadastradas.
4. `medidas_disponiveis`: Área útil e dimensões confirmadas.
5. `aberturas_identificadas`: Portas, janelas e vãos livres demarcados.
6. `elementos_existentes_identificados`: Árvores, interferências ou alvenarias preservadas.
7. `restricoes_registradas`: Regras e restrições do Briefing Técnico (C01) mapeadas.
8. `referencias_principais_definidas`: Conjunto de referências (`REFERENCE_SET`) homologado.

*Regra:* O checklist nunca é marcado automaticamente apenas pela existência de um arquivo anexado. A validação exige confirmação expressa do arquiteto responsável.
