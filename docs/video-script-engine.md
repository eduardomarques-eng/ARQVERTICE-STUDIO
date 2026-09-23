# Script Engine do ArqVertice Studio (Bloco G05)

## 1. Visão Geral e Objetivo

O **Script Engine** é o motor de geração, edição e versionamento de roteiros audiovisuais do **ArqVertice Studio**. Ele converte as informações conceituais, técnicas e espaciais do projeto em roteiros narrativos calibrados para diferentes públicos e objetivos cinematográficos.

### Princípio da Verdade Projetual (Truth-in-Project)
- **O roteiro é rigorosamente fundamentado nos dados reais do projeto.**
- **NÃO inventar características que não estejam no projeto.**
- **NÃO afirmar que existe algo que não esteja documentado.**

---

## 2. As 10 Fontes Canônicas de Contexto

O Script Engine coleta e sintetiza exclusivamente dados documentados no projeto:

1. `briefing`: Perfil do cliente, rotina, composição familiar, necessidades e restrições.
2. `conceito`: Partido arquitetônico, narrativa conceitual, atmosfera e palavras-chave.
3. `ambiente`: Relação de ambientes (áreas em m², funções, setorização e fluxos).
4. `estilo`: Linguagem formal, partido estético e paleta cromática oficial.
5. `materiais`: Especificações reais homologadas (ex.: Travertino Navona, Pedra Hijau, Cumaru, Quartzito Mont Blanc).
6. `mobiliário`: Marcenaria detalhada e peças de design assinado (ex.: Sergio Rodrigues, Poltrona Mole).
7. `decisões`: Racionais de decisão homologados em estudos preliminares e volumétricos.
8. `renders aprovados`: Tomadas e ângulos em alta resolução aprovados pela liderança técnica.
9. `observações do arquiteto`: Pontos de atenção, notas internas e cuidados executivos.
10. `objetivo do vídeo`: Alvo e formato configurados nos Blocos G01 e G02.

---

## 3. Os 8 Formatos de Roteiro

| # | Formato | Tom & Abordagem | Caso de Uso Típico |
|---|---|---|---|
| 1 | `roteiro técnico` | Rigor construtivo, orientação solar, normas, ventilação e métricas de engenharia | Aprovações técnicas, compatibilização e comitês de engenharia |
| 2 | `roteiro narrado` | Tom documental fluido, poético e sensorial em terceira pessoa | Apresentação cinemática principal de projeto |
| 3 | `roteiro institucional` | Autoridade do escritório, solidez da marca, valorização patrimonial e entrega de alto padrão | Captação de novos clientes e posicionamento de marca |
| 4 | `roteiro emocional` | Memórias familiares, acolhimento, descanso, privacidade e conexão com a natureza | Apresentações focadas em residências unifamiliares e famílias |
| 5 | `roteiro curto` | Frases diretas e impactantes sintetizadas em 30 a 45 segundos | Apresentações expressas e pitches de venda |
| 6 | `roteiro para redes sociais` | Hook impactante nos primeiros 3 segundos, dinamismo e Call to Action | Instagram Reels, YouTube Shorts e TikTok |
| 7 | `roteiro para cliente` | Didático, transparente, respondendo diretamente às dores e desejos do briefing | Reuniões de alinhamento com o cliente titular |
| 8 | `roteiro de apresentação profissional` | Corporativo, seguro e executivo, destacando diferenciais competitivos e viabilidade | Incorporadoras, construtoras e investidores imobiliários |

---

## 4. Estrutura Canônica dos 7 Trechos

Cada roteiro gerado é dividido em 7 trechos sequenciais:
1. `HOOK`: Abertura magnética que ancora a atenção nos primeiros segundos.
2. `CONTEXTO`: Localização, inserção no terreno, topografia e diálogo com a paisagem.
3. `DESENVOLVIMENTO`: Setorização funcional, fluidez entre os ambientes e amplitude espacial.
4. `DETALHES`: Marcenaria sob medida, caixilharia oculta e iluminação técnica.
5. `CONCEITO`: Partido arquitetônico, atmosfera sensorial e equilíbrio de texturas.
6. `RESULTADO`: A síntese do projeto pronto, conforto térmico passivo e beleza atemporal.
7. `ENCERRAMENTO`: Assinatura do ArqVertice Studio e chamada para ação (*CTA*).

### Campos de Cada Trecho:
- `id`: Identificador único do trecho.
- `sectionType`: Nome do ato (`HOOK`, `CONTEXTO`, etc.).
- `texto`: Conteúdo roteirizado específico.
- `duração estimada`: Tempo em segundos calculado com base no ritmo e quantidade de palavras.
- `cena`: Identificação da cena correspondente do Narrative Engine (G04).
- `imagem`: URL ou referência do render/ativo vinculado.
- `observação`: Diretriz de direção (enquadramento, movimento de câmera e entonação vocal).

---

## 5. Operações e Governança

### 5.1 Edição e Regeneração Pontual (Granularidade Estrita)
- **Regra Fundamental**: "Não substituir o texto inteiro quando o usuário solicitar alteração de somente um trecho."
- Ao solicitar a regeneração de um trecho (ex.: `DETALHES`), o sistema altera exclusivamente esse trecho, preservando 100% dos outros 6 trechos.

### 5.2 Sistema de Versionamento Histórico
- Toda alteração, edição ou regeneração cria automaticamente uma nova versão (`V01` -> `V02` -> `V03`...).
- Os snapshots anteriores permanecem arquivados e inalterados na tabela `video_script_versions`.

### 5.3 Comparação Lado a Lado (Diff)
- A ferramenta `compareScriptVersions` analisa duas versões e exibe claramente trecho a trecho quais blocos foram modificados, a variação de duração e de texto.

### 5.4 Homologação e Aprovação
- A aprovação congela a versão corrente (`isApproved = true`), assegurando conformidade antes do envio para locução e produção visual.

---

## 6. Banco de Dados

### Tabela `video_scripts`
```sql
CREATE TABLE IF NOT EXISTS video_scripts (
  id VARCHAR(100) PRIMARY KEY,
  video_project_id VARCHAR(100) NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  format VARCHAR(64) NOT NULL DEFAULT 'roteiro narrado',
  title VARCHAR(255) NOT NULL,
  version_label VARCHAR(20) NOT NULL DEFAULT 'V01',
  version_number INTEGER NOT NULL DEFAULT 1,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_duration NUMERIC(6,2) NOT NULL DEFAULT 60.0,
  word_count INTEGER NOT NULL DEFAULT 0,
  context_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
