# ARQVERTICE STUDIO — BRIEFING TÉCNICO INTERNO (BLOCO C01)
## GUIA DE ESPECIFICAÇÃO, DIRETRIZES E OPERAÇÃO TÉCNICA

**Versão:** C01  
**Estágio do Fluxo:** Pós-Aprovação do Briefing do Cliente $\to$ Pré-Levantamento (C02)  
**Status:** Implementado, Testado e Homologado  
**Público-Alvo:** Equipe de Arquitetura, Engenharia e Coordenação da ArqVértice  

---

### 1. OBJETIVO DO BLOCO C01

O **Briefing Técnico Interno** é a primeira etapa profissional da ArqVértice executada imediatamente após a homologação do questionário pelo cliente. 

Seu objetivo fundamental é **transformar as respostas brutas e aspirações do cliente em um documento de trabalho estruturado, técnico e executável**, servindo de base sólida para os levantamentos (C02), estudos preliminares, modelagem Revit/BIM e desenvolvimento do projeto.

#### Princípios Centrais de Integridade:
1. **Inviolabilidade dos Fatos Originais:** O briefing preenchido pelo cliente no portal público (`briefing.html`) permanece como a fonte primária inalterável. Nenhuma resposta é sobrescrita, apagada ou manipulada.
2. **Separação Rigorosa entre Fato e Interpretação:** O que o cliente declarou é tratado como fato bruto (`CLIENTE`). O que a equipe da ArqVértice propõe é tratado como interpretação técnica (`ARQVERTICE`).
3. **Rastreabilidade Universal de Origem (Provenance):** Cada requisito, diretriz, restrição ou anotação possui metadados de procedência (`source_type`, `source_id`, `source_version`).
4. **Governança de Inteligência Artificial:** A IA atua apenas como assistente analítico. Todas as suas sugestões recebem a identificação obrigatória `AI_SUGGESTION` e jamais são promovidas a fatos confirmados sem validação do arquiteto.
5. **Aprovação Interna e Snapshots Imutáveis:** A aprovação formal do briefing técnico gera versões congeladas (`TECHNICAL_BRIEF_V01`, `V02`...) que garantem auditoria e estabilidade antes do início da modelagem.

---

### 2. O FLUXO DO PROJETO NA ARQVÉRTICE

```
BRIEFING CLIENTE (Bloco B)
      ↓ (Preenchimento no portal público /briefing.html?token=...)
SUBMISSÃO DO CLIENTE
      ↓ (Geração de snapshot imutável do envio)
REVISÃO ARQVÉRTICE & RELATÓRIO
      ↓ (Emissão do Relatório Executivo A4)
APROVAÇÃO DO CLIENTE (Homologação formal)
      ↓
BRIEFING TÉCNICO INTERNO (Bloco C01)  ← [VOCÊ ESTÁ AQUI]
      ↓
LEVANTAMENTO (Bloco C02)
      ↓
ESTUDOS PRELIMINARES
      ↓
CONCEITO & MODELAGEM 3D / REVIT
      ↓
DESENVOLVIMENTO DO PROJETO EXECUTIVO
```

---

### 3. CONTROLE DE ACESSO E PERMISSÕES

| Perfil de Usuário | Briefing do Cliente (`briefing.html`) | Briefing Técnico Interno (`index.html`) |
|---|:---:|:---:|
| **Cliente Titular** | Preenche via token seguro, aprova ou pede revisão. | **Sem acesso** (não visualiza nem edita). |
| **Arquiteto Líder / Equipe ArqVértice** | Consulta respostas, emite relatório executivo. | **Acesso total** (criação, edição, aprovação). |
| **Engenheiros Calculista / Obra** | Consulta parecer técnico e restrições. | Visualização e contribuição em diretrizes e pendências. |
| **Sistema / Motor de IA** | Análise de completude e consistência. | Sugestões com tag `AI_SUGGESTION` sob revisão humana. |

---

### 4. ESTRUTURA DAS 22 SEÇÕES ESTRUTURADAS

O painel de Briefing Técnico organiza-se rigorosamente em 22 seções especializadas:

