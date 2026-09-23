# ArqVértice Studio — Sistema de Câmeras e Enquadramentos (D05)

> **Documento:** Arquitetura do Sistema de Câmeras e Enquadramentos por Ambiente  
> **Versão:** D05  
> **Módulo:** Visualização de Ambientes / Composição de Enquadramentos Fotográficos  
> **Pré-requisitos:** BLOCO A, BLOCO B, C01 a C06, D01 a D04  

---

## 1. Visão Geral e Objetivo

O **Sistema de Câmeras e Enquadramentos (D05)** é o subsistema do ArqVértice Studio responsável por gerenciar e padronizar os pontos de vista e enquadramentos fotográficos utilizados para a geração das perspectivas humanizadas (D04) e animações/vídeos (D06).

O objetivo é permitir que a ArqVértice defina com rigor milimétrico:
- Quais ângulos do ambiente merecem destaque de apresentação;
- A altura exata do observador (olhar em pé vs. sentado);
- A lente focal pretendida (grande angular de 24mm para amplitude vs. 50mm para marcenaria);
- A direção visual do foco (ex: "Norte para Painel da TV");
- A imagem de referência fotográfica (`CAMERA_REFERENCE`) para guiar a IA.

---

## 2. Anatomia e Campos da Câmera

Cada câmera registrada no ambiente contém:

| Campo | Descrição / Tipo | Exemplo Canônico |
| :--- | :--- | :--- |
| `id` | Identificador único persistido | `cam-sala-01` |
| `cameraCode` | Código curto de ordenação | `C01`, `C02`, `C03` |
| `name` | Título padronizado do enquadramento | `C01 — Sala olhando para painel` |
| `environmentId` | Vínculo com o ambiente específico | `amb-sala-01` |
| `description` | Intenção visual e elementos em foco | *"Vista principal focando painel ripado e deck"* |
| `origin` | Origem da definição do enquadramento | `REVIT`, `MANUAL`, `REFERENCIA`, `SUGESTAO_IA` |
| `cameraReferenceUrl`| Foto real / referência (`CAMERA_REFERENCE`)| URL de alta resolução da foto guia |
| `baseImageUrl` | Perspectiva técnica exportada do Revit | URL da imagem viewport do Revit |
| `status` | Estado no ciclo de aprovação | `DRAFT`, `APPROVED`, `LOCKED`, `ARCHIVED`, `REJECTED` |
| `currentVersion` | Versão ativa do enquadramento | `V01`, `V02`, `V03` |
| `orientation` | Orientação da imagem | `HORIZONTAL` (Paisagem), `VERTICAL` (Retrato) |
| `framing` | Tipo de enquadramento | `AMPLO_GERAL`, `PLANO_MEDIO`, `DETALHE_CLOSEUP`, `PANORAMICO` |
| `purpose` | Finalidade visual | `APRESENTACAO`, `TECNICA`, `DETALHE`, `ILUMINACAO`, `CLIENTE` |
| `positionDesc` | Posição física relativa no cômodo | *"Canto sudoeste da sala a 1.5m da porta"* |
| `targetDirection` | Direção do olhar / ponto de fuga | *"Norte para Painel da TV"* |
| `cameraHeightM` | Altura do observador (m) | `1.55` (em pé), `1.20` (sentado) |
| `focalLength` | Comprimento focal da lente | `24mm`, `35mm`, `50mm` |
| `aspectRatio` | Proporção de tela | `16:9`, `4:3`, `1:1`, `9:16` |
| `orderIndex` | Ordem de apresentação | `1`, `2`, `3`... |
| `isLocked` | Trava contra edições acidentais/IA | `true` ou `false` |

> [!NOTE]
> **Campos Técnicos Reais:** Os campos de posição, direção, lente e altura devem refletir dados reais quando disponíveis no modelo Revit ou definidos pelo arquiteto. O sistema **nunca inventa valores técnicos** inexistentes.

---

## 3. Origens do Enquadramento

Toda câmera registra expressamente sua origem:
1. `REVIT`: Câmera exportada de vista 3D ou enquadramento nativo do modelo BIM.
2. `MANUAL`: Enquadramento customizado criado pelo arquiteto ou designer de interiores.
3. `REFERENCIA`: Ponto de vista derivado de foto real ou moodboard (`CAMERA_REFERENCE`).
4. `SUGESTAO_IA`: Ponto de vista sugerido pela inteligência artificial com base na geometria do cômodo.

---

## 4. Sugestão por IA e Regra de Bloqueio Inviolável

A IA pode analisar o ambiente, as orientações solares e o layout para propor novos enquadramentos (`suggestCamerasByAI`). Contudo:
- **Câmeras Bloqueadas (`LOCKED`) são Invioláveis:** Nenhuma rotina automática ou sugestão de IA tem permissão para modificar, renomear ou sobrescrever uma câmera com `isLocked = true`.
- As sugestões de IA sempre nascem com o status `DRAFT` e origem `SUGESTAO_IA`, exigindo aprovação manual da equipe técnica.

---

## 5. Relação com Versões: Proteção contra Substituição Silenciosa

O enquadramento é um ativo técnico do projeto executivo. Se o arquiteto ou cliente alterar a lente (ex: de `24mm` para `35mm`), a altura ou a direção do olhar:
- O sistema **NUNCA substitui silenciosamente** a vista anterior.
- É criada uma **nova versão de enquadramento** (`V01` &rarr; `V02`).
- O histórico completo de parâmetros e notas de alteração permanece arquivado na tabela `environment_camera_versions` para consulta e auditoria.

---

## 6. Fluxo de Homologação (`APPROVE CAMERA`)

Quando uma câmera é aprovada:
1. Seu status transita para `APPROVED`.
2. Fica registrada a auditoria: usuário responsável (`approvedBy`) e data/hora (`approvedAt`).
3. Uma entrada de decisão técnica é gravada na Memória Estruturada do Projeto (C06) na categoria `DECISION`.
4. A câmera passa a ser considerada referência oficial de enquadramento para os motores de renderização humanizada (D04). Ao gerar novamente um render nessa câmera, o motor recupera automaticamente a geometria e enquadramento exatos correspondentes.

---

## 7. Operações de Organização e Governança

O módulo provê os seguintes controles:
- **Ordenar (`reorderCameras`):** Ajusta a sequência de apresentação das tomadas no caderno de arquitetura.
- **Duplicar (`duplicateCamera`):** Clona um enquadramento como base para testar uma variação de lente ou recorte.
- **Renomear (`renameCamera`):** Atualiza a descrição de foco da tomada.
- **Bloquear / Desbloquear (`lockCamera` / `unlockCamera`):** Congela o enquadramento contra qualquer alteração.
- **Arquivar (`archiveCamera`):** Remove a câmera das opções ativas de geração sem destruí-la do banco de dados.
- **Rejeitar (`rejectCamera`):** Registra o motivo de recusa técnica para reajuste.
