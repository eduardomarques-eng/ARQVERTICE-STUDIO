# ArqVértice Studio — Sistema de Publicação no Portal do Cliente (ClientPublication)

**Data de Emissão:** 22/09/2026  
**Status:** Vigente e Homologado  
**Subsistema:** Portal do Cliente / Gestão de Visibilidade e Publicações Oficiais (Bloco H04)

---

## 1. Visão Geral e Princípio de Isolamento

No **ArqVértice Studio**, vigora o princípio inegociável de que **a existência de um arquivo ou dado no projeto interno NÃO implica na sua publicação ou visibilidade externa para o cliente**.

Todos os arquivos gerados no estúdio — incluindo estudos preliminares, renders brutos em baixa resolução, pranchas técnicas em revisão, relatórios preliminares de quantitativos, anotações de equipe (`internalNotes`), prompts de IA e tabelas de banco de dados — são **estritamente internos** por padrão.

A visualização pelo cliente no Portal do Cliente exige uma **publicação explícita e auditada**, controlada através da entidade `ClientPublication`.

> [!IMPORTANT]
> **Regra de Ouro do Bloco H04:**  
> A publicação de qualquer ativo é um ato consciente e deliberado do arquiteto responsável. Nenhum arquivo novo inserido nas pastas ou módulos do projeto é publicado de forma automática. A despublicação retira imediatamente a visibilidade do cliente sem jamais apagar ou corromper o arquivo original no estúdio.

---

## 2. Entidade de Dados: `ClientPublication`

A entidade `ClientPublication` atua como uma camada mediadora de governança e autorização entre o repositório central de ativos do estúdio e o Portal do Cliente.

### 2.1 Esquema e Campos

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único (`cpub-...`). |
| `projectId` | `string` | ID do projeto no estúdio (`prj-praia-01`). |
| `portalId` | `string` | ID do Portal do Cliente vinculado (`cport-praia-01`). |
| `sourceType` | `string` | Tipo de conteúdo do catálogo canônico. |
| `sourceId` | `string` | ID do ativo de origem no banco interno (ex: renderId, planId, etc.). |
| `title` | `string` | Título formal visível para o cliente titular. |
| `description` | `string` | Descrição técnica/contextual da publicação. |
| `version` | `string` | Versão homologada do ativo (ex: `v1.0`, `R01`). |
| `status` | `string` | Estado do ciclo de vida da publicação (`internal`, `prepared`, `published`, `unpublished`, `archived`). |
| `publishedAt` | `ISO string / null` | Timestamp exato da homologação para publicação. |
| `unpublishedAt` | `ISO string / null` | Timestamp de retirada de publicação, se aplicável. |
| `publishedBy` | `string` | Identificação do arquiteto/colaborador responsável pela publicação. |
| `clientVisible` | `boolean` | Flag mestre de visibilidade para o cliente. |
| `downloadAllowed`| `boolean` | Autoriza ou bloqueia o download direto do arquivo em alta definição. |
| `commentAllowed` | `boolean` | Habilita campo de comentários e solicitações de ajuste pelo cliente. |
| `approvalAllowed`| `boolean` | Habilita fluxo de aceite/aprovação formal pelo cliente. |
| `fileUrl` | `string / null` | URL ou caminho relativo seguro do ativo homologado. |
| `fileSizeBytes` | `number / null` | Tamanho do arquivo em bytes. |
| `metadata` | `object` | Informações complementares (resolução, ambiente, escala, etc.). |

---

## 3. Catálogo Canônico de Status e Tipos

### 3.1 Status da Publicação (`CLIENT_PUBLICATION_STATUS`)

- `internal`: Conteúdo em criação no estúdio. Sem nenhuma exposição externa.
- `prepared`: Conteúdo homologado internamente e configurado para liberação futura.
- `published`: Ativo oficialmente publicado e acessível no Portal do Cliente conforme suas permissões.
- `unpublished`: Conteúdo cuja publicação foi revogada pelo arquiteto. Ocultado imediatamente do cliente.
- `archived`: Publicação histórica arquivada (superada por nova revisão ou encerramento do contrato).

### 3.2 Tipos Suportados (`CLIENT_PUBLICATION_TYPES`)

O sistema suporta a publicação explícita de 12 categorias canônicas:

