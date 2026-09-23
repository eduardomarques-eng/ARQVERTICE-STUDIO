# Visualizador Profissional de Documentos Publicados (H08)

## 1. Visão Geral
O **Visualizador Profissional de Documentos** é a ferramenta imersiva do Portal do Cliente projetada para inspeção minuciosa de pranchas, plantas, renders, relatórios e cadernos técnicos sem perda de fidelidade gráfica e sem alteração do arquivo original.

---

## 2. Tipos de Documentos Suportados
O visualizador processa e renderiza os formatos canônicos da prática arquitetônica:

- **PDF**: Cadernos de apresentação, memórias e cadernos executivos.
- **Imagem**: Renders 3D fotorrealistas e fotos de referências.
- **Prancha**: Desenhos arquitetônicos nos padrões A0, A1, A2, A3.
- **Planta**: Plantas humanizadas, layouts técnicos e plantas de paginação.
- **Moodboard**: Painéis conceituais de materiais e ambientação.
- **Relatório**: Especificações, relatórios de áreas e cadernos descritivos.

---

## 3. Funcionalidades de Interação

| Funcionalidade | Descrição Técnica |
| :--- | :--- |
| **Zoom Interativo** | Controles de ampliação (+ / - / slider / reset) de 30% a 400%, preservando nitidez. |
| **Pan / Arraste** | Deslocamento bidimensional fluido com mouse (drag) ou gestos touch. |
| **Navegação de Páginas** | Botões de prancha anterior / próxima com indicador `Página X de Y`. |
| **Tela Cheia** | Ativação do modo Fullscreen via HTML5 Fullscreen API para exibição imersiva. |
| **Painel de Miniaturas** | Navegação rápida através de thumbnails das pranchas componentes. |
| **Download Seguro** | Disponibilização de download restrita a arquivos com `downloadAllowed: true`. |

---

## 4. Metadados Exibidos em Tempo Real

- **Para PDFs**: Página ativa e total de páginas da publicação.
- **Para Imagens**: Resolução original (ex.: 3840x2160 4K) e proporção de aspecto (16:9, 4:3).
- **Para Pranchas e Plantas**: Escala gráfica (ex.: 1:50, 1:100) e formato de folha (A1, A2, A3).
- **Para Documentos**: Revisão, autor e data da publicação.

---

## 5. Responsividade (Mobile & Desktop)

- **Mobile (Smartphones e Tablets)**:
  - Navegação simplificada por gestos de toque (pinch-to-zoom / swipe).
  - Controles compactos e modo tela cheia nativo.
- **Desktop**:
  - Painel de miniaturas recolhível.
  - Área central de canvas de alta performance com aceleração de hardware.
  - Barra de informações e metadados dedicados.

---

## 6. Controle de Acesso no Backend & Proteção de Arquivos
O visualizador opera sob middleware estrito de autorização (`authorizeDocumentView`):
1. **Verificação de Sessão**: Confere se o token de acesso e a sessão do portal são válidos e ativos.
2. **Bloqueio de Documentos Internos**: Arquivos privados ou despublicados retornam `403 Forbidden` e mensagem de acesso negado.
3. **Isolamento de Projetos**: Clientes não conseguem visualizar arquivos pertencentes a outros contratos.
4. **Imutabilidade**: O arquivo fonte do estúdio é lido em modo de apenas leitura (read-only), impedindo qualquer sobrescrita ou corrupção.
