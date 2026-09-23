# ARQVERTICE STUDIO — FLUXO PÚBLICO E JORNADA DO CLIENTE
## ARQUITETURA DE ACESSO, SEGURANÇA DE LINKS E INTERFACE

**Documento:** docs/BRIEFING_PUBLIC_FLOW.md  
**Status:** Implementado em `briefing.html`  

---

### 1. FLUXO DE ENTRADA DO CLIENTE

1. **Geração do Link Seguro**:
   - A ArqVértice cria o briefing no Workspace do Projeto e o sistema gera automaticamente um token criptográfico unívoco de 64 caracteres hexadecimais (ex: `/briefing.html?token=a7c9e1b...`).
2. **Validação Pré-Voo**:
   - O servidor/motor verifica se o token existe, se está dentro do prazo de validade (`tokenExpiresAt`) e se não foi revogado (`tokenRevoked = false`).
   - Caso o token seja inválido ou expirado, exibe tela de bloqueio com canal de contato da ArqVértice.
3. **Navegação do Questionário**:
   - O cliente é recebido com saudação acolhedora e inicia a jornada pelas 10 etapas lógicas.
   - Toda resposta aciona autosave com indicação visual.
   - O cliente pode alternar entre etapas livremente via stepper superior.
