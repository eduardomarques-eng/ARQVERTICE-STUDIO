# Configurador de Vídeo do Studio (Video Studio Configurator) — Bloco G02

## 1. Visão Geral e Objetivo

O **Configurador de Vídeo** do ArqVértice Studio é o estágio em que o usuário define o **objetivo estratégico e os parâmetros técnicos/cinemáticos** antes de produzir qualquer roteiro, storyboard ou renderização de vídeo.

### 1.1 Regra de Ouro: Proibição de Geração Automática Prévia
O sistema **NÃO gera automaticamente um vídeo ou seus assets** antes que o usuário confirme expressamente as configurações através do botão **`CONTINUAR PARA NARRATIVA`**. Essa trava impede o consumo desnecessário de processamento e assegura que todo o pipeline subsequente seja orientado pelo objetivo escolhido.

---

## 2. Catálogo dos 12 Tipos Canônicos de Vídeo

| Nº | Tipo | Escopo | Descrição & Propósito | Proporção Recomendada |
|---|---|---|---|---|
| **1** | `APRESENTAÇÃO COMPLETA` | Geral | Apresentação integral do projeto (fachadas, interiores, áreas sociais e íntimas). | 16:9 |
| **2** | `APRESENTAÇÃO POR AMBIENTE` | Ambiente | Foco exclusivo em um ambiente específico previamente selecionado. | 16:9 |
| **3** | `VÍDEO DE CONCEITO` | Partido | Foco no partido arquitetônico, inspirações, volumetria e intenção plástica. | 16:9 |
| **4** | `WALKTHROUGH` | Percurso | Sequência contínua simulando o percurso físico real pelos espaços do projeto. | 16:9 |
| **5** | `REEL` | Social | Conteúdo curto, vertical e dinâmico otimizado para Instagram e TikTok. | 9:16 |
| **6** | `SHORT` | Social | Conteúdo curto de alto impacto para YouTube Shorts e Reels rápidos. | 9:16 |
| **7** | `APRESENTAÇÃO PARA CLIENTE` | Executivo | Conteúdo institucional e explicativo para alinhamento em reuniões de apresentação. | 16:9 |
| **8** | `VÍDEO INSTITUCIONAL` | Marca | Apresentação de alto padrão destacando a autoridade e assinatura do escritório. | 16:9 |
| **9** | `ANTES/DEPOIS` | Reforma | Comparativo direto entre a situação existente e a proposta reformada. | 16:9 |
| **10** | `VÍDEO DE MOODBOARD` | Atmosfera | Foco na paleta de materiais, texturas táteis, iluminação e atmosfera sensorial. | 1:1 |
| **11** | `VÍDEO DE AMBIENTE` | Espaço | Um ambiente específico detalhado com ergonomia, layout e marcenaria. | 16:9 |
| **12** | `VÍDEO DE DETALHES` | Fino | Close-ups em marcenaria sob medida, iluminação linear, pedras e peças de design. | 4:5 |

---

## 3. Matriz de Configurações Técnicas & Cinemáticas

### 3.1 Proporções de Tela & Orientações
* **16:9 (Horizontal / Widescreen)**: Ideal para apresentações na TV, reuniões presenciais, projeção e YouTube.
* **9:16 (Vertical / Stories / Reels)**: Formato para visualização em smartphones e redes sociais verticais.
* **1:1 (Quadrado)**: Formato para feeds do Instagram, LinkedIn e carrosséis.
* **4:5 (Retrato Vertical)**: Formato para postagens no feed vertical do Instagram com maior área de tela.

### 3.2 Durações Predefinidas e Personalizada
* **15s**: Pílula visual ou teaser de impacto rápido.
* **30s**: Tempo padrão para Reels, Shorts e stories.
* **45s**: Spot intermediário para demonstração de conceito ou moodboard.
* **60s**: 1 minuto ideal para tours de ambientes individuais.
* **90s**: 1m30s para walkthroughs completos e narrados.
* **120s**: 2 minutos para apresentações executivas aprofundadas.
* **Personalizada**: **Sem qualquer limitação artificial** em segundos (ex: 180s, 300s), respeitando a capacidade do motor de exportação.

### 3.3 Resoluções de Exportação
* `720p` (HD Rápido)
* `1080p` (Full HD Padrão)
* `2K` (QHD para Monitores de Alta Densidade)
* `4K` (Ultra-Resolução para Apresentações em Telas Grandes)

