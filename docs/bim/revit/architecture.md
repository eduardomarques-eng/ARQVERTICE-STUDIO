# Arquitetura Global da Plataforma Revit BIM

O subsistema Revit do **ArqVértice Studio** estabelece uma ponte inteligente e desacoplada entre a aplicação web e o Autodesk Revit Desktop.

---

## 1. Topologia de 4 Camadas

```text
ArqVértice Studio (Frontend Web / AI Engine)
                    │
           BIM Abstraction Layer
                    │
          Revit Local Connector (HTTP / WebSocket 127.0.0.1:4848)
                    │
          Revit Add-in (IExternalApplication / ExternalEvent / C#)
                    │
          Autodesk Revit API & Document (.RVT)
```

---

## 2. Princípios de Governança

1. **Revit como Autoridade**: O Revit é a fonte da verdade para geometria física, parâmetros nativos e pranchas legais.
2. **ArqVértice como Orquestrador**: O ArqVértice provê inteligência de design, visualização leve, análise NBR, orquestração agêntica e cronograma.
3. **Isolamento de Processos**: Nenhuma DLL externa roda no browser. A comunicação é serializada via envelopes JSON seguros.
