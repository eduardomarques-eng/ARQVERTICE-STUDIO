# Storyboard Visual do ArqVertice Studio (Bloco G06)

## 1. Visão Geral e Objetivo

O **Storyboard Visual** é o motor de pré-visualização e validação narrativa do **ArqVertice Studio**. Ele permite que a liderança de projeto, os arquitetos e os clientes visualizem a dinâmica do vídeo, a composição espacial e o ritmo da narrativa **antes da produção e renderização final**.

> [!IMPORTANT]
> **Princípios do Bloco G06:**
> - **Não gerar vídeo final neste momento**: O foco estrito é validar a narrativa, a coerência visual e o tempo de tela.
> - **Não apagar automaticamente conteúdo**: Nenhuma ação automática pode remover quadros do projeto sem ação deliberada.
> - **Ajuste Automático mediante confirmação**: A otimização de duração requer confirmação explícita do usuário.

---

## 2. Atributos Canônicos de Cada Quadro (11 Campos)

Cada quadro (frame) do Storyboard possui 11 campos estruturados:

| # | Campo | Tipo | Descrição |
|---|---|---|---|
| 1 | `número` | `Integer` | Posição sequencial no storyboard (`1, 2, 3...`), formatado como `[01], [02]...` |
| 2 | `cena` | `String` | Identificação ou título da cena do Narrative Engine (G04) associada |
| 3 | `duração` | `Number (segundos)` | Tempo de tela do quadro individual (ex.: `4.5`s) |
| 4 | `imagem` | `String (URL/path)` | Imagem/render estático do ativo homologado |
| 5 | `vídeo` | `String (URL/path)` | Clipe ou render em vídeo preliminar associado (quando existente) |
| 6 | `movimento` | `Enum / String` | Movimento de câmera cinematográfica calibrado |
| 7 | `texto` | `String` | Lettering, titulação em tela ou legenda visual |
| 8 | `narração` | `String` | Trecho de locução oral correspondente do Script Engine (G05) |
| 9 | `áudio` | `String` | Faixa de áudio/trilha sonora ou efeito foley pontual (ex.: `Brisa suave + Piano minimalista`) |
| 10 | `transição` | `Enum / String` | Efeito de corte/transição para o próximo quadro (ex.: `crossfade`, `cut`, `dip_to_black`) |
| 11 | `observações` | `String` | Diretivas específicas de direção de arte, enquadramento e iluminação |

### Catálogo de Movimentos de Câmera (`STORYBOARD_MOVEMENTS`)
- `static`: Câmera fixa estática (foco na contemplação e proporções)
- `pan_left`: Panorâmica horizontal para a esquerda
- `pan_right`: Panorâmica horizontal para a direita
- `tilt_up`: Inclinação vertical ascendente (revelação de pé-direito duplo/fachada)
- `tilt_down`: Inclinação vertical descendente (foco em piso e materiais)
- `zoom_in`: Aproximação gradual de lente
- `zoom_out`: Recuo gradual de lente (revelação espacial)
- `dolly_forward`: Deslocamento físico frontal em direção ao ambiente
- `dolly_backward`: Deslocamento físico em recuo contínuo
- `orbit`: Movimento orbital de 360° em torno de um elemento focal ou mobiliário

---

## 3. Visual e Grid `[01] [02] [03] [04]` / `[05] [06] [07] [08]`

A interface apresenta os quadros organizados em uma grade visual com 4 colunas responsivas:

```
+----------------+----------------+----------------+----------------+
|      [01]      |      [02]      |      [03]      |      [04]      |
| Fachada Frontal| Hall de Entrada| Living Integr. | Varanda Gourm. |
+----------------+----------------+----------------+----------------+
|      [05]      |      [06]      |      [07]      |      [08]      |
| Cozinha Design | Suíte Master   | Banho Spa      | Encerramento   |
+----------------+----------------+----------------+----------------+
```

### Comportamento Interativo:
- **Arrastar e Soltar (Drag & Drop)**: Cada quadro possui o atributo `draggable="true"`, permitindo arrastá-lo e soltá-lo sobre outro quadro para reordenação instantânea.
- **Botões de Navegação Rápida**: Botões `⬅️` e `➡️` em cada card permitem mover o quadro sem depender de mouse/touchscreen.
- **Numeração Automática**: A reordenação recalcula automaticamente a numeração de todos os quadros (`[01], [02], [03]...`).

