# ArqVértice Studio — Módulo de Estudos Preliminares (Bloco C03)

## 1. Visão Geral e Filosofia

O módulo de **Estudos Preliminares (Bloco C03)** constitui o workspace analítico de exploração espacial e formal da ArqVértice. Seu papel primordial é organizar, testar e comparar alternativas arquitetônicas fundamentadas nas diretrizes consolidadas no **Briefing Técnico Interno (C01)** e nas informações geométricas e de campo reunidas no **Levantamento (C02)**.

### Princípios Inegociáveis
1. **Não Substitui o Autodesk Revit:** O Revit continua sendo o motor de modelagem da informação da construção (BIM). O ArqVértice Studio atua como o ambiente de inteligência de negócio, governança de dados e tomada de decisão estratégica.
2. **Não Tenta Automatizar Toda a Arquitetura:** A concepção arquitetônica exige julgamento sensível, técnico e espacial.
3. **A IA Não Decide a Solução:** A inteligência artificial pode resumir prós e contras, estruturar variantes e verificar interferências de briefing, mas **jamais seleciona a melhor alternativa** de forma autônoma. A decisão pertence exclusivamente aos arquitetos da ArqVértice e ao cliente.

---

## 2. Tipos e Categorias de Estudo

O sistema suporta 11 categorias canônicas de estudos técnicos:

| Categoria | Identificador | Escopo Arquitetônico |
| :--- | :--- | :--- |
| **Layout / Espacial** | `LAYOUT` | Distribuição de ambientes, setorização social/íntima/serviço, e integração de plantas. |
| **Circulação & Fluxos** | `CIRCULACAO` | Rotas de circulação vertical e horizontal, acessibilidade, fluxos de serviço vs. convívio. |
| **Volumetria & Massas** | `VOLUMETRIA` | Proporções tridimensionais, gabarito, balanços estruturais e relação com a topografia. |
| **Fachada & Envoltória** | `FACHADA` | Brises, envoltória térmica, planos de vidro, esquadrias e composição plástica. |
| **Interiores** | `INTERIORES` | Espacialidade interna, forros, paginação de piso e ambiência geral. |
| **Materialidade** | `MATERIALIDADE` | Paletas táteis, contrastes concreto vs. madeira, resistência à intempérie / maresia. |
| **Iluminação** | `ILUMINACAO` | Aproveitamento de luz natural zenital/lateral, sombras e cenários de iluminação artificial. |
| **Mobiliário** | `MOBILIARIO` | Marcenaria sob medida, posicionamento ergonômico e especificações de layout. |
| **Paisagismo** | `PAISAGISMO` | Integração biofílica, áreas permeáveis, arborização de sombreamento e taludes. |
| **Área Externa** | `AREA_EXTERNA` | Lazer, decks de madeira ecológica, piscinas de borda infinita e pérgulas. |
| **Outro** | `OUTRO` | Estudos específicos (acústica especial, ensaios de sustentabilidade, etc.). |

---

## 3. Estrutura de Dados do Estudo

Cada estudo preliminar possui:
- `id`: Identificador único (`std-...`).
- `projectId`: ID do projeto proprietário.
- `environmentId`: ID do ambiente vinculado (ou `null` para estudo macro de todo o projeto).
- `title`: Título descritivo do estudo.
- `category`: Uma das 11 categorias descritas acima.
- `description`: Contextualização técnica do estudo.
- `objective`: Qual problema arquitetônico ou espacial deve ser solucionado.
- `hypothesis`: Hipótese formal ou funcional testada.
- `progress`: Progresso da elaboração (0%, 25%, 50%, 75%, 100%). O progresso **não se confunde com aprovação**.
- `version`: Versão do estudo (ex: `V01`, `V02`).
- `status`: Ciclo de vida (`DRAFT`, `IN_PROGRESS`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `SUPERSEDED`).
- `isRevitDeveloped`: Flag booleana indicando se o estudo teve sua origem ou volumetria modelada no Revit.
- `revitViewName` & `revitNotes`: Identificação de pranchas, vistas 3D ou Design Options no Revit.
- `alternatives`: Lista de alternativas arquitetônicas comparáveis (Alternativa A, B, C...).
- `decision`: Registro formal da escolha tomada pelo arquiteto responsável.
- `forwardedToConcept`: Flag booleana indicando se o estudo foi promovido para a etapa subsequente de **Conceito**.

---

## 4. Integração com o Autodesk Revit

O módulo estabelece rastreabilidade bidirecional com o modelo do Revit:
- Identifica se a geometria de uma alternativa provém de opções de projeto (`Design Options`) ou vistas 3D dedicadas (`{3D} Opcao A`).
- Anexa imagens e perspectivas exportadas do modelo BIM.
- Preserva a nomenclatura das vistas para que o projetista localize imediatamente as opções no modelo `.rvt`.

---

## 5. Rastreabilidade de Autoria

Cada alternativa ou elemento de estudo registra sua fonte de concepção através do enum `authorship`:
1. `CRIADO_PELA_ARQVERTICE`: Estudo e modelagem originais desenvolvidos pelo time da ArqVértice.
2. `IMPORTADO`: Elemento herdado de projetos correlatos, arquitetura de parceiros ou cliente.
3. `REFERENCIA_EXTERNA`: Imagem de referência ou benchmark de arquitetura externa.
4. `GERADO_POR_IA`: Esquema ou imagem gerada com assistência de algoritmos generativos.
