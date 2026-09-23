# ArqVértice Studio — Sistema de Moodboard Visual e Técnico (E04)

## 1. Visão Geral e Propósito

O módulo **E04 — Moodboard Visual e Técnico** do ArqVértice Studio unifica a composição sensorial/conceitual do projeto arquitetônico com o rigor documental e executivo de especificações técnicas.

Tradicionalmente na prática arquitetônica, moodboards conceituais ficam isolados em ferramentas gráficas (Canva, Photoshop, InDesign), desconectados dos materiais reais, das tabelas de quantitativos e das peças de mobiliário aprovadas. O ArqVértice Studio resolve essa fragmentação através de um sistema de composição inteligente baseado em blocos (`Block Engine`), diretamente conectado à base de dados de:
- **E01**: Mobiliário, marcenaria e peças soltas.
- **E02**: Materiais, revestimentos, acabamentos e fornecedores.
- **E03**: Quantitativos calculados/medidos e fatores de perda.
- **D01–D09**: Perspectivas fotorrealistas e renders homologados.

---

## 2. Tipos de Moodboard Suportados

O sistema disponibiliza 6 tipologias formais de moodboard:

1. **`MOODBOARD_ENVIRONMENT` (Moodboard do Ambiente)**:
   - Focado em um ambiente individual (ex: Sala de Estar, Cozinha Gourmet, Suíte Master).
   - Inclui o render aprovado em destaque, amostras dos materiais aplicados no piso/parede/bancada, móveis especificados, paleta cromática e resumo de quantitativos.

2. **`MOODBOARD_PROJECT` (Moodboard Global do Projeto)**:
   - Ambiência de toda a residência ou edifício.
   - Conceito diretor da arquitetura, linguagem espacial unificada, paleta mestra e grandes referências visuais.

3. **`MOODBOARD_MATERIAL` (Moodboard de Materiais / Material Board)**:
   - Prancha com foco nas texturas minerais, lâminas de madeira, metais e tecidos.
   - Detalha códigos comerciais, fabricantes, fornecedores e acabamentos.

4. **`MOODBOARD_FURNITURE` (Moodboard de Mobiliário / FF&E Board)**:
   - Prancha dedicada a móveis soltos, marcenaria e iluminação decorativa.
   - Dimensões (L x P x A), quantidade, fornecedores e referências de catálogo.

5. **`MOODBOARD_CONCEPT` (Moodboard Conceitual)**:
   - Fase inicial de estudos preliminares e alinhamento de sensações com o cliente.
   - Imagens inspiracionais, croquis, paletas conceituais e declaração de intenções.

6. **`MOODBOARD_CUSTOM` (Moodboard Personalizado)**:
   - Composição livre para reuniões especiais com clientes ou apresentações temáticas.

---

## 3. Variantes de Exibição

O operador do ArqVértice Studio pode alternar entre duas variantes visuais sem perder os dados de configuração da prancha:

- **Apresentação Visual (`HYBRID / VISUAL`)**:
  - Destaque para imagens em alta resolução, render aprovado como *Hero Image*, chips cromáticos de paleta e composições harmônicas.
  - Indicado para reuniões de encantamento com o cliente.

- **Ficha Técnica Documental (`TECHNICAL`)**:
  - Foco em tabelas de especificação, códigos SKU, fornecedores, links para catálogos técnicos, quantitativos de compra e observações de obra.
  - Indicado para envio a construtoras, orçamentistas e fornecedores.

---

## 4. Governança e Ciclo de Aprovação

O ciclo de vida de um moodboard segue a rígida governança do ArqVértice:

1. **`DRAFT` (Rascunho)**:
   - Permite adicionar, remover, reordenar e editar itens livremente.
2. **`IN_REVIEW` (Em Revisão)**:
   - Apresentado ao arquiteto titular ou submetido à validação preliminar.
3. **`APPROVED` (Aprovado / Homologado)**:
   - Status oficial de aprovação.
   - **Regra de Proteção (Item 17)**: *Não é permitido editar silenciosamente um moodboard aprovado*. Qualquer tentativa de alteração resulta em exceção ou exige a criação de uma nova revisão (`versionMoodboard`).
   - Alimenta automaticamente o histórico de memória do projeto (`projectMemories`) e serve de contexto permanente para futuras análises de IA.
4. **`SUPERSEDED` (Superado)**:
   - Versões anteriores congeladas para auditoria histórica.
