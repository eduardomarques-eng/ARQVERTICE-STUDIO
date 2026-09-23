# ARQVERTICE STUDIO — COMPOSIÇÕES DE VÍDEO (REMOTION)
## BLOCO G: FAMÍLIA DE COMPOSIÇÕES PARAMETRIZADAS

Data: 2026-09-22  
Módulo: Remotion Architectural Video Engine  
Status: Produção / Integrado  

---

### 1. Diretriz Arquitetural
As composições de vídeo no ArqVertice Studio não são vídeos estáticos nem animações genéricas de redes sociais. Elas são **estruturas programáticas orientadas a dados (Data-Driven Compositions)** construídas sobre a filosofia de componentes React e motor de timeline determinístico Remotion.

Separamos estritamente:
$$\text{ProjectData (BIM/Interiores)} \longrightarrow \text{VideoBrief} \longrightarrow \text{Storyboard} \longrightarrow \text{Composição Remotion} \longrightarrow \text{Scenes} \longrightarrow \text{Render}$$

---

### 2. Contrato de Entrada: `ArchitecturalVideoData`
Toda composição consome exclusivamente o contrato unificado fornecido por `ProjectDataAdapter.extractFromProject(projectId, options)`:

```typescript
interface ArchitecturalVideoData {
  projectId: string;
  projectName: string;
  client: string;
  location: string;
  projectType: string;
  concept: string;
  environments: Array<{
    id: string;
    name: string;
    areaM2: number;
    renders: string[];
    materials: string[];
  }>;
  renders: Array<{
    id: string;
    url: string;
    environmentName: string;
    label: string;
  }>;
  plans: Array<{
    id: string;
    url: string;
    label: string;
  }>;
  materials: Array<{
    id: string;
    name: string;
    category: string;
    textureUrl: string;
  }>;
  texts: {
    title: string;
    subtitle: string;
    concept: string;
    closing: string;
    architect: string;
    contact: string;
  };
  logo: string;
  scenes: ArchitecturalScene[];
  audio: {
    trackUrl: string;
    volume: number;
    voiceoverUrl: string | null;
  };
  durationInFrames: number;
  durationSeconds: number;
  fps: number;
  dimensions: { width: number; height: number };
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  version: string;
}
```

---

### 3. As 10 Famílias de Composições Canônicas

1. **ARCHITECTURAL_CINEMATIC (Composição Master)**
   - Sequência: Logo/Intro $\rightarrow$ Concept $\rightarrow$ Renders de Fachada & Interiores $\rightarrow$ Detalhes $\rightarrow$ Encerramento Institucional.
   - Movimento: Câmera física sutil com *Push In* lento (1.00 $\rightarrow$ 1.05) e *Parallax* controlado.
   - Tipografia: Clean minimalista, alinhada à prancha arquitetônica e safe areas (90% action, 80% title).

2. **ARCHITECTURAL_WALKTHROUGH (Percurso Espacial)**
   - Sequência: Acesso Principal $\rightarrow$ Hall $\rightarrow$ Living $\rightarrow$ Varanda Gourmet $\rightarrow$ Área Íntima.
   - Movimento: Movimentos contínuos de translação lateral (*Pan*) simulando steadycam arquitetônica.

3. **INTERIOR_PRESENTATION (Foco em Ambientes)**
   - Sequência: Enquadramento Geral $\rightarrow$ Mobiliário Canônico $\rightarrow$ Iluminação e Acabamento.
   - Identificação: Rótulos técnicos com nome do ambiente e metragem quadrada em overlay não-invasivo.

4. **FACADE_PRESENTATION (Estudo Volumétrico)**
   - Sequência: Implantação e Entorno $\rightarrow$ Volumetria Global $\rightarrow$ Empena e Esquadrias $\rightarrow$ Crepúsculo.

5. **PLAN_TO_RENDER (BIM para Realidade)**
   - Sequência: Planta Técnica Humanizada $\rightarrow$ Zoom na zona de interesse $\rightarrow$ Dissolve suave para o render fotorealista correspondente.

6. **MATERIALITY_PRESENTATION (Texturas & Acabamentos)**
   - Sequência: Vista ampla $\rightarrow$ Enquadramento macro de madeira ripada, mármores e concreto $\rightarrow$ Especificação técnica legível.

7. **DAY_TO_NIGHT (Atmosferas de Iluminação)**
   - Sequência: Mesma angulação focal sob luz solar diurna transicionando para a cena noturna com projeto luminotécnico ativo.

8. **BEFORE_TO_PROPOSED (Retrofit e Reforma)**
   - Sequência: Estado existente $\rightarrow$ Cortina divisora linear $\rightarrow$ Proposta arquitetônica finalizada.

9. **ARCHITECTURAL_DETAIL (Marcenaria e Serralheria)**
   - Sequência: Detalhe construtivo executivo em foco nítido com tipografia institucional de especificações.

10. **PROJECT_COMMERCIAL (Apresentação Imobiliária)**
    - Sequência: Conceito $\rightarrow$ Diferenciais do empreendimento $\rightarrow$ Imagens de alto impacto $\rightarrow$ CTA e contatos comerciais.

---

### 4. Primitivas de Renderização Determinística
O módulo `video/components/architectural-components.js` implementa funções puras baseadas em interpolação linear sem efeitos de aceleração distorcida:

- `interpolate(frame, inputRange, outputRange, options)`: Interpolação estável com suporte a `clamp` estrito.
- `calculateCameraTransform(camera, progress)`: Gera translações e escalas sub-milimétricas compatíveis com lentes de 24mm a 50mm.
- `renderTitleBlock(videoData, options)`: Gera o selo técnico e prancha de identificação com dados do autor (ex: Pedro Albuquerque) e escritório ArqVertice.

---

### 5. Execução em Produção
A composição `ArchitecturalCinematicComposition` pode ser executada:
1. **No Navegador (React / Preview)**: Via componente interativo com controles de play, pause, scrubber de timeline e display de safe area.
2. **Headless (Node.js / CLI)**: Renderização frame-a-frame de alta precisão para exportação em MP4 com relatório de auditoria automática.
