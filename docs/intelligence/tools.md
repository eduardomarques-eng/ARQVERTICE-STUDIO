# Catálogo Unificado de Ferramentas e Contratos

A camada de ferramentas do ArqVértice (`js/multimodal-tool-registry.js`) unifica todas as capacidades do estúdio sob contratos estritos e padronizados, garantindo previsibilidade, validação de esquemas e rastreabilidade total.

---

## 1. O Contrato de Ferramenta

Toda ferramenta registrada no sistema obrigatoriamente declara os seguintes campos contratuais:

```json
{
  "name": "nome_unico_da_ferramenta",
  "category": "VisionTools | ImageTools | ThreeDTools | BlenderTools | CADTools | BIMTools | DrawingTools | DocumentTools | VideoTools | FileTools",
  "description": "Explicação detalhada da finalidade e efeitos colaterais",
  "inputSchema": { "required": ["arg1", "arg2"], "properties": {} },
  "outputSchema": { "properties": {} },
  "permissions": ["read", "write", "network", "filesystem"],
  "risk": "READ_ONLY | REVERSIBLE | SENSITIVE | DESTRUCTIVE",
  "reversible": true,
  "timeout": 30000
}
```

---

## 2. Categorias Oficiais

1. **VisionTools**: Inspeção de imagens, identificação de objetos, relações espaciais e OCR de pranchas.
2. **ImageTools**: Inpainting arquitetônico, substituição de materiais, segmentação SAM3 e super-resolução.
3. **ThreeDTools**: Geração de malhas neurais via TRELLIS.2, decimação poligonal e validação manifold.
4. **BlenderTools**: Composição de câmeras, iluminação Cycles e unwrap UV via Blender MCP.
5. **CADTools**: Edição de parâmetros em árvores de features, restrições e recomputação FreeCAD.
6. **BIMTools**: Extração de quantitativos NBR, checagem de regras e propriedades de elementos IFC.
7. **DrawingTools**: Extração de primitivas vetoriais em DXF, DWG e SVG.
8. **DocumentTools**: Parsing de memoriais descritivos em PDF e tabelas de acabamentos.
9. **VideoTools**: Síntese de animações e flythroughs com Remotion.
10. **FileTools**: Empacotamento de pranchas e exportação de pacotes de projeto.

---

## 3. Isolamento Sandboxed

A execução de qualquer ferramenta ocorre encapsulada em um wrapper que assegura:
- Limite estrito de tempo de execução (`timeout`).
- Validação automática de parâmetros de entrada antes da chamada.
- Captura resiliente de exceções com fallback sem interrupção da aplicação.
- Registro instantâneo de auditoria contendo duração em milissegundos e resultado.
