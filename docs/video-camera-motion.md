# Camada de Definição de Câmera e Movimento — ArqVertice Studio (Bloco G08)

## 1. Visão Geral e Objetivo

A **Camada de Câmera e Movimento (Bloco G08)** é o subsistema do ArqVertice Studio dedicado à parametrização da direção de fotografia e cinética espacial para as tomadas dos vídeos arquitetônicos.

Ela estabelece o controle rigoroso sobre enquadramentos, distâncias focais, velocidades e trajetórias de câmera, garantindo que o movimento valorize o projeto sem causar aberrações ópticas ou distorções no espaço construído.

---

## 2. Os 12 Tipos Canônicos de Movimento

O sistema cataloga 12 padrões cinemáticos fundamentais para a cinematografia arquitetônica:

| Tipo de Movimento | Descrição Técnica | Direção Típica | Nível de Risco de Distorção |
| :--- | :--- | :---: | :---: |
| **push in** | Aproximação progressiva em direção a um ponto focal ou peça de design | Avanço frontal | Baixo |
| **pull out** | Recuo suave revelando a escala e integração espacial do ambiente | Recuo linear | Baixo |
| **pan** | Rotação horizontal sobre eixo estático | Esquerda &rarr; Direita | Médio |
| **tilt** | Inclinação vertical contemplando pés-direitos duplos e forros | Ascendente / Descendente | Médio |
| **orbit** | Rotação orbital circular contínua ao redor de um elemento focal | Horário / Anti-horário | Alto |
| **dolly** | Deslocamento tridimensional da câmera em trilho com perspectiva contínua | Frontal / Oblíquo | Baixo |
| **tracking** | Acompanhamento lateral contínuo seguindo eixos de circulação | Lateral paralelo | Baixo |
| **reveal** | Revelação arquitetônica emergindo de trás de pilar, brise ou divisória | Diagonal | Médio |
| **parallax** | Movimento multicamadas acentuando profundidade entre planos | Lateral | Médio |
| **static** | Câmera imóvel contemplativa de fidelidade geométrica absoluta | Fixo (Zero) | **Nenhum** |
| **handheld controlado** | Câmera orgânica sutil com amortecimento giroscópico estável | Orgânico suave | Baixo |
| **cinematic slow movement** | Movimento hiperlento contínuo de alta fluidez (glidecam de precisão) | Avanço lento | **Nenhum** |

---

## 3. Salvaguarda contra Distorção do Ambiente

> [!IMPORTANT]
> **REGRA CRÍTICA DE PRESERVAÇÃO ESPACIAL**:
> **Não utilizar movimento automaticamente quando ele puder distorcer o ambiente.**
> - Em ambientes compactos (corredores, lavabos ou áreas < 12m²), movimentos circulares como `orbit` ou grandes varreduras de `pan` geram compressão e deformações inaceitáveis de paredes retilíneas.
> - Nessas situações, o motor aplica automaticamente salvaguarda com fallback seguro para **`static`** ou **`cinematic slow movement`**, preservando a ortogonalidade arquitetônica.

---

## 4. Parametrização Cinética (Configurações)

Cada perfil de movimento define os seguintes 6 parâmetros cinéticos:

- **Direção**: Vetor de deslocamento (`forward`, `backward`, `left_to_right`, `right_to_left`, `upward`, `downward`, `clockwise`, `counter_clockwise`, `none`).
- **Velocidade**: Ritmo de deslocamento (`slow`, `medium`, `dynamic`, `zero`).
- **Intensidade**: Escala contínua de 1 a 10 de amortecimento e aceleração.
- **Duração**: Duração nominal do movimento em segundos (ex.: 4.5s, 6.0s).
- **Início**: Ponto temporal ou percentual de partida da interpolação (`0%`).
- **Fim**: Ponto temporal ou percentual de conclusão da tomada (`100%`).

---

## 5. Parametrização Óptica (Câmera)

A câmera é configurada através de 6 dimensões de precisão técnica:

- **Enquadramento**: `Close-up`, `Medium Shot`, `Wide Shot`, `Extreme Wide Shot`, `Architectural Detail`, `Eye-level`, `Low Angle`, `High Angle`.
- **Distância**: Afastamento físico em metros em relação ao ponto focal (ex.: `2.5m`, `4.0m`, `6.0m`, `12.0m`).
- **Altura**: Cota vertical em relação ao piso acabado (`1.50m (olho humano)`, `0.80m (mesa)`, `3.00m (plano alto)`).
- **Lente Conceitual**:
  - `18mm Ultra-Grande Angular` (FOV 100°) — Fachadas amplas (requer atenção a bordas).
  - `24mm Grande Angular Arquitetônica` (FOV 84°) — Interiores integrados.
  - `35mm Visão Natural / Documental` (FOV 63°) — Perspectiva padrão do ArqVertice Studio.
  - `50mm Olho Humano Estrito` (FOV 47°) — Máxima fidelidade 1:1.
  - `85mm Telefoto Curta` (FOV 28°) — Foco em mobiliário solto e marcenaria.
  - `100mm Macro` (FOV 24°) — Texturas nobres, pedras naturais e junções de acabamento.
- **Direção**: Ângulo de visada (`frontal`, `diagonal 30°`, `diagonal 45°`, `zenital`).
- **Ponto de Interesse**: Descrição espacial do elemento de foco (ex.: *"Ilha gourmet em Quartzito com bancada iluminada"*).

---

## 6. Proteção Incondicional de Câmera Bloqueada

> [!CAUTION]
> **REGRA DE OURO BLOCO G08**:
> **Se a câmera original de um render estiver bloqueada:**
> **NÃO ALTERÁ-LA.**
> - Caso a imagem de origem provenha de uma câmera aprovada com `CAMERA_LOCK` ativo (`isLocked === true`), qualquer tentativa de alteração dos parâmetros de enquadramento, lente, altura ou distância é terminantemente bloqueada pelo sistema.
> - O perfil de movimento opera estritamente mantendo o ponto de vista da renderização aprovada.

---

## 7. Entidade `CameraMotionProfile` & Presets

### Campos da Entidade:
- `id`: Identificador unívoco (`cmp-...`).
- `videoProjectId`: Vínculo com o projeto de vídeo.
- `sceneId`: Vínculo com a cena da narrativa (G04).
- `storyboardFrameId`: Vínculo com o quadro do storyboard (G06).
- `name`: Título descritivo do take.
- `motionType`: Um dos 12 tipos canônicos de movimento.
- `settings`: Objeto com direção, velocidade, intensidade, duração, início e fim.
- `cameraConfig`: Objeto com enquadramento, distância, altura, lente, direção e ponto de interesse.
- `isLocked`: Flag de proteção da câmera original.
- `distortionRisk`: Classificação qualitativa (`none`, `low`, `medium`, `high`).
- `isPreset` / `presetCategory`: Identificação de template reutilizável.

### Biblioteca de Presets Nativos:
1. **Imersão Espacial Lenta**: Deslocamento suave contínuo para livings e varandas.
2. **Contemplação Estática Sem Distorção**: Câmera fixa 50mm para máxima precisão geométrica.
3. **Avanço Suave para Detalhe**: Aproximação `push in` para valorizar acabamentos e peças homologadas.
4. **Revelação Arquitetônica por Brise/Pilar**: Transição lateral elegante entre ambientes contíguos.
5. **Parallax de Fachada e Paisagismo**: Deslocamento multicamadas ressaltando volume e jardim.

O sistema permite salvar qualquer configuração customizada como um novo preset através do método `saveCameraMotionPreset`.

---

## 8. Interface do Usuário

O módulo [`js/video-camera-motion-module.js`](file:///c:/Users/erick/ARQVERTICE-STUDIO/js/video-camera-motion-module.js) oferece:
- Seletor interativo dos 12 tipos de movimento com tags coloridas de risco de distorção;
- Controles de velocidade, intensidade (slider 1 a 10), duração e pontos de interpolação;
- Seletores de lente conceitual e enquadramento;
- Banner de proteção de câmera bloqueada;
- Modal de biblioteca e aplicação de presets com 1 clique.

---

*Módulo homologado no Bloco G08. Aguardando Bloco G09.*
