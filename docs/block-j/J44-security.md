# J44 — 3D Security, RBAC & AI Privacy Architecture

## 1. Visão Geral
O subsistema **J44** implementa políticas de segurança de nível bancário e isolamento para visualização e edição 3D no ArqVértice Studio.

---

## 2. Pilares de Segurança

### 1. Isolamento do Client Viewer
- O payload de cena enviado ao cliente passa pelo `SecurityGovernor.sanitizeViewerPayload()`.
- Campos confidenciais como `budget`, `cost`, `supplierMarkup`, `internalNotes`, `revitServerPath` e `financials` são compulsoriamente expurgados antes da serialização.
- O cliente possui permissão estritamente **read-only**.

### 2. Controle de Acesso do Editor (RBAC)
- Ações de alteração de materiais, transformações espaciais e sincronização BIM são restritas aos papéis `architect`, `lead_designer`, `bim_manager` e `admin`.

### 3. URLs Assinadas e Efêmeras (`SignedURLs`)
- Assets confidenciais de clientes (plantas, fotos do local e nuvens de pontos brutas) utilizam tokens com tempo de expiração curto (TTL padrão de 1 hora).

### 4. Proteção de Privacidade de IA (`AIPrivacyGate`)
- Geometrias proprietárias, coordenadas de fabricação e metadados confidenciais **não são transmitidos a LLMs externas de terceiros** sem autorização explícita do administrador do projeto.
- Consultas com restrição de privacidade são automaticamente redirecionadas para o modelo local `Ollama` (`LOCAL_OLLAMA_FALLBACK`).

### 5. Política de Zero Vazamento de Tokens
- Logs de telemetria e respostas de API nunca expõem chaves de API, senhas ou tokens Bearer.
