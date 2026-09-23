# Arquitetura de Versionamento Visual — ArqVértice Studio (D08)

## 1. Visão Geral

O sistema de versionamento visual do ArqVértice Studio garante que **nenhuma geração importante substitua a anterior de forma silenciosa ou destrutiva**. Toda evolução de imagem, render, planta humanizada ou configuração visual mantém rastreabilidade histórica completa, linhagem e metadados contextuais congelados.

---

## 2. Tipos Canônicos de Versionamento

Cada dimensão e artefato do projeto possui ciclo de versionamento independente:

1. `HUMANIZED_PLAN`: Versões de plantas baixas humanizadas com anotações e layout;
2. `HUMANIZED_PERSPECTIVE`: Perspectivas volumétricas e vistas 3D humanizadas;
3. `CAMERA`: Posicionamento, altura, distância focal e enquadramentos de câmeras;
4. `RENDER`: Renderizações fotorrealistas finais por câmera/ambiente (ex: *Living / C01 &rarr; V01, V02, V03...*);
5. `REFERENCE_SET`: Conjuntos e curadorias de referências visuais (`PRIMARY`, `SECONDARY`);
6. `VISUAL_CONFIGURATION`: Perfis de render, iluminação solar, balanceamento e pós-produção.

---

## 3. Ciclo de Vida e Status da Versão

Cada versão visual transita pelos seguintes estados canônicos:

```
[ DRAFT ] ────────► [ GENERATING ] ────────► [ IN_REVIEW ]
                                                    │
                   ┌────────────────────────────────┼────────────────────────────────┐
                   ▼                                ▼                                ▼
              [ APPROVED ]                    [ REJECTED ]                     [ ARCHIVED ]
                   │
                   ▼ (ao ser substituída por nova versão)
             [ SUPERSEDED ]
```

- **`DRAFT`**: Rascunho / preparação de parâmetros;
- **`GENERATING`**: Em execução pelo motor provider-agnostic (Gemini Imagen 3, etc.);
- **`IN_REVIEW`**: Gerada com sucesso, aguardando avaliação humana de arquitetos e clientes;
- **`APPROVED`**: Homologada formalmente. Torna-se a imagem oficial do ambiente;
- **`REJECTED`**: Reprovada com motivo registrado formalmente. Permanece no histórico (não é apagada);
- **`SUPERSEDED`**: Substituída por versão posterior mais recente. Mantida intacta para auditoria;
- **`ARCHIVED`**: Guardada para fins documentais ou históricos.

---

## 4. Comparação Lado a Lado (Visual Diff)

O sistema oferece interface de comparação comparando:
- Imagem gerada em alta resolução;
- Metadados técnicos (resolução, aspecto, provider, modelo de IA, seed);
- Câmera de origem (distância focal, enquadramento);
- Prompt de geração compilado;
- Estado dos 11 Locks Categóricos e Element Locks no momento da criação;
- Divergências detectadas e apontadas automaticamente.

---

## 5. Timeline Cronológica de Eventos

Registra cada marco temporal da versão visual:
- Horário de criação;
- Horário de revisão e comentários;
- Homologação / Aprovação;
- Rejeição e motivo associado;
- Substituição por nova versão (`SUPERSEDED`);
- Captura de snapshots visuais.

---

## 6. Proteção de Versões Aprovadas

Versões com status `APPROVED` possuem imutabilidade protegida:
- Não podem sofrer mutação direta ou substituição acidental;
- Qualquer ajuste deve ser feito via **Use as Base**, criando um novo branch versionado (`V0n+1`).
