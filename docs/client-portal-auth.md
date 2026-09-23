# ARQVERTICE STUDIO — AUTENTICAÇÃO E AUTORIZAÇÃO DO PORTAL DO CLIENTE (H02)
## BLOCO H: SEGURANÇA, SESSÕES E MIDDLEWARE DE AUTORIZAÇÃO

Data: 2026-09-22  
Módulo: Client Portal Auth & Security  
Status: Produção / Integrado  

---

### 1. Visão Geral da Arquitetura de Segurança
O Portal do Cliente opera sob o princípio de **mínimo privilégio** e **isolamento estrito de projetos**. O cliente acessa seu projeto exclusivamente sem jamais receber permissões da área administrativa do ArqVértice Studio.

A autorização não depende exclusivamente do frontend: cada requisição é validada por um **Middleware de Autorização** server-side / state-level.

---

### 2. Entidade `ClientPortalSession`

```typescript
interface ClientPortalSession {
  id: string; // Ex: "cpsess-1727025800000-a1b2c3"
  portalId: string; // Vínculo estrito com o Portal
  clientId: string; // Identificador do Cliente Titular
  projectId: string; // Identificador do Projeto Autorizado
  authMethod: 'magic_link' | 'password' | 'invite' | 'authenticated_session';
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601 (padrão: 7 dias)
  lastActivityAt: string; // Timestamp de atividade
  revokedAt: string | null; // Invalidação imediata em logout
  ipHash: string; // Hash seguro e anonimizado de IP
  userAgentMetadata: {
    raw: string;
    device: 'desktop' | 'mobile';
  };
}
```

---

### 3. Matriz de Permissões Rigorosa

| Ação | Perfil CLIENTE | Perfil ADMIN / ARQUITETO |
|---|:---:|:---:|
| Visualizar conteúdo publicado | ✔ Permitido | ✔ Permitido |
| Responder briefing | ✔ Permitido | ✔ Permitido |
| Comentar nas apresentações | ✔ Permitido | ✔ Permitido |
| Solicitar alteração/revisão | ✔ Permitido | ✔ Permitido |
| Aprovar conteúdo autorizado | ✔ Permitido | ✔ Permitido |
| Baixar arquivos liberados | ✔ Permitido | ✔ Permitido |
| Criar ou revogar portal | ✖ **PROIBIDO** | ✔ Permitido |
| Editar projeto interno | ✖ **PROIBIDO** | ✔ Permitido |
| Excluir arquivos de projeto | ✖ **PROIBIDO** | ✔ Permitido |
| Alterar renders ou pranchas | ✖ **PROIBIDO** | ✔ Permitido |
| Acessar briefing técnico interno | ✖ **PROIBIDO** | ✔ Permitido |
| Acessar cronograma interno | ✖ **PROIBIDO** | ✔ Permitido |
| Acessar prompts de IA | ✖ **PROIBIDO** | ✔ Permitido |
| Acessar banco de dados | ✖ **PROIBIDO** | ✔ Permitido |
| Alterar configurações do Studio | ✖ **PROIBIDO** | ✔ Permitido |

---

### 4. Armazenamento Seguro de Senhas
- Senhas **NUNCA são armazenadas em texto puro**.
- Hashing criptográfico HMAC-SHA-256 com geração obrigatória de **Salt criptográfico aleatório único por portal**.
- Método de validação com tempo constante (`verifyPortalPassword`).

---

### 5. Middleware de Autorização (`authorizePortalAccess`)

A função central de guarda avalia obrigatoriamente 5 barreiras em cascata:

1. **Validade da Sessão**: Verifica existência, não-revogação e não-expiração.
2. **Status do Portal**: O portal vinculado deve estar estritamente `active`.
3. **Barreira Anti-Invasão (Cross-Project Guard)**:
   ```javascript
   if (session.projectId !== targetProjectId) {
     return {
       authorized: false,
       code: 'FORBIDDEN_CROSS_PROJECT',
       error: 'ACESSO NEGADO',
       message: 'ACESSO NEGADO: O cliente autenticado não possui permissão para acessar o projeto solicitado.'
     };
   }
   ```
4. **Proibição de Ações Administrativas**: Bloqueio de qualquer solicitação de prompts, banco de dados ou edição interna.
5. **Permissão Explícita**: Validação do escopo da solicitação (`view_published`, `approve_content`, etc.).

---

### 6. Casos de Teste Validados
- **Teste Anti-Invasão**: `Cliente Pedro` (Residência de Praia `prj-praia-01`) tentando acessar `Projeto Alphaville Eusébio` (`prj-eusebio-02`).
  - **Resultado**: `ACESSO NEGADO` com código `FORBIDDEN_CROSS_PROJECT`.
- **Tentativa de Acesso a Prompts/DB**: Bloqueio imediato com `FORBIDDEN_INTERNAL_ACTION`.
- **Logout e Revogação**: Invalidação imediata da sessão, impedindo qualquer consulta subsequente.
