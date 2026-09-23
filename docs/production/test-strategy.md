# ARQVERTICE STUDIO — ESTRATÉGIA DE TESTES & QUALITY GATES (K06)

> **Documento Oficial de Estratégia de Testes, Pirâmide de Qualidade & Automação**  
> **Versão:** 1.0.0 | **Cobertura:** 88 Suítes Automatizadas

---

## 1. Pirâmide de Testes do ArqVértice Studio

A estratégia de testes prioriza velocidade, estabilidade e determinismo em todas as camadas da aplicação:

```
                  ▲
                 / \
                /   \     E2E / Visual QA (10%)
               / E2E \    - Navegação, Responsividade, Safe Areas, Touch Targets
              /-------\
             /         \   Testes de Integração (30%)
            /INTEGRAÇÃO \  - API, Migrações de Banco, Deploy Blue-Green, Rollback,
           /             \ - Pipeline BIM ThatOpen, Remotion Audiovisual
          /---------------\
         /                 \  Testes Unitários (60%)
        /     UNITÁRIOS     \ - Parsers, BVH 3D, Magic Bytes, AI Decision Engine,
       /_____________________\- Schemas de Briefing, Validadores de Materiais
```

---

## 2. Mapeamento de Caminhos Críticos (Critical Paths)

| Caminho Crítico | Arquivo de Teste Principal | O que é validado? |
| :--- | :--- | :--- |
| **BIM & Modelos IFC** | `tests/universal-bim-asset-pipeline.test.js` | Parsing STEP/IFC, classificação de elementos, propriedades e LODs |
| **Renderização 3D Realtime** | `tests/realtime-render-pipeline.test.js` | 5 Tiers PBR, shadow caching, WebGPU / WebGL2 fallback |
| **Comandos de IA 3D** | `tests/ai-3d-intelligence.test.js` | Resolução de ambiguidades, bloqueio estrutural, diffs e undo/redo |
| **Client Viewer** | `tests/client-viewer-j33.test.js` | Responsividade, FPS beacon, telemetria, controles táteis |
| **Produção & Deploy** | `tests/deploy-and-rollback.test.js` | Deploy Blue-Green, transição atômica de slots, rollback e AuditLedger |
| **Segurança & Hardening** | `tests/hardening-and-compliance.test.js` | Magic bytes, prevenção IDOR, bloqueio de métodos HTTP |
| **Banco & Migrações** | `tests/database-and-backups.test.js` | Transações atômicas, snapshots SHA-256 e rollback |

---

## 3. Comandos Padronizados de Teste (`package.json`)

- `npm test`: Executa todas as 88 suítes de teste de ponta a ponta.
- `npm run test:unit`: Executa testes de lógica pura e schemas.
- `npm run test:integration`: Executa testes de API, deploy, BIM e banco.
- `npm run test:security`: Executa a suíte de hardening e auditoria de segurança.
- `npm run test:3d`: Executa o quality gate da engine 3D e renderização.
- `npm run test:visual`: Executa auditoria visual e responsividade.
