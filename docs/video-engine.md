# ArqVértice Video Engine — Documentação Técnica (Bloco G)

## 1. Visão Geral

O **ArqVértice Video Engine** é a plataforma profissional de composição, preview, variação e renderização de vídeos arquitetônicos do ArqVertice Studio.

O vídeo atua como uma **nova camada de apresentação** sobre o projeto técnico (BIM, 3D, especificações, memoriais e pranchas), sem transformar o estúdio em um editor genérico de mídia ou competir com ferramentas de edição não-linear.

### Pilares Fundamentais:
- **REMOTION**: Motor principal de composição e renderização programática determinística baseada em frames.
- **REACT**: Camada de interface, controle e parametrização sem duplicar frontend ou design system.
- **REMOTION SKILL**: Referência técnica instalada em `.agents/skills/remotion/SKILL.md`.
- **PROJETO ARQUITETÔNICO**: Fonte da verdade inegociável. O vídeo consome o projeto real (`prj-praia-01` — Residência de Praia, Pedro Albuquerque).
- **FLUXO SECUNDÁRIO MANUAL / HÍBRIDO**: Capacidade de importar vídeos editados externamente (Premiere, DaVinci Resolve, CapCut) e fundir vídeo gravado com *motion graphics* e carimbo institucional Remotion.
- **QA AUDIOVISUAL (G14)**: Auditoria obrigatória em 13 checkpoints com bloqueio de exportação se houver falhas críticas.

---

## 2. Estrutura de Arquivos e Pastas

```
c:\Users\erick\ARQVERTICE-STUDIO
│
├── .agents/
│   └── skills/
│       └── remotion/
│           └── SKILL.md                  <-- Remotion Skill Oficial
│
├── video/
│   ├── types/
│   │   └── architectural-video-types.js  <-- Contratos, templates e movimentos de câmera
│   ├── adapters/
│   │   └── project-data-adapter.js       <-- Adapter de dados do StudioState -> Remotion
│   ├── components/
│   │   └── architectural-components.js   <-- Primitivas de interpolação, câmera e carimbo
│   ├── compositions/
│   │   └── architectural-cinematic.js    <-- Composição Master Cinematográfica
│   └── render/
│       └── remotion-engine.js            <-- Player interativo, headless render e fluxos híbridos
│
└── docs/
    ├── video-engine.md                   <-- Esta documentação
    ├── video-compositions.md             <-- Guia de composições
    └── video-templates.md                <-- Catálogo dos 10 templates canônicos
```

---

## 3. Fluxo Principal: Programático (React + Remotion)

```
PROJETO ARQUITETÔNICO (prj-praia-01)
     ↓
DADOS DO PROJETO & ASSETS (Renders, Ambientes, Memorial)
     ↓
PROJECT DATA ADAPTER (video/adapters/project-data-adapter.js)
     ↓
COMPOSIÇÃO REMOTION (ArchitecturalCinematicComposition)
     ↓
PREVIEW INTERATIVO (RemotionVideoEngine.mountPlayer)
     ↓
RENDER REMOTION (executeRender -> MP4)
     ↓
CONTROLE DE QUALIDADE (G14 - 13 Checkpoints)
     ↓
EXPORTAÇÃO & VERSIONAMENTO (v1.0, v1.1...)
```

---

## 4. Fluxo Secundário: Manual & Híbrido

### Fluxo Manual:
1. Exportação do briefing ou storyboard para a equipe de edição externa.
2. Produção em software de preferência (Premiere, DaVinci Resolve, CapCut).
3. Importação do arquivo final via `RemotionVideoEngine.importManualVideo(...)`.
4. Registro do asset com metadados técnicos (editor de origem, codec, resolução).
5. Execução do QA Audiovisual (G14) e emissão de versão oficial.

### Fluxo Híbrido:
1. O usuário fornece um vídeo pré-renderizado ou filmagem de drone/obra.
2. O Remotion aplica carimbo institucional, letreiros arquitetônicos, vinheta de abertura e legendas de ambientes parametrizadas.
3. Exportação unificada através de `RemotionVideoEngine.composeHybridVideo(...)`.

---

## 5. Garantia de Não-Regressão

O Video Engine foi desenvolvido como uma extensão cirúrgica e não-destrutiva:
- Mantém o servidor `server.js` em funcionamento sem dependências conflitantes.
- Preserva todos os módulos anteriores (Briefing, Levantamento, Estudos, Conceito, 3D, Especificações, Pranchas, G01 a G14).
- 100% dos testes unitários e de integração continuam passando com sucesso.
