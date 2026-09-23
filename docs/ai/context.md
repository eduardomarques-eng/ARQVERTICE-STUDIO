# ARQVERTICE STUDIO — CONTEXTO COGNITIVO & CONTEXT BUILDER (I19)
## Empacotamento de Contexto Mínimo Essencial para Agentes e IA

---

## 1. Princípio de Minimização de Contexto

> **"Não sobrecarregue o modelo com o repositório inteiro; forneça apenas o contexto essencial para a tarefa delimitada."**

O `ContextBuilder` (`js/contextual-ai-module.js`) é o componente responsável por compilar dinamicamente o pacote cognitivo necessário para cada requisição, respeitando orçamentos estritos de tokens e evitando custos e latências excessivas.

---

## 2. Camadas do Pacote de Contexto

Um contexto estruturado no ArqVértice é composto por 4 blocos ordenados:

1. **Diretiva de Sistema Confiável (`TrustedInstructions`):**
   - Papel do agente (`planner`, `decision`, `specialist`, `executor`, `validator`).
   - Contrato de saída esperado (JSON Schema estrito).
   - Diretivas NBR aplicáveis (NBR 6492, NBR 15575).

2. **Estado Atual do Projeto Ativo (`ProjectSnapshot`):**
   - Nome, tipologia, área construída e fase atual.
   - Ambientes cadastrados e quantitativos gerais.
   - Travas visuais ativas (`VisualLocks`).

3. **Memória Operacional Relevante (`MemorySlice`):**
   - Preferências confirmadas do cliente extraídas do Briefing.
   - Histórico das últimas 3 decisões do Jev para evitar oscilações.

4. **Entrada do Usuário Sanitizada (`UntrustedExternalData`):**
   - Mensagem de comando ou anexo sanitizado pelo `SecurityGovernance`.

---

## 3. Gestão Dinâmica de Janela e Trimming

Quando o payload de contexto ultrapassa 4.000 tokens em tarefas interativas, o `ContextBuilder` aplica descarte hierárquico:
- **Nível 1 (Descarte seguro):** Remove descrições prolixas de materiais e mantém apenas IDs e categorias.
- **Nível 2 (Sumarização):** Compacta a lista de ambientes em um resumo de áreas totais por pavimento.
- **Nível 3 (Imutabilidade):** As diretivas do sistema e as travas visuais jamais são descartadas.
