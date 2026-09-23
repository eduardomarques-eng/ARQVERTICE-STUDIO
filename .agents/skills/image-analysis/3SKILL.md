---
name: image-analysis
description: Análise multimodal de imagens arquitetônicas, renders 3D, consistência de iluminação e verificação de ruído.
---

# Image Analysis Skill

## Name
`image-analysis`

## Purpose
Inspecionar visualmente imagens de referências, renders fotorrealistas e plantas escaneadas, avaliando consistência de iluminação (orientação solar, sombras suaves), textura de materiais, ruído de amostragem e realismo volumétrico.

## Trigger
- Conclusão de novo render gerado pelo motor ou provedor generativo.
- Upload de foto ou referência pelo arquiteto ou cliente.
- Comando: "analise esta imagem", "verifique a iluminação deste render", "inspecione a qualidade da foto".

## Inputs
- Buffer ou URL da imagem de alta resolução.
- Metadados do ambiente associado (estilo, materiais aplicados, período do dia).

## Context
Carrega `MEDIA_CONTEXT` e memórias do ambiente ativo.

## Workflow
```text
INPUT (Imagem e metadados arquitetônicos)
  ↓
LIGHTING & EXPOSURE AUDIT (Avaliação de clipping de brancos e pretos estourados)
  ↓
MATERIAL FIDELITY (Coerência de reflexos em vidros, veios de madeira e polimento de pedras)
  ↓
PERSPECTIVE CONSISTENCY (Pontos de fuga alinhados sem aberrações ópticas)
  ↓
RENDER QUALITY SCORE (Nota objetiva e pontos de refinamento)
```

## Tools
- `js/ai-foundation.js` (`AICapability.VISION_ANALYSIS`)
- `js/camera-system-module.js`

## Constraints
- Análise estritamente arquitetônica e técnica; não emitir juízos de gosto puramente subjetivos.
- Avaliar conformidade com a paleta mineral do projeto.

## Output
Laudo `ImageAnalysisReport`:
- `lightingAssessment`: avaliação de sol e contraste ambiente.
- `materialRealismScore`: pontuação de 0 a 100 de fotorrealismo.
- `recommendedPromptAdjustments`: sugestões para refinar o prompt do renderizador.

## Validation
- Presença de metadados mínimos de resolução e formato da imagem.

## Failure Modes
- Se a imagem estiver corrompida ou inacessível, retornar erro `IMAGE_UNREADABLE` com log de diagnóstico.
