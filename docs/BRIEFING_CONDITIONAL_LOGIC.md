# ARQVERTICE STUDIO — MOTOR DE REGRAS E LÓGICA CONDICIONAL DO BRIEFING
## ADAPTABILIDADE E PRESERVAÇÃO DE DADOS

**Documento:** docs/BRIEFING_CONDITIONAL_LOGIC.md  
**Status:** Implementado em `js/briefing-engine.js`  

---

### 1. REGRAS CONDICIONAIS IMPLEMENTADAS

O motor de briefing avalia reativamente as respostas anteriores antes de exibir perguntas secundárias:

```
REGRA 1: DETALHAMENTO DE PETS
EXIBIR 'p1_animais_detalhes' QUANDO 'p1_animais' != 'Não'

REGRA 2: INTEGRAÇÃO SOCIAL POR AMBIENTES
QUANDO 'p8_ambientes' CONTÉM 'Cozinha Gourmet & Ilha' OU 'Espaço Gourmet'
  -> Habilitar opções específicas de exaustão, ilha de cocção e bancada de apoio.

REGRA 3: PROGRAMA DE NECESSIDADES ESPECIAIS
QUANDO 'p8_ambientes' CONTÉM 'Home Office / Estúdio'
  -> Exibir perguntas de cabeamento de rede, isolamento acústico e ergonomia.
```

---

### 2. PRINCÍPIO DE NÃO-DESTRUIÇÃO DE DADOS (DATA INTEGRITY)

Se o cliente seleciona uma alternativa que ativa uma pergunta condicional, preenche a resposta e posteriormente desmarca a opção original:
- O motor **não apaga silenciosamente** o texto já digitado.
- A resposta é preservada no histórico de sessão (`answers`), mas marcada como inativa durante o cálculo do progresso e da revisão.
- Se o cliente voltar a marcar a opção, os dados retornam intactos sem retrabalho.
