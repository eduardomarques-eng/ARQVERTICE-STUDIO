# Blender Bridge e Composição 3D (MCP)

O ArqVértice Studio conecta-se a instâncias locais do Blender através de uma ponte segura baseada no protocolo **MCP (Model Context Protocol)** (`js/blender-bridge-service.js`), viabilizando operações tridimensionais complexas e renderização foto-realista fechada.

---

## 1. Topologia de Segurança Localhost

```text
ArqVértice Studio (Navegador)
             │ (Requisições HTTP Seguras / IPC)
             ▼
        server.js
             │ (localhost / Token Bearer)
             ▼
      Blender MCP Server (Python Addon / Headless)
             │
      Blender 4.x Engine (Cycles / EEVEE)
```

- **Restrição de Rede**: O bridge conecta-se exclusivamente a `127.0.0.1` (localhost). Conexões remotas sem túnel autenticado são sumariamente bloqueadas.
- **Execução Sandboxed**: O bridge executa scripts Python pré-validados com checagem léxica (AST check), impedindo chamadas a `subprocess`, comandos de sistema operacional ou manipulação indiscriminada do sistema de arquivos.

---

## 2. Inspeção em Ciclo Fechado (Closed-Loop)

Ao realizar uma modificação em uma cena 3D:

1. O agente emite o comando de ajuste (ex: *"Reposicionar câmera para vista em ângulo baixo e aumentar intensidade do HDRI"*).
2. O Blender executa a ação e gera um screenshot do viewport / render rápido.
3. O modelo de visão (`Qwen3-VL`) inspeciona o render resultante.
4. O sistema avalia se a composição atende aos parâmetros solicitados (enquadramento, iluminação, escala).
5. Em caso de discrepância, o agente repara os parâmetros automaticamente antes de entregar o resultado final ao usuário.

---

## 3. Comparação de Diferença de Cena (Scene Diff)

Todas as transformações (adição de malhas, remoção de luzes, alteração de materiais) geram um log estruturado de `SceneDiff`, permitindo rastrear exatamente quais nós da cena sofreram mutações.
