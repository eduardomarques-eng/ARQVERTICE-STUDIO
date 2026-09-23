# ARQVERTICE STUDIO — FLUXOS MANUAL E HÍBRIDO DE VÍDEO
## BLOCO G: WORKFLOW SECUNDÁRIO E COEXISTÊNCIA TÉCNICA

Data: 2026-09-22  
Módulo: Remotion Architectural Video Engine  
Status: Produção / Integrado  

---

### 1. Princípio Fundamental
O **Fluxo Programático React + Remotion** é o caminho principal de produção no ArqVertice Studio.  
Contudo, o sistema reconhece que arquitetos e designers audiovisuais utilizam ferramentas de edição externa consagradas (como DaVinci Resolve, Premiere Pro, Final Cut ou CapCut) para finalizações especializadas ou captura in loco.

O ArqVertice Studio **não substitui** esses softwares e **não tenta ser um editor de vídeo genérico**.  
Ele atua como o **Centro de Inteligência, Organização e Garantia de Qualidade** do material arquitetônico.

---

### 2. O Fluxo Manual (Importação e Curadoria)

#### Pipeline:
$$\text{Projeto} \longrightarrow \text{VideoBrief} \longrightarrow \text{Produção Externa} \longrightarrow \text{Importação MP4/MOV} \longrightarrow \text{Auditoria QA (G14)} \longrightarrow \text{Versionamento Canônico} \longrightarrow \text{Export}$$

#### Regras Técnicas:
1. **Vínculo Obrigatório com o Projeto**: Nenhum vídeo é órfão. Ao importar um arquivo de vídeo manual, ele deve ser obrigatoriamente associado a um `projectId` e a um `videoProjectId`.
2. **Preservação de Conteúdo**: O sistema não altera arbitrariamente nem re-comprime destrutivamente o arquivo importado.
3. **Auditoria Obrigatória (QA G14)**: O arquivo importado é submetido imediatamente aos 13 checkpoints canônicos (resolução, proporção, cortes, continuidade, iluminação).
4. **Geração de Versão**: É criada uma nova `VideoRenderVersion` rastreável com metadados detalhados de autor, ferramenta externa utilizada e timestamp.

#### Exemplo de Chamada:
```javascript
const result = RemotionEngine.importManualVideo({
  videoProjectId: 'video-praia-01',
  videoUrl: 'assets/renders/externals/tour_sala_final.mp4',
  author: 'Pedro Albuquerque',
  externalSoftware: 'DaVinci Resolve Studio',
  notes: 'Color grading aplicado com LUT Kodak 2383 e estabilização de gimbal.'
});
```

---

### 3. O Fluxo Híbrido (Fusão de Vídeo Capturado + Remotion Graphics)

#### Pipeline:
$$\begin{matrix} \text{Vídeo Capturado / Externo} \\ + \\ \text{Renders Fotorrealistas BIM} \end{matrix} \xrightarrow{\text{Fusão Remotion}} \begin{matrix} \text{Motion Graphics Institucional} \\ + \\ \text{Selo e Prancha Técnica} \\ + \\ \text{Tipografia e Safe Area} \end{matrix} \longrightarrow \text{Master Final}$$

#### Aplicações Típicas:
- **Abertura e Encerramento Institucionais**: Um clipe gravado de drone na praia recebe a vinheta, prancha e tipografia minimalista do ArqVertice Studio via Remotion.
- **Transição Planta $\rightarrow$ Vídeo**: Uma prancha técnica humanizada realiza um zoom e dissolve para uma tomada de vídeo gravada da obra ou render animado.
- **Lower Thirds e Selos Técnicos**: Inclusão de legendas dinâmicas de materiais (ex: *Mármore Travertino Navona*, *Madeira Cumaru*) sobrepostas ao vídeo gravado sem necessidade de renderizar novamente no editor externo.

#### Exemplo de Chamada:
```javascript
const hybridResult = RemotionEngine.composeHybridVideo({
  videoProjectId: 'video-praia-01',
  externalVideoUrl: 'assets/videos/drone_fachada.mp4',
  introDurationFrames: 90,
  outroDurationFrames: 120,
  overlayTitleBlock: true,
  user: 'Pedro Albuquerque'
});
```

---

### 4. Rastreabilidade e Versionamento
Tanto no fluxo manual quanto no híbrido:
- Versões anteriores nunca são sobrescritas (segue versionamento estrito `v1.0`, `v1.1`, etc.).
- O relatório de conformidade visual é anexado à versão.
- Logs de auditoria são registrados no `StudioState.addAudit`.
