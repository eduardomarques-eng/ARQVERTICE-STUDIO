# ==============================================================================
# ARQVERTICE STUDIO — DOCKERFILE MULTI-STAGE OTIMIZADO (PRODUÇÃO)
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Base (Ambiente de Sistema Mínimo e Seguro)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk update && apk add --no-cache \
    tini \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# ------------------------------------------------------------------------------
# STAGE 2: Dependencies (Instalação e Cache de Dependências)
# ------------------------------------------------------------------------------
FROM base AS dependencies
COPY package.json ./
# Em imagens com npm/yarn/pnpm, instala dependências limpas
RUN npm install --omit=dev --ignore-scripts --prefer-offline || true

# ------------------------------------------------------------------------------
# STAGE 3: Builder (Verificação, Sintaxe e Preparação dos Artefatos)
# ------------------------------------------------------------------------------
FROM base AS builder
COPY package.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Execução da verificação sintática e validação de rotas em build time
RUN node scripts/typecheck-dryrun.js
RUN node scripts/audit-and-build.js

# ------------------------------------------------------------------------------
# STAGE 4: Runner (Imagem Final Enxuta, Segura e com Usuário Não-Root)
# ------------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

WORKDIR /app

# Criar estrutura de diretórios para volumes persistentes com permissão do usuário 'node'
RUN mkdir -p /app/storage /app/database /app/logs \
    && chown -R node:node /app

# Copiar apenas os arquivos necessários da aplicação
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node index.html portal.html viewer.html logo.png DESIGN.md ./
COPY --chown=node:node styles.css ./
COPY --chown=node:node css ./css
COPY --chown=node:node js ./js
COPY --chown=node:node src ./src
COPY --chown=node:node video ./video
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node database ./database

# Usuário Não-Root para Execução Segura
USER node

# Porta padrão de escuta
EXPOSE 3000

# Healthcheck interno do container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/ || exit 1

# Process supervisor 'tini' para lidar com sinais SIGINT / SIGTERM graciosamente
ENTRYPOINT ["/sbin/tini", "--"]

# Comando de inicialização padrão
CMD ["node", "server.js"]
