# ARQVERTICE STUDIO — FLUXO DE TRABALHO E GOVERNANÇA DO BRIEFING TÉCNICO (BLOCO C01)
## GUIA OPERACIONAL DO ARQUITETO, ENGENHARIA E TRANSIÇÃO C01 $\to$ C02

**Documento:** docs/TECHNICAL_BRIEF_WORKFLOW.md  
**Status:** Validado e Ativo no Workspace do Projeto  
**Versão:** C01  

---

### 1. FLUXO OPERACIONAL PASSO A PASSO

```
1. RECEBIMENTO DA APROVAÇÃO DO CLIENTE (Bloco B concluído com status APPROVED)
      │
      ▼
2. DERIVAÇÃO DO BRIEFING TÉCNICO INTERNO (Criação com status DRAFT)
   - Respostas do cliente são importadas como FATOS BRUTOS INVIOLÁVEIS (source: CLIENTE)
   - Resumo Executivo preliminar é sintetizado automaticamente (marcado como derivado)
   - Ambientes do projeto são mapeados para fichas preliminares (16 atributos)
      │
      ▼
3. ANÁLISE TÉCNICA E INTERPRETAÇÃO ARQVÉRTICE (Status transita para IN_REVIEW)
   - O arquiteto traduz necessidades vagas em DIRETRIZES TÉCNICAS ESTRUTURADAS (11 categorias)
   - A equipe registra RESTRIÇÕES TÉCNICAS (8 categorias) e CONDICIONANTES DO IMÓVEL
   - Registro de PENDÊNCIAS CRÍTICAS com responsáveis e prazos
      │
      ▼
4. ASSISTÊNCIA COGNITIVA DA IA NO C01
   - IA executa varredura de conflitos (ex: orçamento restrito vs automação total)
   - IA destaca dados ausentes (ex: laudo de sondagem, alinhamento de recuos)
   - IA sugere perguntas investigativas para campo
   - Arquiteto REVISA, ACEITA (converte para ARQVERTICE) ou DESCARTA cada apontamento
      │
      ▼
5. VALIDAÇÃO DA MATRIZ AMBIENTE × NECESSIDADE
   - Conferência de cada cômodo: necessidades atendidas, restrições mitigadas, prioridades
      │
      ▼
6. HOMOLOGAÇÃO INTERNA & SNAPSHOT IMUTÁVEL (Status transita para APPROVED)
   - Registro formal do aprovador (ex: Eduardo Marques - Arquiteto Líder) e parecer
   - Congelamento de versão: geração automática de TECHNICAL_BRIEF_V01
   - Estágio de Briefing Técnico do projeto é marcado como CONCLUÍDO
      │
      ▼
7. COMPILAÇÃO DO PACOTE DE HANDOVER PARA C02 (LEVANTAMENTO)
   - Sistema libera dados consolidados em JSON e visualização executiva
   - Estágio LEVANTAMENTO (C02) transita para EM_ANDAMENTO
```

---

### 2. PROTOCOLO DE INTERPRETAÇÃO TÉCNICA (FATO VS INTERPRETAÇÃO)

Para manter a separação estrita exigida pelo Bloco C01, a equipe deve seguir a regra:

> **"O cliente expressa desejos, rotinas e incômodos. O arquiteto traduz em geometria, física e especificação."**

#### Exemplos de Aplicação Prática:

| Declaração Original do Cliente (FATO BRUTO) | Interpretação Técnica da ArqVértice (DIRETRIZ) | Categoria | Prioridade |
|---|---|:---:|:---:|
| *"Quero que a sala e a cozinha fiquem abertas para receber amigos."* | Propor planta livre integrando living, jantar e ilha gourmet através de esquadrias piso-teto embutidas com vão livre de 6 metros. | `ESPACIAL` | `CRITICO` |
| *"Não suporto luz branca de hospital, me dá dor de cabeça."* | Iluminação 100% indireta com fita LED 2700K dimerizável em sancas e marcenaria; circuitos setorizados para cenas noturnas. | `ILUMINACAO` | `ALTO` |
| *"Temos um Golden Retriever bem agitado que fica na sala."* | Pavimento em mármore levigado tratado com hidro-repelente profundo e tecidos náuticos laváveis no estofamento. | `MATERIAL` | `ALTO` |
| *"Meus pais idosos passam temporadas conosco."* | Reservar suíte térrea com vão livre de porta de 80cm e box sem desnível abrupto ou soleiras altas. | `FUNCIONAL` | `CRITICO` |

---

### 3. PROTOCOLO DE GOVERNANÇA DA IA NO C01

1. **Vedação ao Fato Automático:** O motor de IA é programado para sugerir, agrupar e confrontar informações. Ele não possui autoridade para declarar que um dado é `CONFIRMED_FACT`.
2. **Ciclo de Homologação da Sugestão da IA:**
   - **Geração:** Sugestão emitida com badge laranja coral `AI_SUGGESTION`.
   - **Revisão:** Arquiteto analisa a pertinência técnica da recomendação.
   - **Aceite:** Ao clicar em *"Adotar como Diretriz ArqVértice"*, a diretriz é persistida no banco com `source_type = 'ARQVERTICE'` e nota de que foi originada de análise assistiva.
   - **Rejeição:** Se for considerada impertinente, a sugestão é descartada sem impacto no histórico oficial.

---

### 4. PROTOCOLO DE SNAPSHOTS E REVISÕES POSTERIORES

1. **Primeira Aprovação:** Gera `TECHNICAL_BRIEF_V01` e grava o payload JSON estático no array `snapshots`.
2. **Alterações Posteriores ao Início dos Estudos:**
   - Se o cliente ou a engenharia solicitar mudanças após a aprovação inicial (ex: ampliação do deck ou troca de sistema de climatização), o arquiteto reabre a edição técnica.
   - Uma nova aprovação gera `TECHNICAL_BRIEF_V02`.
   - `TECHNICAL_BRIEF_V01` **NÃO é sobrescrito**, permanecendo integralmente consultável na linha do tempo de snapshots para fins de segurança jurídica e responsabilidade técnica.

---

### 5. TRANSIÇÃO C01 $\to$ C02 (PREPARAÇÃO PARA O LEVANTAMENTO)

Ao concluir o Bloco C01, o arquiteto abre a sub-aba **"Entrega para C02"** e pode:
1. **Baixar o Pacote C02 em JSON** contendo:
   - Metadados do projeto e do cliente;
   - Programa espacial e fichas preliminares dos ambientes;
   - Restrições ativas e vedações de projeto;
   - Pendências que exigem conferência física em campo;
   - Diretrizes aprovadas pela equipe.
2. **Passar o Bastão para a Equipe de Campo:** O estágio `levantamento` no Workspace é liberado para operação com o escopo completamente delimitado.
