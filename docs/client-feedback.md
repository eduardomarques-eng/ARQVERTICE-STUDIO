# Sistema Estruturado de Comentários (H11)

## 1. Visão Geral e Princípio Arquitetural
O módulo **H11 — Sistema Estruturado de Comentários** estabelece um canal direto e contextualizado de feedback entre o cliente e o arquiteto.

> [!IMPORTANT]
> **Anti-Chat Genérico**: O portal não implementa um chat genérico ou mensageiro avulso. Todo e qualquer comentário deve estar **estritamente associado a um objeto específico do projeto**.

---

## 2. Tipos de Alvos Suportados (`targetType`)
Comentários podem ser vinculados aos seguintes elementos canônicos:

- **Projeto**: Comentários gerais sobre a visão global do contrato.
- **Ambiente**: Feedback focado em um cômodo específico (ex.: Cozinha Gourmet).
- **Imagem**: Observações sobre um render ou perspectiva 3D.
- **Prancha**: Dúvidas ou anotações sobre uma folha do caderno executivo.
- **Material**: Comentários sobre amostras, revestimentos e pedras.
- **Mobiliário**: Feedback sobre modelos, tecidos ou dimensões de móveis.
- **Vídeo**: Observações sobre animações ou passeios virtuais.
- **Documento**: Dúvidas sobre memórias de cálculo, relatórios ou moodboards.

---

## 3. Modelo de Dados (`ClientComment`)

```typescript
interface ClientComment {
  id: string; // Ex: 'ccom-rnd-sala-01-abc'
  projectId: string; // Identificador do projeto
  portalId: string; // Portal de origem
  clientId: string; // Cliente autor
  targetType: 'Projeto' | 'Ambiente' | 'Imagem' | 'Prancha' | 'Material' | 'Mobiliário' | 'Vídeo' | 'Documento';
  targetId: string; // ID do objeto referenciado
  parentId: string | null; // ID do comentário pai (para respostas encadeadas/threads)
  text: string; // Conteúdo do feedback
  status: 'open' | 'replied' | 'resolved' | 'reopened' | 'archived';
  authorName: string; // Nome do remetente
  authorRole: 'client' | 'architect'; // Papel do remetente
  createdAt: string; // Timestamp ISO de criação
  updatedAt: string; // Timestamp ISO de atualização
  resolvedAt: string | null; // Timestamp ISO de resolução
  resolvedBy: string | null; // Responsável pela resolução
  position?: { x: number; y: number; page?: number }; // Coordenadas para pinagem futura
}
```

---

## 4. Ciclo de Vida dos Comentários (`status`)

1. **`open`**: Comentário recém-criado aguardando posicionamento da equipe.
2. **`replied`**: Comentário com respostas encadeadas da equipe ou do cliente.
3. **`resolved`**: Dúvida sanada ou ponto acordado e marcado como concluído.
4. **`reopened`**: Tópico reaberto pelo cliente ou arquiteto para esclarecimentos adicionais.
5. **`archived`**: Registros históricos congelados.

---

## 5. Histórico e Imutabilidade
- **Proibição de Deleção Silenciosa**: Nenhum comentário relevante é apagado. O sistema preserva a integridade do histórico para mitigar conflitos futuros de comunicação.
- **Respostas Encadeadas (Threads)**: Respostas são vinculadas através de `parentId`, mantendo a clareza e o contexto do diálogo.
- **Arquitetura para Comentários Posicionais Futuros**: O modelo já prevê o campo `position: { x, y, page }`, preparando o backend para futuras ferramentas de marcação pontual sobre imagens e pranchas (pins gráficos), sem necessidade de reengenharia de banco de dados.
