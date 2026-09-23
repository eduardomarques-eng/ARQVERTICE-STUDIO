# Roteamento Multimodal e Motor Jev

O **MultimodalRouterJev** atua como árbitro de decisão ultrarrápida do ArqVértice Studio. Seu propósito é traduzir a intenção do arquiteto em um plano de execução perfeitamente delimitado entre ferramentas, modelos e formatos, prevenindo alucinações e comandos perigosos.

---

## 1. Fluxo de Política Rigoroso

```text
Input (Texto + Arquivo/Mídia)
             ↓
    Jev Decision Engine
             ↓
     Escolha Delimitada
             ↓
   Cálculo de Confiança
             ↓
     Safety / Policy Check
             ↓
       Despacho de Rota
             ↓
    Execução Sandboxed
```

**Regra Absoluta:** O Jev nunca executa uma ação de forma arbitrária; ele decide exclusivamente entre categorias e contratos pré-registrados.

---

## 2. Domínios de Decisão Delimitados

- **Classes de Tarefas:** `3D_GENERATION`, `CAD_EDIT`, `IMAGE_EDIT`, `BIM_QUERY`, `DRAWING_ANALYSIS`, `BLENDER_COMPOSE`, `VIDEO_COMPOSE`, `DOCUMENT_EXTRACT`, `GENERAL_REASONING`.
- **Ferramentas Alvo:** `VisionTools`, `ImageTools`, `ThreeDTools`, `BlenderTools`, `CADTools`, `BIMTools`, `DrawingTools`, `DocumentTools`, `VideoTools`, `FileTools`.
- **Níveis de Qualidade:** `draft`, `interactive`, `high`, `render`, `production`.
- **Formatos de Saída:** `GLB`, `STEP`, `IFC`, `PNG`, `SVG`, `MP4`, `JSON`.

---

## 3. Matriz de Políticas e Gates de Confiança

1. **Autônomo Permitido (`confidence >= 0.75`)**: Execução direta em ferramentas `READ_ONLY` ou `REVERSIBLE`.
2. **Revisão Obrigatória (`0.50 <= confidence < 0.75`)**: Pausa para validação do usuário antes de iniciar pipelines pesados.
3. **Bloqueio de Baixa Confiança (`confidence < 0.50`)**: Interrupção com solicitação de esclarecimento ao arquiteto.
4. **Gate Destrutivo**: Ações classificadas como `DESTRUCTIVE` (ex: exclusão de sólidos CAD ou descarte de pranchas) obrigatoriamente acionam o modal de confirmação humana.
