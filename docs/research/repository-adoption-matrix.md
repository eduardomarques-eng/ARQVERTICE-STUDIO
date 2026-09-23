# ARQVERTICE STUDIO — MATRIZ DE AUDITORIA E ADOÇÃO DE REPOSITÓRIOS E SKILLS
**Documento:** `docs/research/repository-adoption-matrix.md`  
**Versão:** 1.0.0 — Bloco I07  
**Status:** HOMOLOGADO  
**Regra Fundamental:** Nenhuma dependência externa é incorporada ao bundle do produto sem justificativa técnica comprovada, conformidade de licença, teste de compatibilidade e garantia de ausência de lock-in.

---

## 1. Regra Absoluta de Avaliação (10 Critérios Mandatórios)

Antes da aprovação de qualquer pacote, repositório ou skill:
1. **Problema já resolvido:** Verificar se o código nativo existente já atende à necessidade funcional.
2. **Dependência equivalente:** Avaliar se módulos existentes no estúdio cobrem o escopo.
3. **Melhoria interna:** Verificar se o código nativo pode ser simplesmente refatorado ou especializado.
4. **Custo e overhead:** Ponderar custo computacional, complexidade de build e dívida técnica.
5. **Licença:** Confirmar se é MIT, Apache 2.0, BSD ou similar permissiva, vetando GPL/AGPL invasivas.
6. **Atividade:** Avaliar cadência de commits, resolução de issues e suporte a padrões modernos.
7. **Compatibilidade:** Garantir interoperabilidade com ESM/Vanilla JS, Node.js e ausência de conflito de polyfills.
8. **Tamanho do pacote:** Evitar injeção de dependências pesadas no runtime do cliente.
9. **Impacto no bundle:** Medir se compromete o carregamento inicial (< 200ms) e o TTFB.
10. **Risco de lock-in:** Vetar padrões proprietários que impeçam substituição modular futura.

---

## 2. Matriz de Avaliação dos Candidatos Prioritários

| Candidato | Repositório / Referência | Propósito Arquitetural | Licença | Atividade / Maturidade | Compatibilidade | Dependências Chave | Impacto no Bundle | Riscos Principais | Alternativa Interna | Decisão |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Impeccable** | `agent-skills/impeccable` | Auditoria de layout, tipografia, a11y e microinterações para agentes | MIT | Ativo / Maduro | Alta (Processo/Skill) | Nenhuma (Agent CLI/Skill) | Zero (0 KB runtime) | Transformar ferramenta de processo em dependência de runtime | Checklist e scripts em `tests/audit-design.js` | **ADAPT** (Usar estritamente como Skill de processo/QA, sem dependência runtime no produto) |
| **design-md** | `VoltAgent/awesome-design-md` | Documentação do design system, contrato visual de tokens e guia para agentes | MIT | Ativo / Referência canônica | Total (Markdown/Tokens) | Nenhuma | Zero (0 KB runtime) | Tentativa de reescrever todo o CSS existente | `DESIGN.md` canônico v2.1.0 e `docs/design/` | **ADOPT** (Adotado como padrão metodológico de especificação visual e tokens) |
| **Remotion** | `remotion-dev/remotion` | Composição audiovisual programática baseada em tempo e física | GPL-3.0 / Company License (Remotion License) | Muito Ativo / Alta maturidade | Alta em ambiente Node/SSR | React, WebGL, FFmpeg | Alto se empacotado no client | Custo de licenciamento comercial e peso do bundle no browser | Motor de simulação determinística em `video/render/remotion-engine.js` | **ADAPT** (Manter motor nativo determinístico no cliente e adotar Remotion no backend de render/SSR quando necessário) |
| **React Three Fiber** | `pmndrs/react-three-fiber` | Camada declarativa React para renderização Three.js | MIT | Muito Ativo / Alta maturidade | Requer runtime React completo | React, Three.js, React-Reconciler | Muito alto (> 600 KB gzip) | Forçar arquitetura React sobre o shell Vanilla JS de alta performance | Canvas 2D/Perspective nativo (`humanized-perspective-module.js`) | **REFERENCE** (Usar como referência de shaders e iluminação; não adotar dependência no frontend atual) |
| **That Open** | `@thatopen/components` (Sucessor IFC.js) | Ingestão, visualização e extração de propriedades BIM / IFC Fragments | Apache-2.0 | Ativo / Stack moderna | Média (ESM com WASM) | Three.js, Web-IFC, Fragments | Médio a alto (depende de WASM) | Incompatibilidade de threads em mobile antigo e complexidade de parsing | Módulos estruturados de especificação (`survey-module.js`, `quantity-system-module.js`) | **EXPERIMENT** (Isolar em protótipo de laboratório para visualização IFC futura; não acoplar agora) |
| **OpenMotion** | `openmotion-org/openmotion` | Arquitetura de renderização de motion e transições em timeline | MIT | Experimental / Moderada | Média | WebGL, WebCodecs | Médio | Fragmentação de padrões e baixa documentação de produção | `video-camera-motion-module.js` e `video-timeline-module.js` | **REFERENCE** (Referência arquitetural de curvas bezier e interpolações cinematográficas) |
| **OpenChatCut** | `openchatcut/openchatcut` | Edição audiovisual guiada por IA, timelines multitrack e MCP | MIT | Ativo / Inovador | Média | FFmpeg, WebCodecs, MCP SDK | Alto | Sobrecarga de features de editor manual que não pertencem ao core arquitetônico | Suite de módulos `video-studio-module.js`, `video-script-engine.js` | **REFERENCE** (Referência de arquitetura MCP para agentes e timelines audiovisuais) |
| **Aedifex** | `aedifex/aedifex` | Modelagem paramétrica de alvenarias, aberturas e geração procedural | MIT | Laboratório / Em evolução | Média | WebGL, Three.js | Alto | Rigidez geométrica paramétrica que pode conflitar com normas NBR | `studies-module.js` e motor de pranchas técnicas (`sheet-engine-module.js`) | **REFERENCE** (Referência para algoritmos heurísticos de geração de layout e regras de circulação) |
| **Roomify** | `roomify-ai/roomify` | UX de comparação de ambientes, análise de iluminação e render | MIT | Ativo / Estável | Alta | Canvas API, WebGL | Baixo | Acoplamento com APIs de visão proprietárias | `environment-visualization-module.js` e `concept-module.js` | **REFERENCE** (Referência para split-screen slider e comparador de materiais em tempo real) |
| **Strux** | `strux-ai/strux` | Ingestão de plantas baixas, extração vetorial e segmentação estrutural | Apache-2.0 | Moderada / Focado | Média | Python backend / OpenCV | Backend-only | Dependência de OCR de baixa resolução em plantas escaneadas | `survey-module.js` e ingestão de levantamento arquitetônico | **REFERENCE** (Referência de pipeline para futura extração de eixos e pilares via visão computacional) |
| **OpenBIM Viewer** | `openbim-viewer/viewer` | Visualizador minimalista Web IFC baseado em WebGL | MPL-2.0 | Moderada / Estável | Alta | Three.js, Web-IFC | Médio | Limitações em arquivos IFC superiores a 100MB no browser | Módulo de visualização e anotação técnica do ArqVértice | **EXPERIMENT** (Testar em ambiente controlado para leitura de arquivos IFC locais leves) |