1. **01 — RESUMO DO PROJETO:** Síntese executiva contendo objetivo, tipologia, perfil, programa, prioridades, estilo, necessidades principais, restrições e informações críticas de canteiro/maresia. Gerado automaticamente e editável (marcado como derivado).
2. **02 — PERFIL DO CLIENTE:** Composição da família, dinâmica de rotina, frequência de recepção de visitas, animais de estimação e requisitos de acessibilidade.
3. **03 — OBJETIVOS:** Metas primárias e secundárias do projeto (lazer, moradia, valorização patrimonial, eficiência energética).
4. **04 — PROGRAMA:** Setorização funcional (setores social, íntimo, lazer e serviços) e relação espacial entre os cômodos.
5. **05 — AMBIENTES:** Relação dos ambientes com ficha técnica preliminar individualizada.
6. **06 — NECESSIDADES:** Lista estruturada de requisitos funcionais e espaciais.
7. **07 — RESTRIÇÕES:** Ledger de limitações e condicionantes categorizadas em 8 grupos formais.
8. **08 — PREMISSAS:** Parâmetros arquitetônicos e bioclimáticos de partida (orientação solar, ventilação cruzada, normas locais).
9. **09 — DIRETRIZES:** Diretrizes técnicas detalhadas divididas em 11 categorias.
10. **10 — ESTILO:** Definição da linguagem estética, paleta de cores e atmosfera visual.
11. **11 — MATERIALIDADE:** Especificações de pisos, revestimentos de paredes, bancadas e lista de materiais rejeitados.
12. **12 — ILUMINAÇÃO:** Conceito luminotécnico para luz natural e artificial (temperatura de cor, dimerização, iluminação indireta).
13. **13 — MOBILIÁRIO:** Diretrizes para marcenaria sob medida e mobiliário solto (ergonomia, tecidos e layout).
14. **14 — TECNOLOGIA:** Grau de automação residencial, infraestrutura elétrica e cabeamento estruturado.
15. **15 — ÁREAS EXTERNAS:** Paisagismo, piscina, espelho d'água, varanda gourmet e deck.
16. **16 — INVESTIMENTO:** Faixa orçamentária informada e prioridades de custo (sem confundir com prioridade técnica).
17. **17 — PRAZOS:** Marcos das entregas e datas críticas de inauguração/ocupação.
18. **18 — REFERÊNCIAS:** Catálogo visual de imagens de referência aprovadas e associadas.
19. **19 — PONTOS DE ATENÇÃO:** Mapeamento de riscos construtivos, estruturais ou ambientais.
20. **20 — PENDÊNCIAS:** Gestor de itens pendentes de esclarecimento com responsável, prazo e status.
21. **21 — DECISÕES:** Livro de registros de escolhas técnicas formais adotadas pela equipe.
22. **22 — OBSERVAÇÕES INTERNAS:** Notas confidenciais de coordenação de equipe e alinhamentos de fornecedores.

---

### 5. SISTEMA DE ORIGEM DOS DADOS (PROVENANCE)

Toda informação inserida possui rastreabilidade:
- `CLIENTE`: Dado fornecido diretamente pelo cliente no formulário de briefing.
- `ARQVERTICE`: Interpretação técnica ou definição do arquiteto da equipe.
- `ARQUIVO`: Extraído de documentos oficiais (escritura, certidão, memorial de loteamento).
- `REFERENCIA`: Imagem ou moodboard fornecido ou validado.
- `LEVANTAMENTO`: Informação oriunda de vistoria em campo, trena laser ou topografia.
- `MODELO_REVIT`: Parâmetro geométrico ou estrutural exportado do modelo BIM.
- `DECISAO`: Decisão formal registrada em ata de reunião técnica.
- `IA_SUGESTAO`: Apontamento analítico gerado pela IA (sujeito a validação humana).
- `OUTRO`: Fontes complementares externas.

---

### 6. FICHA TÉCNICA DOS AMBIENTES & MATRIZ AMBIENTE × NECESSIDADE

Cada ambiente cadastrado possui 16 atributos técnicos preliminares:
`nome`, `tipo`, `área (m²)`, `usuários`, `função`, `frequência`, `necessidades`, `estilo`, `materiais desejados`, `materiais rejeitados`, `mobiliário`, `equipamentos`, `iluminação`, `referências`, `observações` e `status`.

A **Matriz Ambiente × Necessidade** permite a consulta cruzada imediata para visualização de:
`AMBIENTE` $\to$ `NECESSIDADES` $\to$ `RESTRIÇÕES` $\to$ `PRIORIDADES` $\to$ `REFERÊNCIAS`.

---

### 7. PREPARAÇÃO E ENTREGA PARA O BLOCO C02

Ao concluir a homologação do Briefing Técnico, o sistema compila o **Pacote de Handover C02**, exportável em JSON e visualizável em tela, contendo todos os subsídios necessários para a equipe de levantamento topográfico e cadastral iniciar os trabalhos de campo sem lacunas de escopo.
