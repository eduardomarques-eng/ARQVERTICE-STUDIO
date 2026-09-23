# Video Render Engine — Pipeline de Renderização e Exportação de Vídeo

## 1. Visão Geral e Objetivo

O **Video Render Engine (Bloco G13)** do ArqVertice Studio é o subsistema responsável por orquestrar a compilação, normalização, codificação e exportação da timeline arquitetural em arquivos de vídeo prontos para apresentação e distribuição.

O pipeline foi projetado com foco em:
- **MP4 como Prioridade Absoluta**: Máxima compatibilidade em reprodutores de mídia, navegadores, dispositivos móveis e sistemas de projeção corporativa.
- **Extensibilidade Multi-formato**: Arquitetura desacoplada preparada para containers WebM, QuickTime MOV e Apple ProRes para fluxos futuros de pós-produção e masterização.
- **Normalização de Provedores de IA**: Capacidade de absorver resoluções e taxas de quadros heterogêneas geradas por diferentes motores generativos de IA (Luma, Runway, Kling, Sora) sem quebrar o layout final.
- **Tolerância a Falhas e Não-Destrutividade**: Falhas de renderização nunca corrompem o projeto, a timeline ou os assets originais. O sistema permite retentativas (*retry*) imediatas e mantém logs detalhados de erros.
- **Versionamento Nativo**: Cada exportação concluída gera uma versão rastreável e auditável (`v1.0`, `v1.1`, `v2.0`...), permitindo controle rigoroso de entregas a clientes e investidores.

---

## 2. Formatos Suportados

| Formato | Container | Codec Padrão | Status | Uso Recomendado |
| :--- | :--- | :--- | :--- | :--- |
| **MP4** | `.mp4` (MPEG-4 Part 14) | H.264 / AAC | **Primário / Prioridade** | Distribuição universal, web, redes sociais e apresentações. |
| **WebM** | `.webm` | VP9 / Opus | Preparado (Futuro) | Ambientes web com alta compressão open-source. |
| **MOV** | `.mov` (QuickTime) | H.264 / AAC | Preparado (Futuro) | Suítes de edição e ecossistema macOS. |
| **ProRes** | `.mov` (Apple ProRes 422) | ProRes / PCM | Preparado (Futuro) | Arquivamento de master de altíssima fidelidade sem perdas perceptuais. |

---

## 3. Presets Canônicos de Exportação

O ArqVertice Studio disponibiliza 5 presets pré-calibrados para a indústria da arquitetura e incorporação imobiliária:

| Preset | Resolução Alvo | Aspect Ratio | FPS | Bitrate | Codec Vídeo | Codec Áudio | Cenário de Uso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`WEB`** | 1080p (1920x1080) | 16:9 | 30 | 8.000 kbps | H.264 | AAC 192 kbps | Portfólios online, sites institucionais e streaming leve. |
| **`SOCIAL_VERTICAL`** | 1080p (1080x1920) | 9:16 | 30 | 10.000 kbps | H.264 | AAC 192 kbps | Instagram Reels, TikTok, YouTube Shorts e WhatsApp Stories. |
| **`SOCIAL_HORIZONTAL`** | 1080p (1920x1080) | 16:9 | 30 | 10.000 kbps | H.264 | AAC 192 kbps | Feed do YouTube, LinkedIn, Vimeo e displays horizontais. |
| **`CLIENT_PRESENTATION`** | 1080p (1920x1080) | 16:9 | 60 | 16.000 kbps | H.264 | AAC 320 kbps | Reuniões presenciais de aprovação, telões e TV executiva. |
| **`HIGH_QUALITY`** | 4K (3840x2160) | 16:9 | 60 | 35.000 kbps | H.265 (HEVC) | AAC 320 kbps | Master Ultra HD de arquivo e renders finais para material publicitário. |

---

## 4. Configurações Granulares e Parâmetros

Caso o usuário queira personalizar a renderização para além dos presets, os seguintes parâmetros são parametrizáveis:

1. **Resolução**:
   - `1080p` (Padrão inicial): 1920x1080 (16:9) ou 1080x1920 (9:16).
   - `4K` (Ultra HD): 3840x2160 (16:9) ou 2160x3840 (9:16).
   - `1440p` (Quad HD 2K): 2560x1440.
   - `720p` (HD leve): 1280x720.
2. **Taxa de Quadros (FPS)**:
   - `24 FPS`: Estilo cinema / filme conceitual.
   - `30 FPS`: Padrão suave para reprodução em telas digitais.
   - `60 FPS`: Movimentos hiper-fluidos para tour virtual imersivo.
3. **Bitrate**:
   - Configurável de 2.000 kbps a 60.000 kbps com cálculo de estimativa de tamanho final do arquivo.