---

## 3. Classificação Canônica das Decisões

* **ADOPT (1):** `design-md` — Adotado integralmente como metodologia e contrato visual de especificação (`DESIGN.md`).
* **ADAPT (2):** `Impeccable` (adaptado como Agent Skill e processo de auditoria de qualidade) e `Remotion` (adaptado como arquitetura canônica e executado via motor determinístico nativo no cliente e backend dedicado para compilações pesadas).
* **REFERENCE (6):** `React Three Fiber`, `OpenMotion`, `OpenChatCut`, `Aedifex`, `Roomify`, `Strux` — Mantidos como benchmarks técnicos e conceituais de engenharia, sem inclusão de pacotes NPM no produto.
* **EXPERIMENT (2):** `That Open` (`@thatopen/components`) e `OpenBIM Viewer` — Destinados ao laboratório de testes para visualização IFC em fases futuras especializadas.
* **REJECT (0):** Nenhum candidato priorizado foi categoricamente rejeitado para estudo, mas todas as instalações cegas de pacotes foram vetadas.

---

## 4. Auditoria de Skills Disponíveis no Ambiente da IDE

Mapeamento dos domínios operacionais e correspondência com as ferramentas instaladas:

| Domínio Operacional | Skills Disponíveis no Ambiente | Status no ArqVértice Studio |
| :--- | :--- | :--- |
| **Frontend & Design System** | `agy-customizations`, `building-data-apps`, `antigravity-guide` | Utilizadas para governança de tokens, convenções de UI e padrões de arquitetura web. |
| **Motion & Vídeo Programático** | `remotion` (`.agents/skills/remotion/SKILL.md`) | Motor ativo de referência para composição de cenas cinematográficas e especificações de timing. |
| **BIM, 3D & Engenharia** | Módulos nativos (`survey`, `sheet-engine`, `humanized-perspective`, `quantity-system`) | Especializados via novas Agent Skills locais (`bim-analysis`, `architectural-documentation`). |
| **Auditoria & Visual QA** | Scripts nativos (`tests/audit-design.js`, `tests/visual-responsive-qa.test.js`) | Formalizadas como skills especializadas de teste e verificação heurística. |
| **Browser, Navegação & Testes** | `chrome-devtools-mcp` (ferramentas de browser e performance), subagentes | Empregadas em testes end-to-end de responsividade e auditoria de consoles. |
| **Segurança & Governança** | `accidental-data-loss-prevention`, `enforcing-resource-attribution`, `gcs-security-assessment` | Salvaguardas rigorosas contra mutações destrutivas e vazamento de chaves ou dados de clientes. |

---

## 5. Diretriz de Manutenção

Nenhuma nova dependência NPM poderá ser adicionada ao `package.json` sem um aditivo formal a esta matriz, com registro prévio do benchmark e justificativa de ROI técnico.
