# ================================================================
# ARQVERTICE STUDIO — AUDITORIA COMPLETA DE IA (BLOCO I01)
# docs/ai/audit/I01-ai-audit.md
# ================================================================

**Data:** 22/09/2026  
**Versão:** 1.0.0  
**Escopo:** Auditoria Exaustiva da Arquitetura e Componentes de IA no ArqVértice Studio  
**Status:** CONCLUÍDA  

---

## 1. RESUMO EXECUTIVO

Esta auditoria técnica investigou 100% do repositório do **ArqVértice Studio** para mapear os pontos reais de integração, compilação de contexto, modelos, provedores, bibliotecas e rotinas de Inteligência Artificial existentes no código.

### Diagnóstico Fundamental
1. **Ausência de Alucinações no Backend**: O ArqVértice Studio adota uma estratégia estritamente **controlada e orientada a contexto estruturado**. A aplicação não executa chamadas aleatórias de IA soltas pelo código.
2. **Dois Barramentos de Provedores Existentes**:
   - **Motor de Renderização Visual (Bloco D06)**: Interface `VisualGenerationProvider` com implementações `MockVisualGenerationProvider` (offline/testes determinísticos) e `GeminiVisualGenerationProvider` (Google Imagen 3 via proxy seguro), gerenciados por `RenderProviderRegistry`.
   - **Motor de Prompts Audiovisuais (Bloco G07)**: Interface `VideoPromptProvider` com implementações para `gemini`, `google_veo`, `external_video_models` (Runway Gen-3, Luma, Kling), `external_tools` (ComfyUI, Midjourney) e `local_generator` (Wan 2.1, Stable Video Diffusion), gerenciados por `videoPromptRegistry`.
3. **Compilador Central de Contexto de Projeto (`PROJECT_DESIGN_CONTEXT`)**:
   - Centralizado no método `buildProjectDesignContext()` em `js/state.js`, compilando projeto, conceito (C04), estudos preliminares validados (C03), levantamento (C02), paleta, iluminação, mobiliário, diretrizes por ambiente e locks de consistência.
4. **Acoplamento e Oportunidade**:
   - Os dois subsistemas de provedores operam de forma isolada, sem um **AI Router** unificado que resolva capacidades (`AICapability`) por políticas de custo, latência ou qualidade (`AIRoutingPolicy`).
   - Não há camada intermediária de decisão para orquestração heurística (papel a ser preparado para o **Jev** no bloco I03).

---

## 2. INVENTÁRIO COMPLETO DE IA EXISTENTE

| Item | Local | Tecnologia | Função | Entrada | Saída | Chamada | Estado |
|---|---|---|---|---|---|---|---|
| **AI-01** | `js/render-providers.js` | Gemini Imagen 3 / Vertex AI | Geração de renders fotorrealistas de ambientes | `job`, `compiledContext`, `options` | `{ imageUrl, seed, tokensUsed, cost, metadata }` | Assíncrona (via proxy `/api/render/gemini-imagen` ou fallback mock) | **Ativo** |
| **AI-02** | `js/render-providers.js` | Mock Visual Generation | Simulação determinística de render para testes/offline | `job`, `compiledContext`, `options` | Imagem fotorrealista selecionada da galeria curada + metadados de simulação | Síncrona / Assíncrona com latência simulada | **Ativo** |
| **AI-03** | `js/video-prompt-providers.js` | Gemini Multimodal Video | Compilação de prompt cinemático para vídeo arquitetônico | Contexto da cena, locks, estilo e iluminação | Prompt estruturado em linguagem natural incorporando restrições e locks | Síncrona de formatação | **Ativo** |
| **AI-04** | `js/video-prompt-providers.js` | Google Flow / Veo | Formatação de prompts cinemáticos específicos para Veo 2.0 | Contexto da cena, lentes (35mm), movimento de câmera | Prompt + parâmetros de frame rate e motion strength (1-10) | Síncrona de formatação | **Ativo** |
| **AI-05** | `js/video-prompt-providers.js` | Runway Gen-3 / Luma / Kling | Formatação de prompts para modelos comerciais de vídeo | Cena, movimento, acabamentos e iluminação HDR | Prompt comercial + negative prompt + parâmetros de interpolação | Síncrona de formatação | **Ativo** |
| **AI-06** | `js/video-prompt-providers.js` | ComfyUI / Midjourney | Exportação de manifesto técnico e parâmetros CLI | Parâmetros de câmera, aspect ratio, locks | Prompt formatado com flags (`--ar`, `--motion`, `--chaos`) | Síncrona de formatação | **Ativo** |
| **AI-07** | `js/video-prompt-providers.js` | Wan 2.1 / SVD | Pipeline local de vídeo focado em estabilidade geométrica | Câmera, textura, locks estruturais | Prompt detalhado com ênfase em geometria ortogonal estrita | Síncrona de formatação | **Ativo** |
| **AI-08** | `js/state.js:8524` | Agregador de Contexto | Compilação de `PROJECT_DESIGN_CONTEXT` para IA | `projectId`, `environmentId` | Objeto canônico estruturado com conceito, estudos, paleta, diretrizes | Síncrona | **Ativo** |
| **AI-09** | `video/render/remotion-engine.js` | Remotion (React Video) | Renderização audiovisual determinística | Dados estruturados do projeto, cenas e assets | Vídeo final composto por código sem alucinação | Execução no canvas / Remotion CLI | **Ativo** |

