# MATRIZ DE RISCOS TÉCNICOS E OPERACIONAIS
## ARQVERTICE STUDIO — DIAGNÓSTICO DE VULNERABILIDADES E LIMITAÇÕES
**Data:** 21 de Setembro de 2026  
**Documento:** RISCOS_ATUAIS.md  

---

### 1. VISÃO GERAL DA ANÁLISE DE RISCOS

A presente análise avalia a robustez técnica, segurança da informação, integridade dos dados e sustentabilidade operacional do sistema atual da ArqVértice antes de sua expansão estrutural.

Os riscos foram classificados com base na metodologia padrão de Engenharia de Software:
- **Severidade:** Baixa, Média, Alta, Crítica.
- **Probabilidade:** Rara, Improvável, Moderada, Alta.
- **Impacto:** Restrito, Setorial, Sistêmico, Catastrófico.

---

### 2. DETALHAMENTO DOS RISCOS IDENTIFICADOS

#### 2.1. RISCOS DE SEGURANÇA E AUTENTICAÇÃO

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Chave de Admin Única e Compartilhada em Texto Claro no Navegador** | **Crítica** | **Alta** | **Sistêmico** |
- **Descrição:** Para editar a obra, qualquer membro da equipe digita a `ADMIN_KEY` no prompt do navegador, que é salva diretamente em `localStorage.getItem('cronograma_chave_admin_v1')`.
- **Vulnerabilidade:** Qualquer pessoa que acesse o computador da equipe ou qualquer script malicioso/extensão de navegador com acesso ao `localStorage` pode roubar a chave de administração do escritório e deletar todas as tarefas do banco.
- **Mitigação:** Implementar autenticação baseada em sessão/JWT via NextAuth/Supabase Auth com login individual por usuário (e-mail e senha / OAuth).

---

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-02** | **Leitura de Dados Pública sem Restrição de Acesso** | **Média** | **Alta** | **Setorial** |
- **Descrição:** Os endpoints `GET /api/tarefas` e `GET /api/projeto` são totalmente públicos. Qualquer pessoa que descubra a URL da Vercel tem acesso irrestrito aos nomes dos clientes, localização da obra, prazos e percentuais de avanço físico.
- **Impacto:** Vazamento de dados comerciais e informações de clientes protegidas pela LGPD.
- **Mitigação:** Proteger as rotas de leitura exigindo link com token assinado ou autenticação prévia.

---

#### 2.2. RISCOS DE CONCORRÊNCIA E INTEGRIDADE DE DADOS

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **CONC-01** | **Concorrência Cega de Escrita (Lost Updates / Sobrescrita Involuntária)** | **Alta** | **Moderada** | **Sistêmico** |
- **Descrição:** Se dois engenheiros ou o arquiteto e o engenheiro abrirem o cronograma ao mesmo tempo e alterarem tarefas simultaneamente, a última requisição recebida pelo servidor sobrescreverá a anterior sem aviso prévio.
- **Vulnerabilidade:** Não há controle de concorrência otimista (ex.: campo `versao INTEGER` com `WHERE versao = $old_versao`) nem WebSockets / SSE para atualização em tempo real na tela dos demais colaboradores.
- **Mitigação:** Adicionar versionamento otimista nas tabelas ou mecanismo de revalidação e broadcast em tempo real.

---

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **CONC-02** | **Dessincronização entre LocalStorage e Banco de Dados** | **Média** | **Moderada** | **Restrito** |
- **Descrição:** No modo nuvem, se uma requisição de escrita falhar por instabilidade de rede da operadora, o `api-cliente.js` emite um toast de aviso (`avisarFalha`), mas a alteração continua gravada no `localStorage` daquele computador.
- **Vulnerabilidade:** O profissional acredita que o dado foi salvo, mas para o restante da equipe e para o cliente na nuvem o dado continua com o valor antigo. No próximo carregamento forçado (F5 sem cache), o dado local pode ser sobrescrito pelo banco, causando sensação de perda de trabalho.
- **Mitigação:** Implementar fila de mutações offline persistida com retry automático e alerta claro de conflito.

---

#### 2.3. RISCOS DE ESCALABILIDADE E MODELAGEM

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-01** | **Bloqueio de Banco para Múltiplas Obras (Singleton Lock)** | **Crítica** | **Alta** | **Catastrófico** |
- **Descrição:** A tabela `projeto` possui `CHECK (id = 1)`. O sistema é estruturalmente incapaz de cadastrar uma segunda obra sem intervenção no DDL do banco.
- **Impacto:** O escritório ArqVértice não consegue gerenciar mais de um projeto simultaneamente na mesma instância.
- **Mitigação:** Refatoração relacional conforme planejado no `docs/MAPA_BANCO.md`.

---

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-02** | **Degradação de Desempenho no DOM por Re-renderização Completa** | **Média** | **Alta** | **Restrito** |
- **Descrição:** Toda e qualquer interação na tela chama `renderApp()`, que limpa e reconstrói todo o HTML via strings (`innerHTML = ''`).
- **Impacto:** Conforme o cronograma cresce para 100 ou 200 etapas, a interface apresentará travamentos visíveis e perda de fluidez.
- **Mitigação:** Adoção de Virtual DOM / Reconciliação reativa com React.

---

#### 2.4. RISCOS DE DEPENDÊNCIAS E DISPONIBILIDADE

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **DEP-01** | **Quebra de CDN Flutuante (`unpkg.com/lucide@latest`)** | **Alta** | **Moderada** | **Setorial** |
- **Descrição:** O script de ícones carrega sempre a versão `@latest`. Se a biblioteca lançar uma versão major (v1.0.0 com quebra de API), toda a interface perde seus ícones visuais imediatamente.
- **Mitigação:** Instalar pacotes de ícones localmente via npm (`lucide-react`) em vez de CDN remota.

---

| ID | Risco | Severidade | Probabilidade | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **DEP-02** | **Esgotamento de Conexões de Banco em Serverless (Neon/Supabase)** | **Alta** | **Moderada** | **Sistêmico** |
- **Descrição:** Sem um pooler transacional externo rígido, múltiplos acessos concorrentes podem estourar o limite de conexões simultâneas do plano gratuito do PostgreSQL.
- **Mitigação:** Utilizar porta pooler (porta 6543 no Supabase ou endpoint `-pooler` no Neon) com pool local enxuto (`max: 1` a `2` por função).

---

### 3. MATRIZ CONSOLIDADA DE RISCOS (HEATMAP)

```
        ▲
CRÍTICA │                 [SEC-01]        [ESC-01]
        │
ALTA    │   [CONC-01]     [DEP-01]        [DEP-02]
        │
MÉDIA   │                 [SEC-02]        [CONC-02, ESC-02]
        │
BAIXA   │
        └─────────────────────────────────────────►
             RARA      IMPROVÁVEL     MODERADA      ALTA
                           PROBABILIDADE
```

---

### 4. PLANO DE AÇÃO PREVENTIVA PARA OS PRÓXIMOS BLOCOS

1. **Fase 1 (Banco):** Remover a trava `CHECK (id=1)` e introduzir `projeto_id` como campo opcional em `tarefas`.
2. **Fase 2 (Segurança):** Substituir a guarda estática de `x-chave-admin` por autenticação formal com perfis definidos.
3. **Fase 3 (Frontend):** Eliminar CDNs externas flutuantes, instalando dependências empacotadas via gerenciador de pacotes.
4. **Fase 4 (Concorrência):** Introduzir locking otimista na tabela `tarefas` para prevenir sobrescrita cega.