1. `briefing`: Questionários e alinhamentos de necessidades estruturados;
2. `imagem`: Fotografias de referência, ensaios de terreno e painéis visuais;
3. `render`: Perspectivas 3D fotorrealistas (exteriores, interiores e detalhes);
4. `planta`: Plantas humanizadas, plantas baixas de layout e zoneamento;
5. `prancha`: Pranchas arquitetônicas de apresentação compostas (A1, A2, etc.);
6. `moodboard`: Painéis de ambientação, conceito visual e texturas;
7. `material`: Cadernos de especificações e amostras de materiais homologados;
8. `mobiliário`: Pranchas e catálogos de móveis soltos e marcenaria sugerida;
9. `relatório`: Relatórios executivos de acompanhamento e memoriais descritivos;
10. `vídeo`: Animações, passeios virtuais e renders de vídeo em alta resolução;
11. `documento`: Contratos de fase, certidões técnicas e memoriais legais;
12. `entrega`: Pacotes consolidados de entrega formal por marco contratual.

---

## 4. Matriz de Controles e Permissões Granulares

Cada publicação possui controles individuais que podem ser configurados independentemente:

1. **VISÍVEL AO CLIENTE (`clientVisible`)**:  
   Se `false`, o ativo não é exibido em nenhuma rota ou consulta do Portal do Cliente, mesmo que seu status seja `published`.

2. **DOWNLOAD PERMITIDO (`downloadAllowed`)**:  
   Determina se o cliente pode baixar o arquivo original em alta resolução (ex: PDF vetorial, imagem 4K, MP4) ou se apenas a visualização em tela com marca d'água é permitida.

3. **COMENTÁRIOS PERMITIDOS (`commentAllowed`)**:  
   Habilita o formulário de feedback contextual onde o cliente pode apontar sugestões, dúvidas ou impressões sobre aquele ativo específico.

4. **APROVAÇÃO PERMITIDA (`approvalAllowed`)**:  
   Disponibiliza o botão de "Aprovar Formalmente", registrando o aceite do cliente no histórico com timestamp e identificação do titular.

---

## 5. Salvaguarda Crítica: Retirar Publicação (Unpublish)

Quando o arquiteto opta por despublicar um conteúdo via método `unpublishClientPublication(publicationId, reason, user)` ou pelo painel do estúdio:

```javascript
// Exemplo de execução em js/state.js
StudioState.unpublishClientPublication('cpub-render-01', 'Atualização para R02 em andamento', 'Arquiteto');
```

- O status da publicação passa para `'unpublished'`;
- A flag `clientVisible` passa para `false`;
- O timestamp `unpublishedAt` é registrado;
- **O arquivo original no repositório de renders/projetos NÃO é apagado.** Ele permanece intacto no estúdio para consultas da equipe interna e futuras republicações.

---

## 6. Painel Interno: "Publicar no Portal"

No ambiente interno do ArqVértice Studio (workspace do projeto), os arquitetos contam com o modal dedicado **"Publicar no Portal do Cliente"** (`ClientPortalModule.openPublicationModal(projectId)`), acionado diretamente pelo cabeçalho do projeto.

### Recursos do Painel:
- **Listagem de Ativos Disponíveis:** Varre briefings, renders fotorrealistas e plantas humanizadas do projeto;
- **Exibição Transparente:** Mostra tipo de conteúdo, versão atual, status no portal (Publicado / Rascunho Interno) e badges de permissões ativas;
- **Controles Rápidos (Toggles):**
  - Alternar visibilidade pública;
  - Alternar permissão de download;
  - Alternar permissão de aprovação formal;
- **Ações Imediatas:** Botões de "Publicar" ou "Despublicar" com atualização em tempo real e geração de logs de auditoria.

---

## 7. Rastreabilidade e Auditoria

Todas as alterações de publicação geram registros imutáveis no log de auditoria do estúdio (`StudioState.addAudit`):

- `CLIENT_PUBLICATION_PUBLISHED`: Registro de inclusão ou ativação pública do ativo com especificação de autor e data;
- `CLIENT_PUBLICATION_UNPUBLISHED`: Registro de revogação de visibilidade com motivo declarado;
- `CLIENT_PUBLICATION_UPDATED`: Registro de ajustes em flags de permissões (`downloadAllowed`, `approvalAllowed`).
