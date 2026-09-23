# Confirmação do Briefing (H06)

## 1. Visão Geral e Objetivo
O módulo **H06 — Confirmação do Briefing** estabelece o mecanismo formal de consolidação e alinhamento do programa de necessidades entre o arquiteto e o cliente titular antes do início dos estudos preliminares e modelagem 3D.

Após a análise das respostas fornecidas pelo cliente no questionário (BLOCO H05), o arquiteto gera uma versão consolidada e estruturada. O cliente recebe esta síntese diretamente no Portal do Cliente para validação e manifestação formal.

---

## 2. Conteúdo da Síntese do Briefing
O cliente visualiza os 7 eixos estruturais do programa de necessidades:

1. **Necessidades**: Composição familiar, rotina, home office, pets, acessibilidade e recepção de convidados.
2. **Ambientes**: Setorização, relações espaciais e integração entre áreas sociais, íntimas e de serviço.
3. **Preferências**: Iluminação (quente, indireta), ventilação cruzada, automação e conforto térmico.
4. **Referências**: Inspirações visuais, materiais preferidos e diretrizes arquitetônicas.
5. **Estilo**: Linguagem projetual (ex.: Contemporâneo Praiano, Minimalista, Rústico Nobre).
6. **Prioridades**: Fatores críticos como prazo, sustentabilidade, custo ou durabilidade.
7. **Observações**: Restrições do lote, regras condominiais e especificidades operacionais.

---

## 3. Modelo de Dados (`BriefingConfirmation`)

```typescript
interface BriefingConfirmation {
  id: string; // Ex: 'bconf-prj-praia-01-v1'
  projectId: string; // Vinculação ao projeto
  briefingId: string; // Vinculação ao briefing base
  version: number; // Versão consolidada (ex: 1, 2)
  status: 'pending' | 'confirmed' | 'correction_requested' | 'superseded';
  confirmedBy: string | null; // Nome do cliente confirmante
  confirmedAt: string | null; // Timestamp ISO da confirmação
  comments: string | null; // Observações ou motivo da correção
  legalDisclaimer: string; // Declaração jurídica e técnica
  summary: {
    necessidades: string;
    ambientes: string;
    preferencias: string;
    referencias: string;
    estilo: string;
    prioridades: string;
    observacoes: string;
  };
  createdAt: string;
}
```

### Ciclo de Estados (`status`):
- `pending`: Síntese aguardando validação do cliente titular.
- `confirmed`: O cliente atestou que as informações representam fidedignamente o programa solicitado.
- `correction_requested`: O cliente solicitou correções ou complementos pontuais.
- `superseded`: Substituída por uma nova versão consolidada.

---

## 4. Salvaguarda Jurídica e Distinção Técnica Fundamental

> [!IMPORTANT]
> **A confirmação das informações do briefing NÃO significa aprovação do projeto arquitetônico.**
> Ela atesta exclusivamente:
> *"Estas informações representam corretamente o briefing fornecido."*

Esta distinção impede que o cliente confunda o alinhamento de intenções e premissas com a aprovação antecipada de plantas, cortes, volumetrias ou renders, garantindo segurança jurídica ao escritório e transparência na relação contratual.

---

## 5. Regras de Interface e Validação

1. **Botões de Ação**:
   - `Confirmar informações`: Registra o aceite com timestamp, nome do cliente e gera evento no log de auditoria.
   - `Solicitar correção`: Abre caixa de comentário obrigatória.
2. **Exigência de Comentário**:
   - A solicitação de correção só pode ser submetida com texto explicativo (`comments.trim().length > 0`). Tentativas vazias são rejeitadas pelo sistema.
3. **Imutabilidade e Auditoria**:
   - A confirmação é vinculada à versão (`version`) correspondente. Qualquer alteração subsequente gera uma nova versão para manter o rastreamento histórico.
