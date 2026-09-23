# ARQVERTICE STUDIO — SISTEMA DE CONJUNTOS DE REFERÊNCIAS (C02)
## Arquitetura de REFERENCE_SET e Agrupamento Visual

---

### 1. Conceito de REFERENCE_SET

Um **Conjunto de Referência (`REFERENCE_SET`)** é um agrupamento intencional e curado de ativos visuais, criado para orientar a modelagem tridimensional, escolha de materiais e iluminação de um ou mais ambientes.

Em vez de referências soltas e dispersas, o `REFERENCE_SET` define:
- **Identidade Temática:** Ex: *"Sala — Referências Principais"*, *"Deck — Hijau e Cumaru"*.
- **Ambiente Vinculado:** Associação direta a um cômodo ou setor do projeto.
- **Finalidade:** O porquê daquele conjunto existir (ex: *"Definir paleta de texturas e iluminação indireta"*).
- **Prioridade e Status:** Nível de relevância para o projeto (`PRIMARY`, `SECONDARY`, `OPTIONAL`).
- **Lista Ordenada de Itens:** Referências indexadas com anotações de uso.

---

### 2. As 15 Categorias Oficiais de Ativos

Todo arquivo ou imagem ingerido no sistema é classificado em uma das 15 categorias oficiais:

```
1. PLANTA                   — Plantas baixas técnicas cotadas
2. PLANTA_HUMANIZADA        — Plantas ilustradas para apresentação ao cliente
3. PERSPECTIVA              — Perspectivas renderizadas ou estudos volumétricos
4. VISTA                    — Vistas bidimensionais auxiliares
5. ELEVACAO                 — Fachadas e elevações internas
6. CORTE                    — Cortes esquemáticos e técnicos (AA, BB)
7. FACHADA                  — Estudo volumétrico e compositivo de fachada
8. FOTO                     — Fotos de campo, vistorias e canteiro
9. MODELO_3D                — Modelos brutos (.rvt, .ifc, .skp, .obj, .fbx)
10. MATERIAL                — Amostras e texturas de materiais (pedras, madeiras)
11. MOVEL                   — Mobiliário solto ou marcenaria sob medida
12. ILUMINACAO              — Cenas lumínicas, temperaturas de cor e luminárias
13. PAISAGISMO              — Espécies vegetais e elementos de jardim
14. ESTILO                  — Atmosfera e linguagem estética geral
15. OUTRO                   — Documentos técnicos, laudos e memoriais
```

---

### 3. Agrupamento Visual e Anotações de Uso

Cada referência visual pode conter tags especializadas:
- `style`: Ex: "Rústico Contemporâneo", "Resort Litorâneo".
- `material`: Ex: "Mármore Travertino Navona", "Pedra Hijau".
- `lighting`: Ex: "Fita de LED 2700K", "Sancas invertidas".
- `furniture`: Ex: "Sofá modular linho cru".
- `landscape`: Ex: "Espécies tropicais nativas".

#### Campo de Instruções de Uso (`observation_notes`):
Cada referência deve detalhar com precisão a intenção da equipe:
- *"Usar somente como referência de iluminação."*
- *"Não copiar o mobiliário desta imagem."*
- *"Material validado pelo cliente em reunião presencial."*
- *"Atenção à textura fosca, sem polimento brilhante."*
