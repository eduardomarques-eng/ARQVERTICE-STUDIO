# Video Timeline Editor — Bloco G12

## Visão Geral

O **Video Timeline Editor** é o editor visual básico de vídeo do ArqVertice Studio. Ele fornece uma timeline multi-faixa para montagem do projeto de vídeo, com edição inteiramente **não destrutiva**.

> **IMPORTANTE**: Este módulo **NÃO tenta recriar** Premiere, DaVinci Resolve ou After Effects. O objetivo é fornecer uma **timeline simples** para montagem do projeto.

---

## Estrutura de Faixas (Tracks)

A timeline organiza o conteúdo em **5 faixas independentes**:

| Faixa         | Descrição                          | Cor       | Sobreposição |
|---------------|-------------------------------------|-----------|--------------|
| **VIDEO**     | Clipes de vídeo / renders / imagens | `#6366f1` | Não          |
| **AUDIO**     | Trilhas sonoras / efeitos sonoros   | `#22c55e` | Sim          |
| **VOICE**     | Narração / locução / voiceover      | `#f59e0b` | Não          |
| **TEXT**       | Legendas / overlays de texto        | `#ec4899` | Sim          |
| **TRANSITIONS**| Transições entre clipes de vídeo   | `#8b5cf6` | Não          |

---

## Timeline Visual

```
00:00                                                02:15
────────────────────────────────────────────────────────
 VIDEO   │ Cena 01 │ Cena 02 │ Cena 03 │ Cena 04 │
────────────────────────────────────────────────────────
 AUDIO   │     Trilha Sonora Ambiente              │
────────────────────────────────────────────────────────
 VOICE   │ Narr 01 │ Narr 02 │ Narr 03 │ Narr 04 │
────────────────────────────────────────────────────────
 TEXT    │ Legenda │         │ Legenda │         │
────────────────────────────────────────────────────────
 TRANS   │    X    │    X    │    X    │
────────────────────────────────────────────────────────
```

---

## Operações Permitidas

Todas as operações são **não destrutivas** — nunca alteram ou destroem assets originais:

| Operação        | Descrição                                              |
|-----------------|--------------------------------------------------------|
| **Mover**        | Reposicionar clipe na timeline (alterar `positionSeconds`) |
| **Cortar (Split)**| Dividir clipe em duas partes no ponto de corte         |
| **Duplicar**     | Criar cópia do clipe com mesmo source, posição seguinte |
| **Excluir**      | Remover clipe da timeline (asset original preservado)   |
| **Ajustar Duração**| Alterar `durationSeconds` do clipe                    |
| **Reorganizar**  | Reordenar clipes dentro de uma faixa                   |

---

## Metadados Exibidos

A interface exibe em tempo real:

- **Duração Total** — Calculada a partir da faixa VIDEO (posição + duração do último clipe)
- **FPS** — Frames por segundo (herdado do projeto de vídeo)
- **Resolução** — Largura × Altura (ex: 1920×1080)
- **Proporção** — Aspect ratio (ex: 16:9)

---

## Edição Não Destrutiva

> **Regra Mandatória**: Toda edição deve ser não destrutiva. Não destruir assets originais.

Os clipes na timeline são **referências** ao conteúdo original:
- `sourceType` indica o tipo de fonte (scene, storyboard_frame, narration, overlay_text, transition)
- `sourceId` aponta para o asset original
- Cortar, mover, duplicar ou excluir um clipe **nunca altera** o conteúdo fonte
- A exclusão de um clipe retorna `{ deleted: true, assetPreserved: true }`

---

## Preview

O editor inclui controles de preview:
- **▶ Play**: Reprodução simulada com playhead avançando pela timeline
- **❚❚ Pause**: Pausa a reprodução no ponto atual
- **■ Stop**: Para e retorna ao início (00:00)
- **Seek**: Clique na barra de progresso para navegar a qualquer ponto

---

## Geração Automática

A timeline pode ser gerada automaticamente a partir do **Storyboard (G06)**:

```
generateTimelineFromStoryboard(videoProjectId, options)
```

