# ARQVERTICE STUDIO — DASHBOARD DO PORTAL DO CLIENTE (H03)
## BLOCO H: PÁGINA INICIAL, PROGRESSO E EXPERIÊNCIA DO CLIENTE

Data: 2026-09-22  
Módulo: Client Dashboard UI & UX  
Status: Produção / Integrado  

---

### 1. Visão Geral da Interface
A página inicial do **Portal do Cliente** foi projetada para transmitir sofisticação, clareza, transparência e controle imediato.  
O cliente visualiza instantaneamente o estágio de desenvolvimento da sua obra/projeto, sem sobrecarga de informação ou jargões técnicos excessivos.

---

### 2. Estrutura Visual da Página Inicial

```
+-----------------------------------------------------------------------------------+
|  [ARQVÉRTICE]  |  Residência de Praia (Pedro)  |  Acesso Seguro  |  [Sair]        |
|  [Painel]  [O Projeto]  [Briefing]  [Apresentações]  [Revisões]  [Aprovações]     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [HERO CARD: PROJETO]                                                        |  |
|  | Imagem Render Oficial de Fachada                                            |  |
|  | "Residência de Praia" • 385 m² • Litoral Sul • Revisão Vigente: R01         |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [PRÓXIMA AÇÃO DO CLIENTE]                                                   |  |
|  | "Responder Briefing do Projeto" ou "Revisar Apresentação Executiva"  [Acessar] |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [EVOLUÇÃO DO PROJETO - 8 ETAPAS CANÔNICAS PÚBLICAS]                         |  |
|  | [✔ Briefing] -> [✔ Levantamento] -> [✔ Estudos] -> [● Conceito] -> [Projeto]...|
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +----------------------------------------+ +----------------------------------+  |
|  | [ÚLTIMAS ATUALIZAÇÕES PUBLICADAS]      | | [CONTEÚDO DISPONÍVEL]            |  |
|  | • 4 Renders Fotorrealistas Publicados  | | • 4 Renders 3D                   |  |
|  | • Atualização do Cronograma de Projeto | | • 1 Briefing Homologado          |  |
|  | • Revisão R01 Disponibilizada          | | • Arquiteto: Eduardo Marques     |  |
|  +----------------------------------------+ +----------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

### 3. Detalhamento dos Componentes Principais

#### 3.1 Header
- **Logotipo ArqVértice**: Identidade visual institucional limpa;
- **Nome do Projeto e Cliente**: Contexto explícito do projeto acessado;
- **Status do Acesso**: Indicador luminoso verde de sessão criptografada ativa;
- **Menu Responsivo**: Navegação horizontal com scroll suave e ícones Lucide;
- **Botão de Logout**: Encerra a sessão com invalidação imediata no servidor.

#### 3.2 Card Principal ("Projeto")
- Imagem de capa oficial em alta definição;
- Nome do empreendimento;
- Endereço e localização (exibidos somente quando autorizados pelo arquiteto);
- Metragem construída e tipologia;
- Etapa vigente e código de revisão atual.

#### 3.3 Progresso das Etapas Públicas
Mapeia as 8 etapas canônicas voltadas para o cliente:
1. `Briefing`
2. `Levantamento`
3. `Estudos`
4. `Conceito`
5. `Projeto`
6. `Visualização`
7. `Revisão`
8. `Entrega`

> [!IMPORTANT]
> **Ocultação de Etapas Internas**: Etapas restritas da engenharia interna (como *Briefing Técnico*, *Cronograma Interno de Custo*, *Especificações Brutas*) são automaticamente filtradas e jamais expostas ao cliente.

#### 3.4 Próxima Ação (Call to Action Inteligente)
Gera uma recomendação direta para orientar o cliente sobre o próximo passo necessário para o avanço da obra, por exemplo:
- *"Responder briefing do projeto"*
- *"Revisar apresentação executiva"*
- *"Aprovar estudo preliminar"*
- *"Enviar observações da revisão"*
- *"Visualizar entrega executiva"*

#### 3.5 Atualizações Recentes Publicadas
Exibe exclusivamente mensagens, entregas e marcos explicitamente homologados pela equipe de arquitetura. Logs de depuração, falhas de render ou anotações internas não aparecem nesta lista.

---

### 4. Responsividade e Estados de Interface
O dashboard adapta-se automaticamente a 3 faixas de resolução:
- **Desktop (> 1024px)**: Grid balanceado com 2 colunas e stepper linear com 8 etapas;
- **Tablet (641px a 1024px)**: Stepper adaptado em 2 linhas de 4 nós e cards empilhados;
- **Mobile (≤ 640px)**: Header verticalizado, stepper em 4 linhas de 2 nós, botões de toque com tamanho mínimo de 44px.

#### Estados de Exibição Controlados:
- `loading`: Efeito skeleton screen e spinner com feedback de verificação;
- `empty`: Mensagem suave quando um projeto novo ainda não possui imagens publicadas;
- `error`: Mensagem de indisponibilidade com CTA para contato direto;
- `not_found`: Alerta de link ou token inválido;
- `expired`: Informação de prazo de acesso esgotado com botão para solicitar renovação.
