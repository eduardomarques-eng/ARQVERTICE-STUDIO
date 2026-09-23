# ARQVERTICE STUDIO — UPLOAD E CLASSIFICAÇÃO DE REFERÊNCIAS (B03)
## VÍNCULO MULTICAMADA E GESTÃO DE ARQUIVOS DO CLIENTE

**Documento:** docs/BRIEFING_UPLOADS.md  
**Status:** Implementado em `js/briefing-engine.js`  

---

### 1. MODELO DE METADADOS DO UPLOAD

Cada arquivo anexado pelo cliente no portal armazena os seguintes metadados estruturados:

- `id`: Identificador único do anexo.
- `title`: Legenda/descrição editável pelo cliente.
- `category`: Classificação temática (`referencia`, `arquitetura`, `interior`, `mobiliario`, `material`, `iluminacao`, `foto`, `planta`).
- `environmentName`: Associação direta a um dos ambientes selecionados pelo cliente na Etapa 5 (ex: "Sala de Estar", "Deck Gourmet").
- `url`: DataURL local / referência de storage.
- `sizeBytes`: Tamanho original do arquivo em bytes.
- `uploadedAt`: Timestamp de inclusão.
