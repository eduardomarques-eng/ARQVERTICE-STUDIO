# ArqVértice Studio — Sistema de Móveis, Marcenaria, Equipamentos e Decoração (Bloco E01)

## 1. Visão Geral e Princípios

O **Bloco E01** introduz a especificação de mobiliário, marcenaria planejada, equipamentos e decoração dentro dos ambientes do ArqVértice Studio. 

O sistema opera **prioritariamente por AMBIENTE**, permitindo uma rastreabilidade precisa de cada elemento espacial:

```text
PROJETO (Ex: Residência de Praia)
├── SALA DE ESTAR / LIVING
│   ├── Sofá Living com Chaise (Existente - Acervo Cliente)
│   ├── Painel Ripado e Rack TV (Marcenaria Sob Medida)
│   ├── Conjunto de Jantar Minimalista (Conjunto / Grupo)
│   │   ├── 1x Mesa de Jantar 220cm
│   │   └── 6x Cadeiras de Jantar Estofadas
│   ├── Luminária Pendente Orgânica (Sugestão IA / Não Identificado)
│   └── Objetos decorativos
└── COZINHA INTEGRADA
    ├── Bancada em Ilha (Marcenaria / Pedra)
    ├── Banquetas altas
    ├── Adega Climatizada Dual Zone (Equipamento / Eletrodoméstico)
    └── Cooktop por indução
```

---

## 2. Princípio Fundamental Anti-Alucinação

> [!IMPORTANT]
> **O sistema NUNCA inventa produtos comerciais reais.**

Quando um modelo visual de móvel não tiver sido identificado com segurança técnica ou homologado em catálogo oficial pelo arquiteto/cliente:
- Deve ser categorizado como:
  * `NÃO IDENTIFICADO`
  * `REFERÊNCIA VISUAL`
  * `SUGESTÃO` (`AI_SUGGESTION`)
- O sistema **jamais** transforma uma inferência de aparência (ex: *"sofá bege de 3 lugares"*) em um produto de loja (ex: *"Sofá Mod. XYZ da Loja Y"*) sem comprovação documental explícita.

---

## 3. Origens dos Dados (`Origin`)

Cada item de mobiliário ou marcenaria registra sua origem com auditoria:
1. `CLIENTE`: Item existente ou solicitado pelo cliente.
2. `ARQVERTICE`: Especificado pela equipe técnica de arquitetura.
3. `REVIT`: Extraído do modelo BIM.
4. `REFERENCIA`: Imagem ou catálogo de referência inicial.
5. `RENDER`: Extraído ou inspirado por render aprovado.
6. `IMAGEM`: Foto do acervo ou levantamento local.
7. `CATALOGO`: Especificado diretamente de catálogo de fabricante.
8. `FORNECEDOR`: Proposta orçamentária ou disponibilidade informada por lojista.
9. `IA`: Sugestão volumétrica e material assistida por IA visual.
10. `MANUAL`: Cadastro manual avulso no sistema.

---

## 4. Tipologias de Itens

- **`EXISTING` (Existente):** Pertence ao cliente e será reaproveitado no projeto.
- **`NEW` (Novo):** Peça a ser especificada, orçada e adquirida.
- **`CUSTOM_MILLWORK` (Sob Medida):** Marcenaria técnica desenhada sob medida, móveis especiais e bancadas.

---

## 5. Integração com Blocos Anteriores (C02, D06, D07)

Os móveis homologados (`APPROVED`) em determinado ambiente alimentam automaticamente o contexto visual do ambiente e as travas de consistência (`FURNITURE_LOCK`):
- O motor de síntese visual de novas gerações (Bloco C e D) recebe a lista de móveis aprovados e preserva suas dimensões, materiais e posicionamentos.
- As medidas técnicas de marcenaria sob medida vêm sempre do projeto/levantamento do usuário e pranchas executivas associadas (`associated_file_url`), nunca de alucinações visuais de IA.

---

## 6. Exportação Estruturada

O sistema oferece exportação imediata para **CSV** e está com estrutura relacional normalizada pronta para renderização em **PDF** e planilhas **XLSX**, suportando agrupamento por ambiente, categoria, status e fornecedor.
