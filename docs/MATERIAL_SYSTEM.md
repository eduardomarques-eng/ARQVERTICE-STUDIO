# ArqVértice Studio — Sistema de Materiais, Revestimentos e Especificações (Bloco E02)

## 1. Visão Geral e Propósito

O **Bloco E02** estabelece a infraestrutura técnica de especificação de acabamentos, materiais construtivos e superfícies para todos os ambientes e projetos do ArqVértice Studio.

O sistema trabalha de forma contextualizada e hierárquica:
```text
PROJETO (Ex: Residência de Praia)
└── AMBIENTE (Ex: Living / Sala de Estar)
    ├── APLICAÇÃO: PISO
    │   ├── Conceito: Mármore Travertino Navona Levigado
    │   └── Produto: Mármore Romano 100x100cm (Granitos do Ceará) [APPROVED]
    ├── APLICAÇÃO: PAREDE / PAINEL
    │   ├── Conceito: Lâmina Natural de Carvalho Americano [APPROVED]
    │   └── Produto: A definir na cotação de marcenaria sob medida
    └── APLICAÇÃO: PINTURA
        ├── Conceito: Pintura Acrílica Mineral Areia Suave
        └── Sugestão IA: Detectado em render com rotulação AI_SUGGESTION
```

---

## 2. Princípio da Separação entre Conceito e Produto

> [!IMPORTANT]
> **O sistema NUNCA presume um produto específico comercial a partir de um material conceitual.**

- **Material Conceitual:** Define a intenção arquitetônica, atmosfera, tonalidade e linguagem (ex: *"porcelanato cinza cimentício acabamento natural"*).
- **Produto Específico:** Define o item comercial com fabricante homologado, código/SKU, dimensões exatas de corte, fornecedor regional e cotação de preço (ex: *"Porcelanato Portobello Linha Nord Cement 120x120cm Nat Ret Cód. 201445E"*).

Um material pode nascer e ser aprovado como conceito arquitetônico, sendo vinculado a um produto de catálogo comercial no momento em que a especificação executiva for concluída.

---

## 3. Diretrizes de IA Visual e Anti-Alucinação

- Ao inspecionar um render ou fotografia, a visão computacional sugere termos conceituais aparentes (ex: *"pedra natural clara serrada"*).
- A IA **jamais** afirma autonomamente marcas comerciais (ex: *"Mármore X da Marmoraria Y"*) sem comprovação documental.
- Todas as detecções recebem o status `SUGGESTED` e origem `IA` (`is_ai_suggestion: true`), demandando avaliação humana expressa:
  1. **`CONFIRMAR`**: Valida a sugestão e transforma em especificação do projeto.
  2. **`EDITAR`**: Ajusta acabamentos, dimensões e fabricantes.
  3. **`IGNORAR`**: Descarta a sugestão registrando o motivo técnico no histórico.

---

## 4. Integração com a Memória Visual (C02, D06, D07)

Os materiais com status `APPROVED` alimentam automaticamente o contexto visual do ambiente:
- Entram como restrições rígidas (`MATERIALS_LOCK`) para impedir que novas gerações de render alterem indevidamente pisos, painéis de madeira ou bancadas já homologadas com o cliente.
