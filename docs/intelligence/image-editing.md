# Edição de Imagem, Inpainting e Preservação de Contexto

O motor de edição de imagens (`js/image-editing-engine.js`) implementa um fluxo **Mask-First** estrito para edições arquitetônicas direcionadas, evitando que modelos generativos alterem áreas não solicitadas da cena.

---

## 1. Princípio Mask-First

Qualquer alteração em um render ou imagem técnica segue o protocolo:

```text
Imagem Base
    ↓
Segmentação do Elemento Alvo (SAM3)
    ↓
Geração da Máscara Binária com Dilatação de Borda (2–4px)
    ↓
Geração Condicional Dentro da Máscara (Qwen-Image / Inpainting)
    ↓
Composição com Blending Suave na Imagem Base
    ↓
Cálculo de Diff Visual (SSIM + PSNR)
    ↓
Versionamento com Reversibilidade Total (Undo)
```

---

## 2. Operações Suportadas

1. **Troca de Material (`REPLACE_MATERIAL`)**: Altera texturas mantendo a geometria e iluminação global (ex: trocar piso porcelanato polido por tábua corrida de cumaru).
2. **Remoção de Objeto (`REMOVE_OBJECT`)**: Inpainting limpo preenchendo a área com a superfície de fundo inferida (piso/parede).
3. **Substituição de Objeto (`SWAP_OBJECT`)**: Substitui um móvel ou luminária mantendo a oclusão e sombra projetada.
4. **Adição de Vegetação / Paisagismo (`ADD_ELEMENT`)**: Insere folhagens ou elementos decorativos condizentes com a escala do projeto.
5. **Ajuste de Iluminação (`RELIGHT`)**: Modifica a hora do dia (golden hour, crepúsculo, iluminação artificial de cena noturna).

---

## 3. Reversibilidade e Histórico de Versões

Cada edição gera um nó no histórico contendo a máscara aplicada, metadados de prompt, semente e pontuação de consistência estrutural (SSIM). Qualquer intervenção pode ser desfeita instantaneamente sem degradação do arquivo original.
