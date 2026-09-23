# Governança de Aprovação, Rejeição e Decisões Visuais — ArqVértice Studio (D08)

## 1. Princípios de Aprovação e Rejeição

A plataforma não permite deleção cega ou descarte não registrado de versões de imagem. Toda aprovação e rejeição carrega responsabilidade técnica, autoria e justificativa.

---

## 2. Aprovação (`APPROVED`)

Ao aprovar uma versão:
1. O status é atualizado para `APPROVED`;
2. São registrados: `approvedBy`, `approvedAt` e `approvalNotes`;
3. A imagem torna-se a referência ativa do ambiente (`environments.approvedRenderUrl` e `environmentVisualizations.activeVersion`);
4. Versões anteriormente aprovadas para a mesma câmera passam automaticamente para `SUPERSEDED`, preservando toda a linhagem.

### 2.1. Marcação como Referência Visual (`APPROVED_VISUAL_REFERENCE`)
Quando o arquiteto opta por marcar como referência:
- O atributo `is_approved_reference` é ativado;
- É criada uma memória estruturada na categoria `APPROVED_OUTPUT` com o statement `APPROVED_VISUAL_REFERENCE`;
- Essa referência orienta automaticamente todas as futuras renderizações e enquadramentos do ambiente.

---

## 3. Rejeição Estruturada (`REJECTED`)

Ao rejeitar uma versão, o usuário deve selecionar obrigatoriamente um dos 7 motivos canônicos:

| Motivo Canônico | Descrição |
|---|---|
| `MATERIAL` | Inconformidade com especificação de acabamentos (pedra, madeira, tecidos) |
| `ILUMINACAO` | Intensidade, temperatura de cor ou sombras inadequadas |
| `COMPOSICAO` | Equilíbrio visual, pesos e profundidade insatisfatórios |
| `MOBILIARIO` | Móveis fora de escala, formato divergente do layout ou modelo inadequado |
| `GEOMETRIA` | Erros em proporções arquitetônicas, paredes, forro ou vãos |
| `CAMERA` | Ângulo, altura ou distância focal incorretos |
| `OUTRO` | Motivo específico detalhado no campo de observações |

**Regra Crítica:** A imagem **NÃO é deletada**. Ela permanece registrada no histórico como `REJECTED`, permitindo que o motor IA compreenda o que não deve ser repetido (Negative Prompt e Restrições de Memória).

---

## 4. Comentários de Revisão e Conversão em Decisão (`DESIGN_DECISION`)

1. Durante a revisão, qualquer membro da equipe ou cliente pode adicionar comentários pontuais (ex: *"Manter essa iluminação suave refletida na piscina.*");
2. Um comentário **não** vira decisão automaticamente;
3. O arquiteto pode selecionar o comentário e acionar **"Transformar em Decisão"**:
   - Cria uma entrada formal na memória do projeto (`projectMemories`);
   - Categoria: `DECISION`;
   - Confiança: `CONFIRMED`;
   - Flag `isLock: true`;
   - Vinculada ao ID e versão da imagem correspondente.
