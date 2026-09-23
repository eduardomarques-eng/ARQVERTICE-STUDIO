# ARQVERTICE STUDIO — POLÍTICAS DE SEGURANÇA DE IA (I19)
## Fronteiras de Autoridade do Modelo, Limites de Entrada e Proteção de Dados

---

## 1. Regra de Ouro de Segurança

> **"O modelo de inteligência artificial é um conselheiro probabilístico e gerador textual, NUNCA o executor primário de autoridade no software."**

---

## 2. Diretrizes Técnicas de Segurança

1. **Zero Secrets no Frontend:** Nenhuma chave de API privada (`sk-*`, bearer tokens) é exposta em arquivos JS estáticos ou requisições cliente. Toda comunicação externa é intermediada por endpoints autenticados em `server.js`.
2. **Defesa contra Prompt Injection:** Entradas do usuário e metadados de arquivos (IFC, documentos, imagens) são encapsuladas em blocos `<external_source>` como dados não confiáveis, neutralizando tentativas de fuga de contexto (`developer mode`, `system override`).
3. **Controle Estrito de Ferramentas:** Agentes recebem permissões em tempo de compilação por papel (`planner`, `decision`, `specialist`, `executor`, `validator`). Um modelo não pode solicitar execução de ferramentas não autorizadas por sua matriz.
4. **Sandbox de Arquivos:** Operações de I/O em disco são restritas a pastas da lista branca (`projects/`, `cache/`, `exports/`, `database/`, `video/`) com bloqueio de path traversal (`..`) e teto de 50MB.
5. **Confirmação de Ações Destrutivas:** Ações irreversíveis (exclusão de projeto, publicação externa) exigem autorização em dois passos com emissão de token efêmero e aprovação humana explícita.
6. **Sanitização de Telemetria:** Logs de console e eventos de observabilidade passam por filtragem contínua via regex para mascaramento de PII e chaves criptográficas.
