# ArqVértice Studio — Consistência Visual e Memória de Projeto (D07)

## 0. Objetivo

O sistema de **Consistência Visual** impede que cada geração de imagem seja tratada como um ambiente completamente novo e desprovido de histórico.

O ArqVértice Studio garante que elementos previamente homologados pelo arquiteto (como sofás, acabamentos de madeira, pisos e enquadramentos) permaneçam fixos em todas as gerações subsequentes, permitindo **alterações pontuais estritas** sem deformar o restante do projeto.

---

## 1. Princípio de Alteração Estruturada (TARGET & PRESERVE)

Quando o usuário expressa uma intenção de alteração em linguagem natural:

> *"Troque somente o sofá."*

A aplicação não transmite essa frase solta ao modelo. O motor compila e estrutura a solicitação em dois blocos fundamentais:

```
TARGET:
  SOFÁ

PRESERVE:
  GEOMETRIA
  LAYOUT
  PORTAS
  JANELAS
  PISO
  PAREDES
  FORRO
  MATERIAIS
  ILUMINAÇÃO
  DEMAIS MÓVEIS
  DECORAÇÃO
  CÂMERA
```

Todas as dimensões não mencionadas são estritamente preservadas no prompt compilado e nos pesos do render engine.

---

## 2. Consistência Entre Câmeras (Mesmo Ambiente)

Se o usuário homologou o **Sofá curvo em linho cru** na Câmera `C01`, e posteriormente solicita uma renderização da Câmera `C02` (que visualiza o mesmo living a partir de outro ângulo):
- O motor de consistência recupera automaticamente os elementos homologados na `C01`;
- Injeta suas especificações exatas na compilação da `C02`;
- **Impede que a IA invente outro sofá arbitrário na C02**.

---

## 3. Consistência Entre Ambientes (Linguagem Global do Projeto)

O projeto arquitetônico possui uma linguagem de acabamentos mestra (ex: *madeira predominante = carvalho natural ripado*; *paleta = tons areia e neutros*; *pedra = mármore travertino navona*).

1. **Herança Automática**: Todos os ambientes herdam essa especificação global.
2. **Exceção Local Homologada**: Caso um ambiente específico possua uma decisão aprovada própria (ex: *Cozinha com marcenaria em freijó escuro*), a decisão local prevalece sobre a diretriz global do projeto, conforme a hierarquia de precedência em 8 níveis.

---

## 4. Versionamento Não-Destrutivo

Qualquer alteração pontual relevante aprovada pelo arquiteto produz uma nova versão rastreável (`V01` &rarr; `V02`), mantendo o histórico de versões anteriores intacto para fins de auditoria e comparação lado a lado.
