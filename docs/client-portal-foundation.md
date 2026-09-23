# ARQVERTICE STUDIO — FUNDAÇÃO DO PORTAL DO CLIENTE (H01)
## BLOCO H: INTERFACE EXTERNA, SIMPLIFICADA E CONTROLADA

Data: 2026-09-22  
Módulo: Client Portal Foundation  
Status: Produção / Integrado  

---

### 1. Visão Geral e Propósito
O **Portal do Cliente** é uma camada de interface externa, simplificada e rigidamente controlada do ArqVértice Studio.  
Ele permite que clientes acompanhem o desenvolvimento do seu projeto arquitetônico, respondam briefings, visualizem apresentações e aprovem etapas, sem qualquer acesso aos sistemas internos do escritório.

$$\text{Cliente} \xrightarrow{\text{Acesso Autorizado}} \text{ClientPortal} \longrightarrow \text{Dados Públicos do Projeto}$$

---

### 2. Princípio da Separação e Salvaguardas Críticas
O cliente **NUNCA** visualiza ou acessa automaticamente:
- Banco de dados e esquemas relacionais;
- Logs internos de execução ou auditorias administrativas;
- Prompts de inteligência artificial;
- Configurações de agentes ou providers;
- Chaves de API e tokens de infraestrutura;
- Informações técnicas e notas internas do arquiteto (`internalNotes`);
- Arquivos privados ou versões descartadas de renders e plantas;
- Decisões internas e cronogramas detalhados de desenvolvimento.

---

### 3. Modelo de Dados da Entidade `ClientPortal`

```typescript
interface ClientPortal {
  id: string; // Ex: "cport-praia-01"
  projectId: string; // Vínculo estrito com o Projeto (ex: "prj-praia-01")
  clientId: string; // Vínculo estrito com o Cliente (ex: "cli-pedro-01")
  token: string; // Token seguro aleatório CSPRNG
  status: ClientPortalStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  expiresAt: string | null; // Data limite de acesso
  lastAccessAt: string | null; // Timestamp do último acesso bem-sucedido
  publishedSections: string[]; // Seções liberadas pelo arquiteto
  settings: {
    allowComments: boolean;
    allowRevisionRequests: boolean;
    allowApprovals: boolean;
    allowDownloads: boolean;
    showAddress: boolean;
    welcomeMessage: string;
  };
  passwordHash: string | null;
  passwordSalt: string | null;
}
```

#### Ciclo de Vida do Status (`ClientPortalStatus`):
- `draft`: Portal em preparação interna pelo arquiteto (acesso externo bloqueado).
- `active`: Portal liberado para acesso do cliente titular.
- `suspended`: Acesso suspenso temporariamente (ex: revisão contratual ou aguardo de medição).
- `expired`: Período de vigência do portal esgotado.
- `revoked`: Acesso cancelado em definitivo com invalidação imediata de todas as sessões.
- `archived`: Projeto concluído e portal arquivado para consulta histórica.

---

### 4. Relação Canônica
$$\text{Client} \longrightarrow \text{ClientPortal} \longrightarrow \text{Project}$$

O acesso é **explicitamente concedido** e individualizado. Não é permitido acesso irrestrito no formato "qualquer um com o link".

---

### 5. Estrutura de Navegação Canônica
O Portal do Cliente dispõe de 7 rotas dedicadas e responsivas:

1. `/portal`: Dashboard inicial do cliente (progresso, próxima ação, novidades).
2. `/portal/projeto`: Ficha técnica autorizada, área construída, tipologia e localização.
3. `/portal/briefing`: Consulta e preenchimento de desejos, estilo de vida e necessidades.
4. `/portal/apresentacao`: Galeria de pranchas e renders fotorrealistas oficiais liberados.
5. `/portal/revisoes`: Histórico de solicitações de ajuste e evolução do projeto.
6. `/portal/aprovacoes`: Painel formal de aceite de etapas e marcos.
7. `/portal/entrega`: Download de cadernos executivos homologados para obra.

---

### 6. Métodos de Acesso Preparados
A arquitetura está preparada para múltiplos métodos de autenticação controlados:
- **Magic Link**: Link temporário seguro enviado por e-mail ou WhatsApp;
- **Senha**: Senha individual criptografada com salt (SHA-256 / PBKDF2);
- **Convite com Código**: Código alfanumérico descartável de uso único;
- **Sessão Autenticada**: Cookie/Token de sessão com expiração e verificação contínua;
- **Provedor Externo (Futuro)**: Suporte plugável para autenticação via OAuth/SSO.
