# ARQVERTICE STUDIO — DICIONÁRIO DE PERGUNTAS E SCHEMA DO BRIEFING
## CATÁLOGO DAS 10 ETAPAS E 32 PERGUNTAS CANÔNICAS

**Documento:** docs/BRIEFING_QUESTIONS.md  
**Status:** Implementado em `js/briefing-schema.js`  

---

### 1. ESTRUTURA DAS 10 ETAPAS (SECTIONS)

| Etapa | ID | Título | Foco de Investigação |
| :--- | :--- | :--- | :--- |
| **01** | `identificacao` | Identificação | Nome do titular, e-mail, telefone/WhatsApp, tipologia e localização da obra. |
| **02** | `perfil` | Perfil dos Moradores | Dinâmica familiar, idades, hobbies, pets e necessidades de acessibilidade/saúde. |
| **03** | `rotina` | Rotina & Convivência | Horários semanais, home office, estilo e frequência de recepção de convidados. |
| **04** | `terreno` | O Terreno ou Imóvel | Documentação existente, regras condominiais e aspectos valorizados no lote. |
| **05** | `ambientes` | Programa de Ambientes | Seleção dos cômodos indispensáveis, nível de integração social e sonhos. |
| **06** | `estilo` | Estilo & Estética | Seleção visual ilustrada de estilos arquitetônicos e paleta cromática. |
| **07** | `materiais` | Materiais & Rejeições | Texturas amadas e identificação explícita de materiais/cores que o cliente DETESTA. |
| **08** | `conforto` | Iluminação & Tecnologia | Temperatura de cor da luz (quente, fria, mista) e grau de automação residencial. |
| **09** | `investimento` | Orçamento & Referências | Faixa financeira estimada, prazos limites e upload de pranchas/fotos. |
| **10** | `revisao` | Revisão & Submissão | Painel com resumo integral de respostas e botão de envio definitivo. |

---

### 2. TIPOS DE PERGUNTAS SUPORTADOS NO MOTOR

- `texto`: Campo curto para dados objetivos.
- `email`: Campo com validação sintática de e-mail.
- `longo`: Área de texto multilinhas para descrições de rotina e desejos.
- `radio`: Escolha única com tiles interativos.
- `checkbox`: Múltipla escolha em caixas de seleção.
- `cartoes`: Alternativas visuais ricas com fotografias de projetos reais, ícones e descrições espaciais.
- `upload`: Dropzone com drag-and-drop para múltiplos arquivos de imagens e pranchas.