4. **Áudio**:
   - Codec AAC com taxas selecionáveis de 128 kbps, 192 kbps (padrão) e 320 kbps (master), estéreo 48 kHz.
5. **Codec de Vídeo**:
   - `H.264`: Aceleração universal por hardware em GPU e navegadores.
   - `H.265 (HEVC)`: Otimizado para entregas 4K com dobro de eficiência de compressão.
   - `VP9` e `ProRes`: Disponíveis para perfis avançados.
6. **Proporção (Aspect Ratio)**:
   - `16:9` (horizontal) e `9:16` (vertical) com ajuste proporcional automático.

---

## 5. Heterogeneidade de Provedores de IA & Normalização

Diferentes modelos de IA generativa produzem saídas com resoluções despadronizadas (ex.: Luma gera 720p nativo, Runway Gen-3 pode produzir 1080p, Midjourney Upscale gera 4K, Kling gera proporções personalizadas).

O pipeline do ArqVertice implementa o método:
```javascript
StudioState.normalizeProviderResolution(source, target)
```
- **Upscaling / Downscaling Automático**: Redimensionamento com interpolação de alta qualidade para coincidir com a resolução alvo (1080p ou 4K).
- **Letterboxing / Pillarbox**: Quando o aspect ratio do clipe difere do container, preenchimento neutro é aplicado sem distorcer as proporções arquitetônicas originais.
- **Relatório de Normalização**: Cada job armazena `providerResolutionsDetected` e `normalizationApplied`, documentando as transformações aplicadas em cada clipe.

---

## 6. Ciclo de Vida do Job (Status Flow)

O ciclo de vida dos jobs de renderização segue a máquina de estados estrita:

```
  [queued] ──────► [processing] ──────┬──────► [completed]  ──► Gera VideoRenderVersion
                                     │
                                     ├──────► [failed]     ──► Permite Retry (projeto 100% intacto)
                                     │
                                     └──────► [cancelled]
```

### Estados:
1. **`queued`**: O job está na fila de espera aguardando recursos de processamento.
2. **`processing`**: Renderização em andamento com atualização periódica de progresso (`progressPercent`), fase atual (`currentPhase`) e tempo estimado restante.
3. **`completed`**: Renderização concluída com sucesso. Gera o arquivo final, registra a URL e dispara automaticamente a criação de uma `VideoRenderVersion`.
4. **`failed`**: Ocorreu uma interrupção ou falha de codificação. Registra mensagem de erro detalhada.
5. **`cancelled`**: Cancelado intencionalmente pelo operador antes da conclusão.

---

## 7. Resiliência e Política de Falhas

> [!IMPORTANT]
> **Salvaguarda de Integridade**:
> Se qualquer job de renderização falhar, **o projeto, a timeline, os cortes e os assets originais permanecem absolutamente intactos**.

- **Suporte a Retry**:
  O operador pode acionar `StudioState.retryRenderJob(jobId)` a qualquer momento.
- O contador de tentativas (`retryCount`) é incrementado, o status retorna para `queued` com progresso zerado e uma nova tentativa é processada sem necessidade de recriar a timeline ou os metadados do vídeo.

---

## 8. Versionamento de Vídeo

Cada render finalizado com sucesso registra um item permanente em `video_render_versions`:
- **Numeração Canônica**: Inicia em `v1.0`, avançando para `v1.1`, `v1.2`, etc.
- **Metadados Rastreáveis**: Armazena tamanho em bytes, preset utilizado, codec, resolução, checksum SHA-256 e URL do asset.
- **Versão Primária**: Uma versão pode ser marcada como `isPrimary: true`, representando a versão homologada para entrega oficial ao cliente.

---

## 9. API do State Management (`StudioState`)

Principais métodos expostos em `js/state.js`:

```javascript
// Criar job na fila
const job = StudioState.createRenderJob({
  videoProjectId: 'prj-video-01',
  preset: 'WEB', // ou SOCIAL_VERTICAL, CLIENT_PRESENTATION, HIGH_QUALITY...
  format: 'mp4',
  resolution: '1080p'
});

// Iniciar processamento
StudioState.processRenderJob(job.id);

// Atualizar progresso
StudioState.updateRenderJobProgress(job.id, 65.0, 'Codificando H.264 MP4');

// Concluir com sucesso (cria versão automaticamente)
const result = StudioState.completeRenderJob(job.id, {
  outputUrl: 'https://cdn.arqvertice.com/renders/video_v1.0.mp4'
});

// Tratamento de falha (não perde o projeto)
StudioState.failRenderJob(job.id, 'Timeout na resposta do encoder');

// Retentar job com falha
StudioState.retryRenderJob(job.id);

// Consultar versões do projeto
const versions = StudioState.getVideoVersions('prj-video-01');
```
