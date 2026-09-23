# ArqVértice Studio — Motor de Perspectivas Humanizadas (D04)

> **Documento:** Arquitetura do Motor de Perspectivas Humanizadas de Apresentação  
> **Versão:** D04  
> **Módulo:** Visualização de Ambientes / Renderização Conceitual e de Apresentação  
> **Pré-requisitos:** BLOCO A, BLOCO B, C01 a C06, D01, D02, D03  

---

## 1. Visão Geral e Objetivo

O **Motor de Perspectivas Humanizadas (D04)** é o subsistema do ArqVértice Studio encarregado de transformar perspectivas brutas, modelos 3D volumétricos e imagens-base exportadas do Revit em imagens de apresentação humanizadas, fotorrealistas ou artísticas de alto impacto para clientes.

A perspectiva humanizada atua elevando:
1. **Ambientação:** Enriquecimento com elementos cotidianos que conferem vida e aconchego ao espaço.
2. **Materiais e Texturas:** Aplicação precisa de texturas, reflexos, rugosidades e acabamentos especificados no Memorial Descritivo (C04).
3. **Iluminação e Clima:** Definição rigorosa de luz solar natural, rebatimento, penumbra e luzes artificiais diretas/indiretas.
4. **Decoração e Objetos:** Adição harmônica de quadros, cortinas, tapetes, louças e livros conforme o Briefing (C01) e Conceito (C05).
5. **Vegetação e Paisagismo:** Inclusão de folhagens e plantas compatíveis com interiores e varandas.
6. **Presença Visual e Apresentação:** Composição visual equilibrada para apresentações comerciais e relatórios de projeto.

---

## 2. Ordem de Prioridade da Imagem-Base

Para garantir consistência com a engenharia e arquitetura reais, o motor prioriza estritamente os seguintes inputs de geometria:
1. **Perspectiva 3D do Revit** (câmera com distância focal e ângulo definidos no modelo BIM);
2. **Vista ou Enquadramento do Ambiente** (perspectiva interna gerada no projeto executivo);
3. **Elevação / Vista Frontal** (para validação de alinhamentos e marcenaria);
4. **Referência de Câmera Homologada** (posição e enquadramento cadastrados no módulo D01).

---

## 3. Matriz de Preservação e Camadas Editáveis

O princípio inviolável do D04 é: **a atmosfera ou a humanização nunca podem desconfigurar a arquitetura**.

### 3.1. Elementos Rigorosamente Preservados
A menos que expressamente ordenado pelo arquiteto responsável:
- **Arquitetura Geral:** Geometria dos vãos e pés-direitos.
- **Paredes:** Posição, espessura e prumos.
- **Aberturas:** Janelas, portas de correr, vãos de passagem e caixilharia.
- **Proporções:** Relação espacial e volumétrica entre ambientes e elementos.
- **Teto:** Forro de gesso, sancas ou laje aparente originais.
- **Piso:** Nível de piso e alinhamento de paginação estrutural.
- **Layout Fixo:** Posição de bancadas de pedra, ilhas, pilares e shaft hidráulico.

### 3.2. Camadas Editáveis e Sintetizáveis
Elementos passíveis de humanização controlada pela IA:
- **Mobiliário:** Sofás, poltronas, cadeiras, mesas de centro, marcenaria solta.
- **Decoração:** Almofadas, mantas, vasos, livros, luminárias decorativas.
- **Materiais de Acabamento:** Vernizes, tecidos, pedras nobres, marcenaria laminada.
- **Iluminação Cenográfica:** Fitas LED, spots embutidos, arandelas, luz de leitura.
- **Objetos e Humanização:** Louças, taças, esculturas, adornos.
- **Paisagismo:** Plantas de interior, vasos suspensos e jardineiras.

---

## 4. Síntese de Estilo e Contexto Estruturado

A geração de perspectivas não se baseia em prompts genéricos. Ela ingere contextualmente:
1. `PROJECT_CONTEXT`: Tipologia (`RESIDENCIAL`, `COMERCIAL`), estilo predominante (`MINIMALISTA`, `CONTEMPORANEO`), paleta de cores e memorial descritivo.
2. `ENVIRONMENT_CONTEXT`: Nome do cômodo, área em m², orientações solares, iluminação planejada e diretrizes técnicas.
3. `VISUAL_REFERENCE_SET`: Diretório de referências curadas pelo módulo D02, dando precedência absoluta àquelas marcadas como `PRIMARY`.

---

## 5. Parâmetros de Configuração do Motor