---

## 3. PONTOS DE ACOPLAMENTO E RISCOS TÉCNICOS

### 3.1. Acoplamento de Nomes de Modelos na UI
- **Situação Encontrada:** O componente de interface `video-prompt-engine-module.js` exibia seletores diretos de providers (`gemini`, `veo`, `runway`), em vez de solicitar uma capacidade (`VIDEO_PROMPT_GENERATION`) mediada por política.
- **Classificação:** **Aceitável / Melhorável**. Não quebrava a aplicação porque os providers herdavam de uma classe base, mas exigirá o `AIRouter` para desacoplar a escolha de modelo do componente visual.

### 3.2. Chaves de API e Segurança
- **Situação Encontrada:** **100% em conformidade com as salvaguardas**. Não há chaves de API, credenciais ou secrets no código do cliente ou em arquivos versionados. O `GeminiVisualGenerationProvider` aponta para um endpoint de proxy (`/api/render/gemini-imagen`), mantendo as credenciais restritas ao ambiente do servidor.

### 3.3. Risco de Desperdício de Tokens e Chamadas
- **Situação Encontrada:** Renders e prompts possuem mecanismo de cache e versionamento progressivo (`V01`, `V02`). Uma imagem ou cena já aprovada tem mutação bloqueada por salvaguardas em `js/state.js`, evitando reprocessamentos acidentais.

---

## 4. RESPONSABILIDADES QUE NÃO DEVEM SER DE IA (DETERMINISMO OBRIGATÓRIO)

As seguintes tarefas **permanecem estritamente determinísticas** por código e nunca serão delegadas a modelos generativos:

1. **Cálculo de Escalas e Pranchas Técnicas (Bloco F02 / F03)**:
   - Margens, carimbos, dimensões de papel A0 a A4 e fator de escala (1:50, 1:100, 1:200).
2. **Quantitativos e Orçamentos de Materiais (Bloco E03)**:
   - Fórmulas de área ($m^2$), perímetro ($m$), volume ($m^3$) e sobras percentuais.
3. **Locks de Consistência e Precedência (Bloco D07)**:
   - Trava de volumetria, layout de marcenaria e orientação de câmeras.
4. **Governança de Estados e Permissões (Bloco C05 / H01)**:
   - Transições de ciclo de vida (`DRAFT` ➔ `IN_REVIEW` ➔ `APPROVED` ➔ `SUPERSEDED`).
   - Validação de sessões de clientes e controle de acesso a documentos privados.
5. **Autoria e Histórico de Decisões (Bloco C03 / C06)**:
   - Registro imutável de aprovação ou rejeição pelo arquiteto responsável.

---

## 5. MAPA DE CONTEXTO E DADOS ENVIADOS À IA

A camada de contexto é segmentada em pacotes com fronteiras estritas:

```
┌────────────────────────────────────────────────────────┐
│               PROJECT_DESIGN_CONTEXT                   │
├──────────────────────────┬─────────────────────────────┤
│ DADOS INCLUSOS (VÁLIDOS) │ DADOS OMITIDOS (SEGURANÇA)  │
├──────────────────────────┼─────────────────────────────┤
│ - Nome e código projeto  │ - Chaves e senhas           │
│ - Estilo e atmosfera     │ - Dados cadastrais cliente  │
│ - Paleta de cores oficial│ - Preços e margens internas │
│ - Diretrizes materiais   │ - Telefones e endereços     │
│ - Estudos aprovados (C03)│ - URLs privadas de arquivos │
│ - Locks de preservação   │ - Contratos jurídicos       │
└──────────────────────────┴─────────────────────────────┘
```

---

## 6. MAPA BIM, 3D E AUDIOVISUAL

