# ARQVERTICE STUDIO — SISTEMA DE BRIEFING DO CLIENTE (BLOCO B)
## VISÃO GERAL, PRINCÍPIOS E EXPERIÊNCIA DO CLIENTE

**Documento:** docs/BRIEFING_CLIENTE.md  
**Status:** Implementado e Operacional  
**Versão:** B.1  

---

### 1. OBJETIVO DO MÓDULO

O sistema de briefing externo do **ArqVértice Studio** foi concebido para coletar, estruturar e consolidar com alto rigor técnico os desejos, a rotina, o programa de necessidades, o direcionamento estético e os limites orçamentários do cliente, sem expô-lo a termos excessivamente técnicos ou telas administrativas internas.

O fluxo completo opera em ciclo fechado:
$$\text{ArqVértice Cria Briefing} \longrightarrow \text{Gera Link Criptográfico} \longrightarrow \text{Cliente Responde (10 Etapas)} \longrightarrow \text{Autosave \& Uploads} \longrightarrow \text{Revisão \& Submissão} \longrightarrow \text{ArqVértice Analisa} \longrightarrow \text{Gera Relatório Executivo} \longrightarrow \text{Cliente Aprova / Solicita Ajuste}$$

---

### 2. PRINCÍPIOS FUNDAMENTAIS DE DESIGN E USABILIDADE

1. **Isolamento Público Estrito**:
   - O portal do cliente (`briefing.html?token=[token]`) opera de forma 100% autônoma e desacoplada do painel administrativo.
   - O cliente nunca tem acesso ao dashboard da ArqVértice, cronograma de outras obras, orçamentos confidenciais ou dados de outros clientes.
2. **Jornada em Etapas Curtas (Stepper)**:
   - Em vez de um formulário monolítico com dezenas de perguntas na mesma página, o questionário é distribuído em 10 blocos lógicos curtos com indicador visual de progresso.
3. **Seleção Visual com Cartões Ilustrados**:
   - Questões de estilo e ambientes utilizam cartões ricos com imagens foto-realistas e ícones para apoiar o cliente visualmente.
4. **Inviolabilidade das Respostas Originais**:
   - As respostas fornecidas pelo cliente são gravadas de forma imutável no momento da submissão (*snapshot*).
   - A interpretação técnica da equipe da ArqVértice é armazenada em campo separado (`technical_interpretation`), garantindo rastreabilidade e integridade.
5. **Autosave Contínuo e Resiliência**:
   - Toda alteração nos campos salva automaticamente no armazenamento local com atraso de debounce (600ms) e indicador luminoso *"Salvo"*. O cliente pode fechar o navegador e retomar o preenchimento sem perda de dados.
