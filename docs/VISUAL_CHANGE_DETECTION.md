# ArqVértice Studio — Camada de QA e Detecção de Mudanças Inesperadas (D07)

## 0. Objetivo

A camada de QA do ArqVértice Studio analisa as saídas geradas confrontando o que foi pedido para alterar (`TARGET`) contra os elementos que deveriam permanecer estritamente intactos (`PRESERVE`).

---

## 1. Princípio de Honestidade Técnica

O ArqVértice Studio **não declara precisão perfeita** em auditorias visuais de modelos generativos de IA.

Quando um potencial desvio é identificado entre o que deveria ser preservado e a imagem produzida, o sistema rotula a auditoria com o status oficial:

```
POTENTIAL_UNEXPECTED_CHANGE
```

Acompanhado do elemento suspeito, nível de severidade e índice de confiança.

---

## 2. Estrutura do Registro de Auditoria (`visual_change_audits`)

```json
{
  "id": "audit-mubr...",
  "projectId": "prj-praia-01",
  "environmentId": "amb-sala-01",
  "renderJobId": "job-rnd-sala-02",
  "status": "POTENTIAL_UNEXPECTED_CHANGE",
  "targetElements": ["PAREDE"],
  "preservedElements": ["GEOMETRY", "OPENINGS", "PISO"],
  "detectedDrifts": [
    {
      "category": "OPENINGS",
      "element": "Esquadrias / Portas",
      "description": "Ajuste de parede adjacente possui risco potencial de alteração no vão homologado da porta de correr.",
      "severity": "WARNING",
      "confidence": 0.84
    }
  ],
  "confidenceScore": 0.86,
  "notes": "Atenção do Arquiteto: Foram identificadas alterações potenciais em elementos protegidos por Lock."
}
```

---

## 3. Ações do Arquiteto Diante de Mudanças Inesperadas

Ao receber um aviso de `POTENTIAL_UNEXPECTED_CHANGE`, o arquiteto pode:
1. **Inspecionar Lado a Lado ($V01 \times V02$)**: Avaliar no visualizador split se a mudança é aceitável ou se corrompe o projeto executivo;
2. **Rejeitar com Motivo (`REJECTED`)**: Registrar a recusa técnica preservando o histórico;
3. **Disparar Retry com Ajuste de Peso (`RETRY`)**: Aumentar o peso da camada afetada (ex: elevar `geometry` para 1.0 ou reforçar lock de abertura) e renderizar novamente.