### 3.4 Ritmo dos Cortes (Pacing)
* `lento_contemplativo`: Transições suaves, planos lentos, música ambiente, atmosfera imersiva.
* `suave_moderado`: Ritmo tradicional da arquitetura contemporânea, percurso claro e contínuo.
* `dinamico_rapido`: Cortes rápidos, transições marcadas e trilha energética.

### 3.5 Estilos Narrativos
* `institucional`: Sóbrio, formal e corporativo, destacando a precisão técnica.
* `sensorial`: Focado no conforto, sensação térmica, luz natural e aconchego.
* `tecnico`: Destaca plantas, cotas, eixos estruturais e especificações construtivas.
* `comercial`: Persuasivo, focado no apelo estético para vendas ou captação de clientes.
* `minimalista`: Poético, com poucos textos, valorizando o silêncio e o vazio arquitetônico.

### 3.6 Parâmetros Audiovisuais (Toggles)
* **Presença de Voz (`hasVoiceover`)**: Habilita a geração e alocação de locução guia ou profissional.
* **Presença de Música (`hasMusic`)**: Trilha sonora equalizada com base no ritmo selecionado.
* **Presença de Textos (`hasTextOverlays`)**: Títulos de abertura, identificadores de ambiente e cotas.
* **Presença de Legendas (`hasSubtitles`)**: Legendas sincronizadas para reprodução em redes sem áudio.
* **Quantidade de Cenas (`scenesCount`)**: Planejamento do número de planos de corte (1 a 16 cenas).

---

## 4. Presets Prontos (Configuração com 1 Clique)

O sistema disponibiliza presets prontos:

1. **Reel Dinâmico**: 9:16, 30s, Dinâmico, Comercial, com música e textos, 4 cenas.
2. **Walkthrough Cinemático**: 16:9, 90s, 4K, Suave, Sensorial, com voz, música e textos, 6 cenas.
3. **Apresentação para Cliente**: 16:9, 120s, 4K, Suave, Institucional, com voz, música, textos e legendas, 8 cenas.
4. **Short de Alto Impacto**: 9:16, 15s, Dinâmico, Comercial, com música e textos, 3 cenas.
5. **Vídeo de Moodboard & Texturas**: 1:1, 45s, 2K, Lento, Sensorial, com música e textos, 4 cenas.
6. **Vídeo de Detalhes & Mobiliário**: 4:5, 30s, 2K, Lento, Sensorial, com música e textos, 4 cenas.
7. **Antes / Depois da Reforma**: 16:9, 30s, Suave, Técnico, com música e textos comparativos, 2 cenas.

---

## 5. Fluxo de Confirmação & Transição para o Bloco G03

A tela **"Configuração do vídeo"** possui a ação mandatória:

$$\boxed{\text{\textbf{CONTINUAR PARA NARRATIVA}}}$$

Ao acionar esse botão:
1. `StudioState.confirmVideoConfig(videoId, user)` valida os parâmetros;
2. Grava `configConfirmed = true` e timestamp de confirmação;
3. Atualiza o status do vídeo de `rascunho` para `planejamento`;
4. Registra auditoria no sistema e evento no cronograma do projeto;
5. Prepara o estado para receber o motor de narrativa arquitetônica (previsto no Bloco G03).

---

## 6. APIs e Métodos Disponíveis no `StudioState`

```javascript
// Catálogo de Presets
StudioState.getVideoConfigPresets();

// Leitura da Configuração
StudioState.getVideoConfig(videoId);

// Salvamento Parcial / Rascunho de Configuração
StudioState.saveVideoConfig(videoId, {
  type: 'WALKTHROUGH',
  aspectRatio: '16:9',
  duration: '90s',
  durationSeconds: 90,
  resolution: '4K',
  pacing: 'suave_moderado',
  narrativeStyle: 'sensorial',
  hasVoiceover: true,
  hasMusic: true,
  hasTextOverlays: true,
  hasSubtitles: false,
  scenesCount: 6
});

// Aplicação de Preset Próprio
StudioState.applyVideoPreset(videoId, 'walkthrough_cinematico');

// Confirmação Formal da Configuração (Transição para G03)
StudioState.confirmVideoConfig(videoId, 'Arquiteto Responsável');
```
