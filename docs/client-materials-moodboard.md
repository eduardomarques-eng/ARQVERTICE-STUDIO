# Área Visual para Materiais, Mobiliário e Moodboard (H10)

## 1. Visão Geral e Integração com o Bloco E
O módulo **H10** integra o Portal do Cliente ao catálogo e às especificações do **Bloco E** (Materiais, Mobiliário e Moodboards), apresentando de forma atraente e intuitiva os revestimentos nobres, peças de design e composições conceituais aprovadas para cada ambiente do projeto.

---

## 2. Ficha Técnica de Materiais e Acabamentos
Para cada material publicado com `clientVisible: true`, a interface exibe:

- **Imagem**: Amostra fotorrealista da textura ou foto do produto aplicado.
- **Nome**: Nomenclatura comercial ou descritiva (ex: *Mármore Travertino Navona Levigado*).
- **Categoria**: Pedra, Madeira, Porcelanato, Tinta, Tecido, Metal, etc.
- **Fabricante**: Marca produtora homologada.
- **Código de Referência**: Código do catálogo ou referência do produto.
- **Acabamento**: Fosco, polido, escovado, acetinado, natural.
- **Cor / Tonalidade**: Paleta de cor nominal.
- **Observações Técnicas**: Instruções de aplicação e manutenção.
- **Ambiente**: Espaço projetado a que o material se destina.

---

## 3. Ficha Técnica de Mobiliário e Decoração
Para cada peça de mobiliário publicada:

- **Imagem**: Fotografia da peça ou render 3D em isolamento.
- **Nome**: Título do móvel (ex: *Sofá Living 3 Lugares com Chaise*).
- **Categoria**: Sofá, Poltrona, Mesa de Jantar, Cadeira, Luminária, Marcenaria Sob Medida.
- **Referência / Modelo**: Código do fabricante ou modelo comercial.
- **Dimensões**: Largura × Profundidade × Altura (em cm).
- **Ambiente**: Setorização arquitetônica da peça.

---

## 4. Proteção contra Vazamento de Dados Internos

> [!WARNING]
> **Salvaguarda Comercial Estrita:**
> Informações marcadas como internas (`isInternalOnly: true`, `isInternalSupplier: true`) têm seus campos de **Preço** e **Fornecedor** rigorosamente mascarados antes de qualquer renderização no portal do cliente.

- Preços brutos, margens, condições comerciais e fornecedores confidenciais permanecem exclusivos da equipe de suprimentos e arquitetura no estúdio.

---

## 5. Pranchas de Moodboard Integradas
A seção de moodboards consolida visualmente a narrativa estética de cada ambiente:

- **Composição**: Imagem de fundo/hero + Amostras de materiais + Peças de mobiliário + Ambiente.
- **Interação**: Visualização da prancha, inserção de comentários (H11) e solicitação formal de ajuste (H12).
- **Imutabilidade**: O cliente não pode alterar diretamente o cadastro interno de produtos ou fornecedores do estúdio.
