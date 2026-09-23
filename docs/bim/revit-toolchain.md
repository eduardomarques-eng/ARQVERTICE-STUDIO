# J40/J41 - Revit Toolchain e sincronizacao

## Decisao de transporte

O transporte de producao escolhido e **TCP em loopback**, em uma unica porta local. A escolha segue a referencia principal `LuDattilo/revit-mcp-server`, que separa servidor MCP, plugin Revit e command set e comunica por mensagens locais. WebSocket e named pipe nao fazem parte do transporte de producao.

O frontend nao acessa a API Revit diretamente: o backend/local service e o adapter MCP fazem a ponte entre o Studio e o conector TCP. O add-in continua sendo o dono de `ExternalEvent`, transacoes e acesso a Revit API.

## Contrato de sessao

1. Pairing cria um codigo temporario de seis digitos.
2. O conector valida o codigo e recebe um token efemero.
3. Toda requisicao declara `requestId`, `operation`, `mode`, `timestamp` e token.
4. A lista de operacoes e fechada; nao existe execucao de C# arbitrario.
5. Origem e permitida somente para portas locais configuradas.
6. Fechamento do Revit produz `DISCONNECTED`; reconexao e limitada a cinco tentativas.

## J40: sincronizacao bidirecional

Cada objeto preserva `id`, `elementId`, `source`, `sourceId`, `revitUniqueId` e `version`. O snapshot compara geometria, transform, tipo, familia, material, parametros e visibilidade.

Estados suportados: `IN_SYNC`, `REVIT_CHANGED`, `ARQ_CHANGED`, `BOTH_CHANGED`, `CONFLICT` e `UNTRACKED`.

Alteracoes visuais permanecem no ArqVertice. Alteracoes BIM seguem `preview -> change set -> approval -> transaction -> verify`; nenhum commit ocorre sem token de aprovacao. Snapshots, conflicts e changesets permanecem registrados em memoria durante a sessao.

## Doctor

`node scripts/arq-revit.js doctor` verifica Revit instalado, Revit 2026, processo em execucao, add-in, conector, porta, runtime .NET, pyRevit, MCP e ArqVertice. Ausencia de pyRevit nao bloqueia o canal principal; pyRevit e opcional para utilitarios e diagnosticos.

## Referencias auditadas

- `LuDattilo/revit-mcp-server`: referencia principal para separacao de camadas, command set, instalacao por versao e suporte Revit 2026/.NET 8.
- `zymorel/revit-mcp`: referencia experimental para Python stdio e WebSocket; nao e dependencia de producao.

## Build Revit 2026

O target `net8.0-windows` aponta exclusivamente para `C:\Program Files\Autodesk\Revit 2026\RevitAPI.dll` e `RevitAPIUI.dll`. O target `net48` permanece isolado para Revit 2024. O build e condicionado a essas assemblies existirem na maquina de desenvolvimento.
