# ARQVERTICE STUDIO — MATRIZ DE AMBIENTES & VARIÁVEIS (K05)

> **Documento Oficial de Configuração de Ambientes e Segredos**  
> **Versão:** 1.0.0 | **Ambientes:** Local, Preview, Staging, Produção

---

## 1. Matriz de Variáveis de Ambiente

| Variável | Local / Dev | Preview | Produção | Obrigatória? | Segredo? | Finalidade |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `NODE_ENV` | `development` | `staging` | `production` | Sim | Não | Define o perfil de otimização e logging do Node.js |
| `PORT` | `3000` | `3000` | `3000` | Não | Não | Porta de escuta do processo HTTP interno |
| `HOST` | `0.0.0.0` | `0.0.0.0` | `0.0.0.0` | Não | Não | Interface de rede para bind do servidor |
| `DATABASE_URL` | `sqlite://database/...` | `sqlite://database/...` | `sqlite:///app/database/...` | Não | Não | Caminho para o banco de dados e migrações |
| `STORAGE_ROOT` | `./storage` | `/app/storage` | `/app/storage` | Não | Não | Diretório raiz para persistência de assets 3D e snapshots |
| `JWT_SECRET` | `(gerado aleatório)` | Secret Manager | Secret Manager | Sim | **SIM** | Chave para assinatura de tokens de sessão e autenticação |
| `SESSION_SECRET`| `(gerado aleatório)` | Secret Manager | Secret Manager | Sim | **SIM** | Chave para assinatura de cookies e tokens efêmeros |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `https://*.preview.arqvertice.com` | `https://app.arqvertice.com,https://viewer.arqvertice.com` | Não | Não | Lista de origens autorizadas para requisições cross-origin |
| `OLLAMA_HOST` | `http://localhost:11434` | `http://ollama-service:11434` | `http://ollama-service:11434` | Não | Não | Endpoint do motor local de modelos LLM |
| `AI_GATEWAY_URL`| `https://api.omniroute.ai/v1` | `https://api.omniroute.ai/v1` | `https://api.omniroute.ai/v1` | Não | Não | Gateway de roteamento multimodal com fallback |

> ⚠️ **REGRA DE OURO:** NENHUM valor real de chave ou secret é versionado neste documento ou no repositório. Utilize `.env.example` para templates e o Secret Manager para injeção em runtime.

---

## 2. Separação Build-Time vs. Runtime

- **Variáveis de Build-Time:** Nenhuma credencial ou segredo é embutido nos bundles durante a compilação do Dockerfile.
- **Variáveis de Runtime:** Injetadas exclusivamente via variáveis de ambiente no container ou secret injection do Kubernetes/Docker-Compose.
- **Client-Side:** O cliente nunca recebe acesso direto a chaves de API. Todas as chamadas de IA e renderização são intermediadas pelo backend seguro.
