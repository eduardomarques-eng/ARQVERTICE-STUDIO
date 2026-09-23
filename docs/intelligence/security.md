# Segurança da Camada Multimodal e Sandbox

O **ArqVértice Studio** estabelece barreiras ativas para impedir que a integração multimodal, modelos de IA ou dados externos gerem alterações não autorizadas, vazamentos de dados ou comandos destrutivos.

---

## 1. Tratamento de Conteúdo Não Confiável (Untrusted Content)

Todos os dados provenientes de fontes externas são tratados como não confiáveis:
- Arquivos IFC enviados por projetistas complementares.
- Pranchas DXF/DWG externas.
- Imagens de referências e fotos de clientes.
- Memoriais em PDF com tabelas escaneadas.
- Metadados e propriedades embutidas em arquivos 3D.

**Defesa contra Injeção de Prompt Indireta:**
Instruções e dados são categoricamente separados no pipeline. O modelo de raciocínio recebe o conteúdo externo com tags explícitas de dados brutos (`<untrusted_document>...</untrusted_document>`), sendo terminantemente proibido de interpretar sentenças dentro de pranchas como diretrizes do sistema.

---

## 2. Segredos e Credenciais (Zero Secrets in Frontend)

- Nenhuma chave de API de serviços de nuvem ou credencial de banco de dados reside no código JavaScript do cliente.
- Todas as chamadas para provedores externos passam pelo backend seguro (`server.js`) onde variáveis de ambiente de produção são injetadas.
- Acesso à rede local para servidores MCP (Blender, FreeCAD) é restrito a `localhost:3000` / loopback e protegido por token interno de sessão.

---

## 3. Sandboxing de Execução

1. **Sem Execução Arbitrária de Código**:
   O sistema proíbe categoricamente funções como `eval()`, `new Function()` ou execução arbitrária de scripts Python / shell enviados por modelos de IA.
2. **Timeouts Rígidos**:
   Cada ferramenta possui um tempo máximo estrito de execução (definido em seu contrato) para evitar travamentos ou consumo abusivo de recursos.
3. **Prevenção de Ações Destrutivas sem Confirmação**:
   Operações com risco `DESTRUCTIVE` não possuem caminho de execução autônomo; elas exigem confirmação interativa do arquiteto via modal de interface com detalhamento do impacto.
