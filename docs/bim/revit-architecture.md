# Integração Autodesk Revit — Arquitetura Global e Princípios

O **ArqVértice Studio** estabelece uma conexão profunda e bidirecional com o **Autodesk Revit**, posicionando o Revit como ferramenta de autoria e fonte da verdade (*BIM Authoring System & Connected Source of Truth*), enquanto o ArqVértice atua como o sistema de **visualização, análise automatizada, inteligência artificial, apresentação executiva e orquestração de workflows**.

---

## 1. Princípio de Não-Substituição e Segregação de Papéis

O ArqVértice Studio **não substitui o Revit**. A divisão de responsabilidades é estrita:

```text
┌─────────────────────────────────────────────────────────────┐
│                    ARQVERTICE STUDIO                        │
│  • Visualização Leve & Apresentação (That Open / Three.js)  │
│  • Percepção Multimodal & IA Contextual                     │
│  • Orquestração de Entregáveis e Cronograma (NBR 16636)    │
│  • Roteamento Delimitado (Jev Engine)                       │
│  • Grafo de Cena Cross-Modal e Relações Semânticas          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │  BIM Abstraction Layer
                               │  (Comandos, ChangeSets, Queries)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     AUTODESK REVIT                          │
│  • Autoria Geométrica e Paramétrica BIM                     │
│  • Geração Oficial de Pranchas e Documentação Legal         │
│  • Gestão de Famílias, Tipos e Parâmetros Compartilhados    │
│  • Coordenação e Detecção de Interferências Finais          │
│  • Repositório Conectado da Verdade (RVT)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Topologia do Sistema

O Autodesk Revit é uma aplicação de desktop nativa para Windows e **nunca é executado dentro do navegador**. A comunicação ocorre por meio de camadas desacopladas:

```text
                        ARQVERTICE STUDIO (Frontend Web)
                                       │
                                PROJECT CONTEXT
                                       │
                             BIM ABSTRACTION LAYER
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
          LOCAL REVIT                                  CLOUD REVIT
                 │                                           │
       LOCAL REVIT CONNECTOR                           AUTODESK APS
   (http://127.0.0.1:4848)                     (Design Automation / Data)
                 │                                           │
           REVIT ADD-IN                                      │
   (IExternalApplication / WPF)                              │
                 │                                           │
          EXTERNAL EVENT                                     │
   (IExternalEventHandler)                                   │
                 │                                           │
             REVIT API                                       │
                 │                                           │
                 └─────────────────────┬─────────────────────┘
                                       │
                               DOCUMENT (.RVT)
```

---

## 3. Diretrizes de Comunicação e Segurança

1. **Transporte Localhost**: A conexão padrão utiliza HTTP REST e WebSocket restritos exclusivamente ao loopback (`127.0.0.1:4848`). Conexões externas não autorizadas são sumariamente rejeitadas.
2. **Autenticação e Pareamento**: Toda sessão requer um token de autenticação efêmero gerado durante o aperto de mão (*handshake*) ou código de pareamento verificado entre o add-in do Revit e a aba do estúdio.
3. **Envelope de Comando Padronizado**: Nenhuma chamada executa código C# arbitrário. As requisições são envelopes JSON estruturados com `requestId`, `projectId`, `documentId`, `operation`, `input` e modo (`read`, `preview`, `write`).
4. **Resiliência e Thread-Safety**: Toda modificação no documento Revit é despachada para a thread principal da API do Revit através de `ExternalEvent`, garantindo que o Revit nunca sofra crash por concorrência de threads.
