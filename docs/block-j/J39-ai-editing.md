# J39 — ARQVERTICE AI 3D COMMAND ENGINE & SAFE EDITING

## 1. Visão Geral e Diretriz de Segurança

A IA **NUNCA** edita diretamente vértices ou matrizes da malha 3D sem uma camada determinística intermediária.

```
USER INSTRUCTION
  ↓
NATURAL LANGUAGE PARSER
  ↓
STRUCTURED 3D COMMAND
  ↓
VALIDATION & AMBIGUITY RESOLVER
  ↓
CHANGE SET & DIFF PREVIEW
  ↓
DETERMINISTIC 3D COMMAND ENGINE (UNDO/REDO)
  ↓
SCENE GRAPH & RENDERER
```

---

## 2. Ações 3D Estruturadas Suportadas

O motor aceita comandos com gramática rigorosa:
- `select`: Seleção de elementos por categoria, ambiente ou nome.
- `hide` / `show`: Controle de visibilidade.
- `move` / `rotate` / `scale`: Transformações afins paramétricas.
- `changeMaterial` / `changeTexture`: Alteração de acabamentos e materiais PBR.
- `duplicate` / `delete`: Criação e remoção segura (com trava estrutural).
- `replaceAsset`: Substituição de ativo por equivalente do catálogo.
- `isolate` / `focus` / `measure`: Navegação e inspeção.

---

## 3. Resolução de Ambiguidades e Pre-Flight Validation

Quando a instrução natural é ambígua (ex: *"troque o tecido do sofá"* e há 2 sofás na sala):
- O motor **NUNCA** escolhe arbitrariamente.
- Retorna status `AMBIGUOUS` com lista de candidatos e mensagem de esclarecimento:
  `"Encontrei 2 sofás na sala (Sofá Modular e Sofá 2 Lugares). Qual deseja alterar?"`

---

## 4. Salvaguardas Mandatórias (AI Safety)

1. **Proteção Estrutural**: Componentes com `isStructural: true` não podem ser excluídos via comando de IA sem aprovação do calculista.
2. **Preservação de Fontes**: Os arquivos brutos originais (`SOURCE`) nunca são sobrescritos.
3. **Diffs e Transações Reversíveis**: Toda operação gera um registro de `before` e `after`, permitindo `undo` e `redo` instantâneos.
