# Galeria de Apresentações do Cliente (H07)

## 1. Visão Geral e Integração com o Bloco F
O módulo **H07 — Galeria de Apresentações do Cliente** disponibiliza os cadernos de apresentação concebidos e montados no **Bloco F** (Motor Central de Apresentação, Pranchas e Layouts) para o cliente final dentro do Portal do Cliente.

O acesso obedece rigorosamente às diretrizes do sistema de publicações (H04), impedindo o vazamento acidental de cadernos preliminares em edição interna.

---

## 2. Metadados Obrigatórios por Apresentação
Cada item listado na galeria exibe de forma clara e legível:

- **Capa**: Imagem de destaque em alta resolução.
- **Nome / Título**: Identificação descritiva da apresentação.
- **Ambiente / Projeto**: Escopo espacial coberto pelo caderno.
- **Revisão Vigente**: Indicação explícita da versão publicada (ex: `REV01`, `REV02`, `REV03`).
- **Data de Publicação**: Data e horário de homologação no portal.
- **Status de Aprovação**: Situação de homologação formal.
- **Quantidade de Páginas**: Total de pranchas que compõem o documento.
- **Ações de Visualização**: Abertura interativa e modo de slides.

---

## 3. Gestão e Rastreabilidade de Versões

> [!WARNING]
> **Proibição de Substituição Silenciosa:** Uma apresentação anterior nunca é sobrescrita sem o devido registro de revisão. Versões anteriores (ex.: REV01) permanecem catalogadas no histórico técnico.

- O portal indica visualmente qual revisão é a versão atualmente publicada e ativa.
- Atualizações de cadernos geram revisões sequenciais com trilha de auditoria (`publishedAt`, `publishedBy`).

---

## 4. Filtros Dinâmicos
A galeria disponibiliza filtros intuitivos para facilitar a localização dos arquivos:

1. `Todas`: Exibe o conjunto completo de apresentações publicadas para o projeto.
2. `Recentes`: Ordenação cronológica decrescente de publicações.
3. `Aprovadas`: Cadernos homologados formalmente pelo cliente.
4. `Aguardando Revisão`: Cadernos pendentes de análise ou com solicitações de ajuste.

---

## 5. Permissões Granulares por Apresentação
Cada caderno publicado possui flags independentes de permissão definidas pelo arquiteto:

- **Abrir e Navegar**: Acesso ao documento prancha por prancha.
- **Ampliar**: Zoom fotorrealista de pranchas no Visualizador de Documentos (H08).
- **Baixar**: Liberado exclusivamente se `downloadAllowed === true`.
- **Comentar**: Registro de observações via Sistema Estruturado de Comentários (H11) quando `commentAllowed === true`.
- **Aprovar**: Ação formal de homologação quando `approvalAllowed === true`.

---

## 6. Modo Apresentação (Slideshow Executivo)
O cliente ou arquiteto pode acionar o **Modo Apresentação**, que projeta o caderno em tela cheia (fullscreen) com controles direcionais, permitindo reuniões virtuais de alinhamento sem distrações de interface.
