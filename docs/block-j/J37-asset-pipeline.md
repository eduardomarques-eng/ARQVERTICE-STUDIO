# J37 — ARQVERTICE UNIVERSAL 3D ASSET PIPELINE

## 1. Visão Geral do Pipeline de Assets

O **J37 Universal Asset Pipeline** gerencia o ciclo completo de vida dos arquivos 3D no ArqVértice Studio, desde a importação de modelos brutos em múltiplos formatos até a entrega otimizada em `GLB/glTF` comprimido com múltiplos níveis de detalhe (LOD).

```
ENTRADA (GLB, OBJ, FBX, PLY, SPLAT, IFC)
  ➔ INSPEÇÃO & VALIDAÇÃO
  ➔ NORMALIZAÇÃO (Escala métrica, pivô e orientação)
  ➔ OTIMIZAÇÃO (glTF-Transform / Meshopt / Draco)
  ➔ COMPRESSÃO DE TEXTURAS (KTX2 / WebP)
  ➔ GERAÇÃO DE LODs (LOD0, LOD1, LOD2)
  ➔ COMPILAÇÃO DE PROJECT MANIFEST (project.manifest.json)
```

---

## 2. Isolamento em 3 Camadas de Armazenamento (3-Tier Storage)

Para proteger a integridade dos arquivos originais e garantir alto desempenho web:

1. **`SOURCE`**: Guarda o arquivo bruto original intocado (ex: `raw/models/sofa.fbx`), servindo como fonte imutável.
2. **`PROCESSED`**: Versão normalizada com coordenadas centralizadas e escala em metros (`storage/processed/sofa.glb`).
3. **`WEB`**: Versão final comprimida com Meshopt/KTX2 e dividida em LODs para streaming rápido no navegador (`storage/web/sofa_lod0.glb`, `sofa_lod1.glb`, `sofa_lod2.glb`).

---

## 3. Níveis de Detalhe (LOD Architecture)

| Nível | Distância Máxima | Redução de Triângulos | Compressão | Caso de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **LOD 0** | Até 12 metros | 0% (Fidelidade total) | Meshopt + KTX2 | Close-ups e render de alta qualidade |
| **LOD 1** | 12 a 35 metros | ~55% de decimação | Meshopt + WebP | Visão intermediária de ambiente |
| **LOD 2** | 35 a 100 metros | ~88% de decimação | Meshopt + WebP | Background, mobile e vista isométrica geral |

---

## 4. O Manifesto Unificado (`project.manifest.json`)

O `project.manifest.json` atua como a ponte de verdade entre o editor, o client viewer, os agentes de IA e o armazenamento:

```json
{
  "schemaVersion": "1.0.0-arqvertice-manifest",
  "projectId": "prj-praia-01",
  "projectCode": "PRJ-PRAIA-01",
  "scenes": [...],
  "assets": [...],
  "materials": [...],
  "bim": {
    "schema": "IFC4",
    "ifcModelPath": "storage/bim/residencia_praia.ifc",
    "revitSync": { "enabled": true }
  },
  "cameras": [...],
  "lighting": { "sun": {...}, "sky": {...}, "hdri": {...} },
  "lodConfig": { "thresholds": { "lod0MaxM": 12, "lod1MaxM": 35, "lod2MaxM": 100 } },
  "optimization": { "meshoptEnabled": true, "ktx2Enabled": true },
  "permissions": { "allowMeasurements": true, "allowComments": true }
}
```