---

## 4. Operações de Quadro

1. **Reorder**:
   - Altera a ordem do quadro de `fromIndex` para `toIndex`.
   - Recalcula a sequência numérica sem perder nenhuma propriedade.
2. **Duplicar**:
   - Cria uma cópia exata do quadro imediatamente posterior ao original com a anotação `(Cópia)`.
   - Preserva imagem, movimento, texto, narração e anotações.
3. **Excluir**:
   - Remove o quadro selecionado mediante confirmação do usuário.
   - Renumera os quadros subsequentes de forma contínua.
4. **Editar**:
   - Modal com campos para editar duração, cena, texto em tela, narração, movimento, áudio, transição e observações.
5. **Substituir Asset**:
   - Permite trocar o ativo visual (`imagem` / `vídeo`) por outro render, foto ou planta do projeto, sem descartar as instruções narrativas e de áudio já registradas.

---

## 5. Preview Sequencial

O **Preview Sequencial** (`openSequentialPreviewModal`) simula a experiência de reprodução do vídeo quadro a quadro:
- **Controle de Pacing**: Reproduz os quadros sequencialmente respeitando o tempo de tela configurado de cada um.
- **Player Interativo**: Botão Reproduzir/Pausar, Anterior, Próximo e Reiniciar.
- **Overlay Dinâmico**:
  - Exibe o número do quadro `[01/08]`, nome da cena e duração.
  - Exibe o Lettering sobreposto na parte inferior da imagem.
  - Exibe o bloco de Narração/Locução e Movimento de câmera em tempo real.
- **Barra de Progresso**: Indica a evolução temporal acumulada do vídeo em relação à duração total.

---

## 6. Indicador de Duração Total e Warning

O sistema calcula dinamicamente:
$$\text{Duração Total} = \sum_{i=1}^{n} \text{duração do quadro}_i$$

- **Duração Configurada (`targetDuration`)**: Definida na configuração do projeto de vídeo (ex.: 30s, 60s, 90s).
- **Indicador Visual**: Mostra `Duração Total: Xs / Meta: Ys`.
- **Status Normal**: Quando `totalDuration <= targetDuration`, indicador verde com badge `DENTRO DA META`.
- **Status Excedido (Warning)**: Quando `totalDuration > targetDuration`, indicador vermelho/alerta com badge `TEMPO EXCEDIDO (+Xs)` e mensagem de advertência explícita.

---

## 7. Ajuste Automático de Duração com Confirmação

Para alinhar o storyboard à duração meta sem intervenção manual quadro a quadro:
- **Regra Rígida**: "Não apagar automaticamente conteúdo."
- **Regra de Segurança**: O método `adjustStoryboardDurationAutomatically(projectId, true)` exige `confirmed === true`.
- **Algoritmo de Escala Proporcional**:
  $$\text{Fator de Escala} = \frac{\text{targetDuration}}{\text{currentTotalDuration}}$$
  $$\text{duração}_i' = \max(1.5, \text{round}(\text{duração}_i \times \text{Fator de Escala}, 1))$$
- Todos os quadros são preservados integralmente; apenas a velocidade/duração de cada cena é ajustada.

---

## 8. Persistência e Banco de Dados

### Tabela `video_storyboards`
```sql
CREATE TABLE IF NOT EXISTS video_storyboards (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  total_duration NUMERIC(6,2) NOT NULL DEFAULT 0,
  target_duration NUMERIC(6,2) NOT NULL DEFAULT 60,
  is_duration_exceeded BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `video_storyboard_frames`
```sql
CREATE TABLE IF NOT EXISTS video_storyboard_frames (
  id VARCHAR(100) PRIMARY KEY,
  storyboard_id VARCHAR(100) NOT NULL REFERENCES video_storyboards(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL,
  scene_name VARCHAR(255) NOT NULL,
  duration NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  image_url TEXT,
  video_url TEXT,
  movement VARCHAR(64) NOT NULL DEFAULT 'static',
  screen_text TEXT,
  voiceover_text TEXT,
  audio_track VARCHAR(255),
  transition VARCHAR(64) NOT NULL DEFAULT 'crossfade',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Próximos Passos (G07)

Com a narrativa validada e o Storyboard aprovado no Bloco G06, o sistema está preparado para o Bloco **G07**, que cuidará das definições de animação, motion design e renderização.