### 5.1. Níveis de Realismo
O nível de fidelidade visual é registrado explicitamente nos metadados da versão gerada:
- `APRESENTACAO`: Render estilizado, ideal para fases preliminares de estudo de massas e conceito.
- `REALISTA`: Balanceamento de texturas, luz e reflexos com renderização suave e acolhedora.
- `FOTOREALISTA`: Alta densidade de micro-detalhes, rugosidade de materiais, causticidade e rebatimento lumínico realista.
*(Nota: Os termos são declarados sem garantias incondicionais de perfeição óptica).*

### 5.2. Cenários de Iluminação
Permite simular o comportamento da luz natural e artificial:
- `DIA`: Luz solar direta e céu aberto;
- `MANHA`: Luz suave e dourada de início de manhã;
- `TARDE`: Luz quente de fim de tarde e sombras alongadas;
- `NOITE`: Predomínio de iluminação artificial cênica e externa escura;
- `ILUMINACAO_INTERNA`: Foco nas fontes artificiais diretas/indiretas;
- `ILUMINACAO_NATURAL_PREDOMINANTE`: Vãos amplificados com luz difusa de claraboias ou grandes janelas.

### 5.3. Atmosferas Sensoriais
Define a sensação arquitetônica do render:
- `ACONCHEGANTE`, `SOFISTICADA`, `NATURAL`, `CONTEMPORANEA`, `DRAMATICA`, `LEVE`, `OUTRA`.

---

## 6. Imutabilidade da Imagem-Base e Versionamento

- **Imutabilidade Absoluta:** O arquivo ou URL da perspectiva original exportada do Revit (`baseImageUrl`) nunca é substituído ou alterado.
- **Versionamento Ramificado:** A cada geração, cria-se uma versão incremental (`V01`, `V02`, `V03`...) ou variante (`V01.1-VAR`). Versões anteriores permanecem armazenadas para inspeção e auditoria.
- **Metadados Gravados:**
  - Versão e Data/Hora;
  - URL Base e URL Gerada;
  - Prompt Estruturado de Síntese;
  - Provedor e Modelo de IA (ex.: `Gemini Imagen 3 Architect Pro`);
  - Realismo, Iluminação e Atmosfera aplicados;
  - Lista de Elementos Preservados e Editáveis;
  - Histórico de Aprovação/Rejeição e Auditoria de Usuário.

---

## 7. Pipeline de Aprovação e `APPROVED_VISUAL_OUTPUT`

Quando uma perspectiva humanizada atinge a excelência esperada e é formalmente homologada:
1. Seu status migra de `DRAFT` para `APPROVED`.
2. Ela é automaticamente inserida na coleção global `APPROVED_VISUAL_OUTPUT` do projeto.
3. Um evento de memória institucional é gravado no módulo de Memória e Decisões (C06) com a tag `APPROVED_OUTPUT`.
4. A imagem passa a alimentar como fonte de verdade:
   - **Consistência Visual:** Vistas de outros ângulos do mesmo ambiente manterão os mesmos materiais e marcenaria.
   - **Moodboards Executivos:** Pranchas de apresentação estética para o cliente.
   - **Apresentações e Relatórios:** Exportações de book de projeto.
   - **Animações e Vídeos Futuros:** Base para renders dinâmicos (D06).

---

## 8. Ferramenta de Comparação

O workspace provê comparação lado a lado em tempo real:
- **Revit Base vs. Humanizada:** Demonstra o salto qualitativo da volumetria pura para o ambiente decorado e iluminado mantendo o mesmo enquadramento de câmera.
- **Versão vs. Versão:** Confronta variantes de acabamentos (ex.: marcenaria clara vs. marcenaria escura, dia vs. noite).

---

## 9. Arquitetura de Código

| Componente | Arquivo | Responsabilidade |
| :--- | :--- | :--- |
| **Schema SQL** | `database/schema/17_humanized_perspectives.sql` | Tabelas `humanized_perspectives`, `humanized_perspective_versions`, `approved_visual_outputs` |
| **Migration** | `database/migrations/0012_humanized_perspectives.sql` | Migração DDL estruturada |
| **Estado & Lógica** | `js/state.js` | Métodos `generateHumanizedPerspective`, `createPerspectiveVariation`, `approvePerspectiveVersion`, `getApprovedVisualOutputs` |
| **UI & Interação** | `js/humanized-perspective-module.js` | Interface visual, controle de câmeras, tags, modais de geração, aprovação e comparação |
| **Integração Workspace** | `js/environment-visualization-module.js` | Injeção da seção 4 integrada no Workspace D01 |
| **Estilos** | `styles.css` | Folha de estilos responsiva com temas escuro/claro |
| **Testes Automatizados** | `tests/humanized-perspective.test.js` | Suíte de testes unitários e de integração cobrindo os 6 pilares de teste |
