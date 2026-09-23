# ArqVertice Studio — Pipeline de Preparação e Curadoria das Referências Visuais (D02)

## 1. Visão Geral e Princípio Fundamental
O **Pipeline de Curadoria de Referências Visuais (D02)** do ArqVertice Studio estrutura a ingestão, categorização e filtragem rigorosa de todas as referências visuais que alimentam os processos de renderização e geração por Inteligência Artificial no **Workspace de Visualização (D01)**.

### Princípio da Integridade Categórica
> **Regra Crítica:** Uma referência visual jamais poderá ser interpretada por um operador ou pela IA fora de sua finalidade explícita (ex: usar uma foto de iluminação como se fosse geometria) sem que uma reclassificação formal seja registrada com trilha de auditoria (`visual_reference_audit`).

---

## 2. As 8 Categorias Canônicas de Referência
O sistema distingue rigidamente 8 tipos de referência visual:

| Código Interno | Categoria | Descrição / Uso Pretendido | Exemplo Prático |
| :--- | :--- | :--- | :--- |
| `GEOMETRY_REFERENCE` | **Geometria / Arquitetura** | Define paredes, vãos, esquadrias, alturas e proporções espaciais. Fonte arquitetônica prioritária. | Planta baixa cotada, elevação, corte técnico, vista ortográfica ou perspectiva 3D do Revit. |
| `CAMERA_REFERENCE` | **Câmera / Enquadramento** | Define o ponto de observação, campo de visão (FOV), altura dos olhos e orientação da lente. | Posição exata da câmera Revit, foto de olho humano a 1.50m voltada para o terraço. |
| `STYLE_REFERENCE` | **Estilo / Linguagem** | Orienta a linguagem estética, tom cromático e atmosfera geral sem replicar layouts. | "Essa imagem serve apenas para a linguagem visual e minimalismo aconchegante." |
| `MATERIAL_REFERENCE` | **Material / Textura** | Especifica superfícies, veios de pedras, tons de madeira, tecidos e rugosidade. | "Usar textura e aparência do quartzito Mont Blanc, não copiar a marcenaria nem a arquitetura." |
| `FURNITURE_REFERENCE` | **Mobiliário / Design** | Especifica peças de design, modelos de poltronas, mesas ou estofados. | "Referência do sofá curvo com linho cru; ignorar as luminárias e o piso da foto." |
| `LIGHTING_REFERENCE` | **Iluminação** | Define temperatura de cor (Kelvin), rasgos de luz, iluminação indireta e clima dia/noite. | "Rasgo linear no gesso a 2700K suave; use somente iluminação." |
| `COMPOSITION_REFERENCE`| **Composição** | Guia a regra dos terços, simetria, enquadramento de elementos e equilíbrio visual. | "Usar composição centralizada com ponto de fuga no horizonte." |
| `AESTHETIC_REFERENCE` | **Estética Geral** | Referência de acabamento refinado, pós-produção ou mood complementar. | "Fotografia editorial de revista com iluminação suave e pós-produção quente." |

---

## 3. Priorização de Fontes Geométricas do Revit
As geometrias alimentadas pelo Revit possuem prioridade absoluta na reconstrução espacial:
1. **Planta Humanizada / Técnica:** Estabelece o layout real, perímetro e distâncias.
2. **Perspectivas do Revit:** Malha 3D real exportada do modelo BIM da ArqVertice.
3. **Elevações e Fachadas:** Alturas de pé-direito, alinhamentos verticais de painéis e aberturas.
4. **Cortes:** Relações seccionais de forro, desníveis de piso e degraus.
5. **Vistas Técnicas de Detalhe:** Junções de materiais e paginação de pisos.

---

## 4. Registro de Referências de Câmera (`CAMERA_REFERENCE`)
Toda referência de câmera registra metadados espaciais detalhados para orientar as câmeras virtuais e o pipeline gerador:
* **Ambiente (`environment`):** Ex.: `Living e Jantar Integrados (amb-sala-01)`.
* **Direção do Olhar (`direction`):** Ex.: `Norte-Noroeste (voltado para o mar)`.
* **Enquadramento (`framing`):** Ex.: `Lente 24mm aberta em ângulo amplo, 16:9, altura 1.45m`.
* **Origem da Câmera (`origin`):** Ex.: `Câmera 01 Revit 2026`.
* **Descrição da Lente (`description`):** Ex.: `Enquadramento angular capturando sofá em primeiro plano e mar ao fundo`.

---

## 5. Níveis de Prioridade do Pipeline
Cada item de referência possui um dos quatro níveis de prioridade:
* **`PRIMARY` (Primária):** Peso contextual máximo. A IA e os renderizadores priorizam esta imagem como diretriz central inegociável do ambiente.
* **`SECONDARY` (Secundária):** Peso contextual de apoio e enriquecimento compositivo.
* **`OPTIONAL` (Opcional):** Inspiração secundária que pode ser considerada ou descartada conforme o prompt.
* **`REJECTED` (Rejeitada):** Descartada pelo curador ou pelo cliente, excluída imediatamente da injeção de contexto.

---

## 6. Anotações de Escopo de Uso Estrito
Para evitar que uma imagem de referência contamine aspectos indevidos do projeto, o sistema permite definir escopos de uso pontuais e botões de atalho rápido:
* `"Use somente material."`
* `"Use somente iluminação."`
* `"Não reproduzir mobiliário."`
* `"Usar composição."`
* Anotações personalizadas do arquiteto (ex: *"Apenas o tom do carvalho europeu; ignorar o papel de parede"*).

---

## 7. Curadoria Não-Destrutiva
Ao selecionar, desmarcar, ordenar ou excluir uma referência da geração:
* O arquivo físico original (armazenado em `surveyAssets` ou `references`) **nunca é apagado**.
* A flag `isExcludedFromGeneration` é alternada para `true`, exibindo um banner visual explícito no card: `EXCLUÍDA DA GERAÇÃO (Arquivo preservado)`.
* O usuário pode restaurar a referência para o conjunto a qualquer momento com um clique.

---

## 8. Assistência de IA Controlada por Humanos
O pipeline conta com o serviço `suggestReferenceMetadataAI(itemId)`, que analisa a referência e sugere categorias e notas contextuais. No entanto:
* A categoria final e a prioridade **permanecem sob controle humano total**.
* Qualquer alteração é registrada com o autor no log de auditoria.
