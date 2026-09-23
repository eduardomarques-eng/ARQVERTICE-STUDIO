# DIRETRIZES GERAIS E OPERACIONAIS — ARQVERTICE STUDIO

## 1. Princípio de Não-Perda (Preservação Ativa)
- Não descartar nem apagar funcionalidades existentes para "simplificar" código.
- Identificar e documentar dependências antes de qualquer modificação.
- Histórico Git preservado integralmente.
- Nenhuma chave, credencial ou DATABASE_URL exposta no código frontend.

## 2. Relação com Ferramentas Técnicas (Revit / BIM)
- O Revit é o ambiente central de modelagem arquitetônica, geometria técnica, documentação, plantas técnicas, cortes e fachadas.
- O ARQVERTICE STUDIO interpreta, organiza, humaniza, ambienta, apresenta e acompanha o ciclo do projeto — **não** substitui o Revit nem tenta recriar um CAD/BIM do zero.

## 3. Estrutura por Ambientes e Memória Contextual
- Todo projeto organiza-se por ambientes (ex.: Sala, Cozinha, Suíte, Deck, etc.).
- Cada ambiente carrega seu próprio contexto (planta de referência, perspectivas, câmeras, materiais, mobiliário, locks, decisões, versões).
- A IA opera com **Memória Multicamada** (Projeto, Ambiente, Imagem, Versão, Decisões e Locks), assegurando consistência visual e volumétrica em iterações pontuais (ex.: "trocar apenas o sofá").

## 4. Briefing Integrado (Cliente e Interno)
- **Briefing Externo:** Link público/único, preenchimento pelo cliente sem acesso ao painel administrativo.
- **Briefing Interno:** Consolidação técnica dos dados do cliente para guiar arquitetura, interiores, estudos e compras.

## 5. Cronograma e Eventos de Projeto
- O cronograma existente em `cronograma-residencia-praia` é a base funcional.
- Eventos de projeto (briefing aprovado, render validado, revisão aberta, entrega) devem se comunicar com o cronograma.

## 6. Padronização Visual e Apresentação
- Identidade visual refinada e profissional da ArqVertice.
- Suporte a pranchas de apresentação (A4, A3, A2, A1) com carimbos, escalas e diagramação profissional.
