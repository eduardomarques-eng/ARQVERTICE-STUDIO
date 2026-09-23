# Narrative Engine do ArqVertice Studio (Bloco G04)

## 1. Visão Geral e Objetivo

O **Narrative Engine** é o motor de roteirização e sequenciamento audiovisual do **ArqVertice Studio**. Sua função primária é transformar os ativos visuais selecionados e curados no Bloco G03 em uma narrativa arquitetônica fluida, coerente e com ritmo cinematográfico.

O motor organiza o fluxo temporal através de cenas sequenciais (`NarrativeScene`), estruturando atos dramáticos (abertura, contexto, partido, ambientes, materialidade, fechamento) e prevendo durações, letreiros em tela, textos de locução (*voiceover*) e transições.

---

## 2. Estruturas Narrativas

### 2.1 Estrutura Padrão (Standard — 9 Atos)
Adequada para vídeos conceituais e apresentações completas equilibradas:
```
ABERTURA
  ↓
CONTEXTO
  ↓
CONCEITO
  ↓
AMBIENTE
  ↓
DETALHES
  ↓
MATERIAIS
  ↓
COMPOSIÇÃO
  ↓
RESULTADO
  ↓
ENCERRAMENTO
```

### 2.2 Estruturas Flexíveis por Tipo de Vídeo

#### Vídeo de Ambiente (Foco Espacial & Vivência)
Prioriza a experiência imersiva e a escala humana do cômodo:
```
ABERTURA → PLANTA → ENTRADA → VISTA PRINCIPAL → DETALHES → MATERIAIS → MOBILIÁRIO → ENCERRAMENTO
```

#### Vídeo de Projeto (Visão Arquitetônica Completa)
Privilegia a lógica de implantação, distribuição e volumetria:
```
CONTEXTO → CONCEITO → PLANTA → AMBIENTES → PERSPECTIVAS → MATERIAIS → RESULTADO
```

#### Vídeo de Moodboard (Atmosfera, Paleta & Tátil)
Foco nos materiais nobres, iluminação e identidade sensorial:
```
REFERÊNCIA → PALETA → MATERIAL → MOBILIÁRIO → TEXTURA → ATMOSFERA → RESULTADO
```

---

## 3. Modelo de Dados: `NarrativeScene`

Cada cena da narrativa é representada pela entidade `NarrativeScene`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | VARCHAR(100) | Identificador único da cena narrativa (`nscene-...`) |
| `videoProjectId` | VARCHAR(100) | Vínculo com o projeto de vídeo |
| `sequence` | INTEGER | Posição sequencial na timeline (1, 2, 3...) |
| `title` | VARCHAR(255) | Título descritivo do take ou ato |
| `purpose` | VARCHAR(255) | Propósito ou beat narrativo (ex.: `ABERTURA`, `PLANTA`) |
| `duration` | NUMERIC(6,2) | Duração em segundos (ex.: `6.0s`) |
| `assetIds` | JSONB / Array | Lista de IDs de ativos visuais do G03 vinculados |
| `text` | TEXT | Texto em tela / lettering / legenda |
| `voiceover` | TEXT | Roteiro de locução falada |
| `transition` | VARCHAR(50) | Tipo de transição (`crossfade`, `fade_black`, `cut`, etc.) |
| `notes` | TEXT | Observações técnicas e diretrizes de montagem |
| `isApproved` | BOOLEAN | Flag de homologação da cena |

---

## 4. Governança e Regras Críticas de Negócio

1. **Proteção de Narrativas Homologadas**:
   - **"Nunca substituir automaticamente narrativa aprovada."**
   - Caso um vídeo ou suas cenas já possuam aprovação formal (`isApproved = true`), qualquer tentativa de regeneração ou substituição autônoma por IA é estritamente bloqueada no nível de domínio.
2. **Decisão e Controle do Usuário**:
   - A IA propõe títulos, textos de locução e tempos baseando-se nos metadados arquitetônicos do projeto.
   - O arquiteto tem liberdade irrestrita para editar qualquer atributo da cena.
3. **Integridade de Sequenciamento**:
   - Inserções, duplicações ou remoções de cenas recalculam automaticamente os números de sequência (`sequence`), impedindo lacunas na linha de tempo.

---

## 5. Operações Permitidas

- **Rearranjo**: Mover cenas para cima (`⬆️`) ou para baixo (`⬇️`), recalculando a ordem da timeline.
- **Duplicação**: Clonar uma cena existente, mantendo parâmetros e gerando uma cópia contígua.
- **Exclusão**: Remover cena com reordenação imediata das subsequentes (exige confirmação se aprovada).
- **Inserir Nova Cena**: Adicionar nova cena narrativa em qualquer posição (início, meio ou fim).
- **Sugestão de Narrativa por IA**: Mapeamento inteligente de ativos visuais curados para os atos correspondentes.
- **Homologação**: Aprovar a narrativa completa, bloqueando mutações involuntárias.

---

## 6. Visualização em Timeline Audiovisual

O módulo disponibiliza uma visualização cinemática horizontal contendo:
- Régua de tempo acumulado (em segundos).
- Blocos dimensionados proporcionalmente à duração de cada cena.
- Indicadores visuais de transição entre blocos (ex.: `⤹ crossfade`, `⤹ fade_black`).
- Identificação dos ativos visuais vinculados a cada tomada.

---

## 7. Banco de Dados e Esquema

### Tabela `video_narrative_scenes`
```sql
CREATE TABLE IF NOT EXISTS video_narrative_scenes (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  duration NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  text TEXT,
  voiceover TEXT,
  transition VARCHAR(50) NOT NULL DEFAULT 'crossfade',
  notes TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