Este método:
1. Lê todos os quadros do storyboard
2. Cria clipes VIDEO para cada quadro
3. Cria clipes VOICE para narrações
4. Cria clipes TEXT para legendas
5. Cria clipes TRANSITIONS para transições entre cenas
6. Calcula a duração total automaticamente

---

## Transições Disponíveis

| ID           | Nome                  | Duração Padrão |
|--------------|------------------------|----------------|
| `none`       | Sem transição          | 0s             |
| `cut`        | Corte seco             | 0s             |
| `crossfade`  | Crossfade              | 0.5s           |
| `fade_black` | Fade para preto        | 1.0s           |
| `fade_white` | Fade para branco       | 1.0s           |
| `dissolve`   | Dissolve               | 0.8s           |
| `wipe_left`  | Wipe para esquerda     | 0.6s           |
| `wipe_right` | Wipe para direita      | 0.6s           |
| `zoom_in`    | Zoom In                | 0.5s           |
| `zoom_out`   | Zoom Out               | 0.5s           |

---

## Bloqueio de Timeline

Ao bloquear uma timeline (`isLocked = true`), **todas** as operações de edição são impedidas:
- Adicionar, editar, mover, duplicar, excluir, cortar e reorganizar clipes
- Apenas leitura e visualização são permitidas

---

## API de Estado (StudioState)

### Constantes
- `TIMELINE_TRACKS` — Array com as 5 faixas
- `TIMELINE_TRACK_CONFIG` — Configuração visual por faixa
- `TIMELINE_TRANSITIONS` — Tipos de transição disponíveis
- `TIMELINE_DEFAULT_FPS` — FPS padrão (30)
- `TIMELINE_DEFAULT_RESOLUTION` — Resolução padrão (1920×1080)
- `TIMELINE_DEFAULT_ASPECT_RATIO` — Proporção padrão (16:9)

### Métodos de Timeline
- `createTimeline(opts)` — Cria timeline para um projeto de vídeo
- `getTimeline(id)` — Busca timeline por ID
- `getProjectTimeline(videoProjectId)` — Busca timeline por projeto de vídeo
- `updateTimeline(id, updates, user)` — Atualiza propriedades da timeline

### Métodos de Clipe
- `addTimelineClip(timelineId, clipData, user)` — Adiciona clipe
- `getTimelineClip(clipId)` — Busca clipe por ID
- `getTimelineClips(timelineId, trackFilter?)` — Lista clipes
- `updateTimelineClip(clipId, updates, user)` — Atualiza clipe

### Operações de Edição
- `moveTimelineClip(clipId, newPosition, user)` — Mover
- `splitTimelineClip(clipId, splitAtSeconds, user)` — Cortar
- `duplicateTimelineClip(clipId, user)` — Duplicar
- `deleteTimelineClip(clipId, user)` — Excluir
- `resizeTimelineClip(clipId, newDuration, user)` — Redimensionar
- `reorderTimelineClips(timelineId, track, orderedIds, user)` — Reorganizar

### Geração e Metadados
- `generateTimelineFromStoryboard(videoProjectId, options)` — Auto-gerar
- `getTimelineMetadata(timelineId)` — Metadados completos
- `getTimelinePreviewData(timelineId)` — Dados para preview

---

## Interface Visual (VideoTimelineModule)

- `render(videoProjectId)` — Renderiza o editor completo
- `selectClip(clipId)` — Seleciona clipe para edição
- `moveClip(clipId, position)` — Move clipe
- `resizeClip(clipId, duration)` — Redimensiona clipe
- `splitClip(clipId)` — Corta ao meio
- `duplicateClip(clipId)` — Duplica clipe
- `deleteClip(clipId)` — Exclui clipe
- `togglePreview()` / `startPreview()` / `pausePreview()` / `stopPreview()` — Preview
- `regenerateFromStoryboard()` — Regera timeline do storyboard

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `database/migrations/0031_video_timeline.sql` | Migração SQL |
| `database/schema/36_video_timeline.sql` | Documentação do schema |
| `js/state.js` (Seção G12) | Métodos de estado e constantes |
| `js/video-timeline-module.js` | Módulo de interface visual |
| `tests/video-timeline.test.js` | Suíte de testes (18 testes) |
| `docs/video-timeline.md` | Esta documentação |