### 6.1. BIM & Geometria
- O ArqVértice Studio opera como integrador e humanizador conceitual do **Autodesk Revit**.
- As propriedades de ambientes (nome, área em $m^2$, pavimento, categoria) e vistas de câmera são mantidas como dados estruturados, prontos para consumo por algoritmos ou inspeção semântica.

### 6.2. 3D & Câmeras
- O sistema de câmeras (`CAMERA_SYSTEM.md`) cataloga coordenadas espaciais, elevação, rotação, ângulo de visão (FOV) e altura focal (35mm, 50mm, 24mm), fornecendo contexto trigonométrico preciso aos prompts de geração visual.

### 6.3. Audiovisual & Remotion
- A narrativa é estruturada em Scenes e Shots com tempos definidos em segundos e frames (24fps).
- A composição final de pranchas, textos animados e cartelas de encerramento é feita com código puro via **Remotion**, garantindo fidelidade de 100% sem distorção tipográfica.

---

## 7. PONTOS PREPARADOS PARA INTEGRAÇÃO COM JEV (I03)

O Jev atuará como o **Motor de Decisão Estruturada e Raciocínio Heurístico** do ArqVértice Studio. Os pontos identificados para acolher o Jev no bloco I03 são:

1. **Roteamento de Workflow**: Determinar se uma alteração solicitada pelo cliente exige nova revisão completa ou apenas ajuste de material.
2. **Seleção Heurística de Alternativas (C03)**: Comparar prós e contras de alternativas preliminares e sugerir ordenação de viabilidade para o arquiteto.
3. **Avaliação de Coerência entre Briefing e Projeto**: Checar se as preferências registradas pelo cliente continuam atendidas na versão atual do projeto.
4. **Verificação de Regras Construtivas Básicas**: Identificar conflitos entre dimensões de mobiliário e áreas mínimas de circulação.

---

## 8. RESPOSTAS OBJETIVAS AOS 14 CRITÉRIOS DE ACEITE DO I01

1. **Onde está a IA do ArqVertice Studio?**  
   Principalmente em `js/render-providers.js` (geração de imagens), `js/video-prompt-providers.js` (prompts cinemáticos), `js/state.js` (`buildProjectDesignContext`) e nos renderizadores correspondentes.
2. **Quais modelos utiliza?**  
   Google Imagen 3 (`imagen-3.0-generate-002`), Gemini 2.0 Flash, Google Veo (preparado), Runway Gen-3, Luma Dream Machine, Wan 2.1 e motores determinísticos/mock.
3. **Quais providers utiliza?**  
   Google Vertex AI / Gemini, Mock Provider, Provedores Comerciais de Vídeo e Geradores Locais.
4. **Quais workflows utilizam IA?**  
   Geração de Renders Fotorrealistas (D06), Compilação de Prompts de Vídeo (G07), Compilação de Contexto de Design (C04) e Síntese de Ambientes (D01).
5. **Onde o frontend se comunica com IA?**  
   Exclusivamente via classes de Provider mediadas por endpoints de proxy ou mocks determinísticos; nenhuma chave é exposta no cliente.
6. **Onde existe acoplamento?**  
   Nos módulos visuais que invocam o registry específico (`RenderProviderRegistry` e `videoPromptRegistry`) em vez de um despachante unificado.
7. **Que dados são enviados aos modelos?**  
   Metadados espaciais, estilo arquitetônico, paleta de cores, tags de materiais e locks visuais. Dados comerciais e sensíveis de clientes são rigorosamente expurgados.
8. **Onde existe BIM?**  
   Em modelos relacionais de pavimentos, ambientes, categorias de cômodo e vínculos de vistas com o Revit.
9. **Onde existe 3D?**  
   No sistema de câmeras, enquadramentos e parâmetros de perspectiva humanizada.
10. **Onde existe vídeo?**  
    No Remotion Engine (`video/`), Storyboard, Narrative Engine e Video Prompt Engine.
11. **Quais decisões poderiam utilizar Jev?**  
    Decisões heurísticas de roteamento de revisões, comparação de viabilidade de alternativas de estudo e checagem de conformidade de briefing.
12. **Onde existe risco de duplicação?**  
    Em registries de providers separados que mantêm lógicas similares de verificação de capacidades.
13. **O que deve ser preservado?**  
    Todos os contratos de dados existentes, mocks determinísticos de testes, compilador `PROJECT_DESIGN_CONTEXT` e segurança de chaves.
14. **O que não precisa de IA?**  
    Cálculo de pranchas, escalas métricas, fórmulas de quantitativos, controle de permissões e ciclo de vida de aprovação.
