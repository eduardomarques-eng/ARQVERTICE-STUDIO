# ARQVERTICE STUDIO — SUBMISSÃO, SNAPSHOT E NOTIFICAÇÃO (B04)
## PROTOCOLO DE ENVIO FORMAL DO BRIEFING

**Documento:** docs/BRIEFING_SUBMISSION_FLOW.md  
**Status:** Implementado em `js/briefing-engine.js`  

---

### 1. PROTOCOLO DE ENVIO (ETAPA 10)

1. **Revisão Integral**:
   - Na Etapa 10, o cliente visualiza o resumo completo de todas as respostas preenchidas agrupadas por seção temática.
   - Cada seção dispõe de um botão *"Editar"*, que conduz o cliente diretamente à etapa correspondente sem necessidade de retroceder tela a tela.
2. **Confirmação e Criação do Snapshot Imutável**:
   - Ao confirmar o envio, o sistema grava um objeto congelado `submissionSnapshot` contendo:
     - Timestamp UTC exato do envio.
     - Nome e e-mail informados pelo cliente.
     - Cópia inviolável de todas as respostas originais.
     - Quantitativo de arquivos de referência anexados.
3. **Transição de Status**:
   - O status do briefing transita de `IN_PROGRESS` para `SUBMITTED`.
4. **Notificação da Equipe Técnica**:
   - O dashboard do ArqVértice Studio recebe instantaneamente a notificação de sistema: *"Novo Briefing Recebido — [Cliente] submeteu o briefing do projeto [Projeto]"*.
