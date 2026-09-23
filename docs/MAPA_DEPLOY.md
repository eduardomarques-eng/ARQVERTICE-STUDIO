# MAPA DE DEPLOY E INFRAESTRUTURA
## ARQVERTICE STUDIO — ANÁLISE DA VERCEL E AMBIENTE DE PRODUÇÃO
**Data:** 21 de Setembro de 2026  
**Documento:** MAPA_DEPLOY.md  

---

### 1. CONFIGURAÇÃO ATUAL DE DEPLOY (`vercel.json`)

O arquivo de configuração da Vercel no projeto `cronograma-residencia-praia` apresenta a seguinte estrutura:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": null,
  "outputDirectory": ".",
  "functions": {
    "api/*.js": {
      "maxDuration": 15
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, max-age=0" }]
    },
    {
      "source": "/(app|painel-cliente|api-cliente).js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/styles.css",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

---

### 2. ANÁLISE DAS CONFIGURAÇÕES E DIRETIVAS

| Diretiva | Valor Configurado | Análise Técnica |
| :--- | :--- | :--- |
| `framework` | `null` | Indica à Vercel que o projeto não utiliza um meta-framework automático (Next.js, Nuxt, SvelteKit). Trata-se de uma aplicação puramente estática com funções serverless manuais. |
| `buildCommand` | `null` | Nenhum processo de compilação ou transpilação (Babel, Vite, TypeScript) é executado durante o deploy. O código é servido exatamente como escrito no repositório. |
| `outputDirectory` | `"."` | A raiz do repositório é o diretório público servido via CDN. |
| `functions.maxDuration` | `15` segundos | Tempo máximo de execução permitido para qualquer função serverless em `api/*.js`. Compatível com o plano Hobby da Vercel (limite padrão de 10s-15s). |
| `headers` (Segurança) | `nosniff`, `strict-origin-when-cross-origin` | Boas práticas de segurança HTTP para mitigar ataques de MIME-confusion e vazamento de URL de referência. |
| `headers` (Cache de API) | `no-store, max-age=0` | Garante que nenhuma resposta de `/api/` seja guardada na CDN intermediária da Vercel ou no cache do navegador. Toda requisição atinge o código da função. |
| `headers` (Cache de JS/CSS) | `public, max-age=0, must-revalidate` | Força o navegador a sempre revalidar (`304 Not Modified`) os scripts com a Vercel, impedindo que o cliente execute versões obsoletas do código após novos deploys. |

---

### 3. VARIÁVEIS DE AMBIENTE ESPERADAS (SEM EXPOSIÇÃO DE VALORES)

O backend depende estritamente de **duas variáveis de ambiente** configuradas no painel da Vercel:

1. `DATABASE_URL`:
   - **Formato esperado:** `postgresql://usuario:senha@host:porta/banco?sslmode=require`
   - **Finalidade:** String de conexão com o PostgreSQL gerenciado (Neon, Supabase ou RDS).
   - **Comportamento quando ausente:** O endpoint `/api/status` reporta `databaseUrlConfigurada: false` e a aplicação inteira inicializa automaticamente em modo `local` (`localStorage`), sem quebrar a tela do usuário.
2. `ADMIN_KEY`:
   - **Formato esperado:** String secreta com alta entropia (gerada via hash/UUID).
   - **Finalidade:** Comparada em tempo constante contra o cabeçalho `x-chave-admin` para autorizar operações de escrita (`POST`, `PUT`, `DELETE`).
   - **Comportamento quando ausente:** As funções recusam silenciosamente qualquer operação de escrita (retornam HTTP 401).

---

### 4. COMPORTAMENTO EM PRODUÇÃO E PONTOS DE RISCO

#### 4.1. Conexões de Banco e Cold Starts em Ambiente Serverless
- **Diagnóstico:** Cada instância de função serverless é provisionada sob demanda e pode ser destruída após alguns minutos de inatividade.
- **Risco Identificado:** Embora o arquivo `api/_db.js` mantenha um pool global (`max: 3`), em momentos de picos de acesso simultâneo (ex.: envio de relatório para múltiplos clientes ao mesmo tempo), a Vercel pode subir 10 a 20 instâncias paralelas da função, totalizando de 30 a 60 conexões ao banco. Em planos gratuitos do Supabase ou Neon, isso causará o erro `sorry, too many clients already`.
- **Mitigação Recomendada:** Configurar o `DATABASE_URL` para apontar obrigatoriamente para a porta de pooling transacional (ex.: porta `6543` no Supabase com PgBouncer ou endpoint `-pooler` no Neon).

#### 4.2. Inexistência de Pipeline de Build e Verificação de Tipos
- **Diagnóstico:** A ausência de um `buildCommand` significa que não há validação de sintaxe, checagem de tipos TypeScript ou linter durante o deploy.
- **Risco:** Um erro de digitação simples em `app.js` pode ir direto para a branch `main` e quebrar a aplicação em produção sem que a Vercel impeça a publicação.

#### 4.3. Ausência de Armazenamento de Objetos (Storage / Blobs)
- **Diagnóstico:** A infraestrutura atual não conta com Vercel Blob, Cloudflare R2 ou AWS S3 configurado.
- **Impacto no ARQVERTICE STUDIO:** É impossível armazenar pranchas de projeto, arquivos IFC/Revit, imagens de render em alta resolução ou uploads de briefings sem antes provisionar um bucket S3-compatível com URLs assinadas.
