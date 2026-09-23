# J36 — ARQVERTICE BIM INTEGRATION & SEMANTIC MAPPING

## 1. Visão Geral

O módulo **J36 BIM Integration** garante que a camada 3D não seja uma representação visual isolada. Cada elemento visualizado no motor 3D mantém rastreabilidade bidirecional com os dados paramétricos, quantitativos e propriedades de engenharia e arquitetura.

```
PROJECT ➔ PROJECT DATA ➔ BIM ➔ SCENE GRAPH ➔ 3D ASSETS ➔ MATERIALS ➔ VIEWS ➔ CLIENT VIEWER
```

---

## 2. Auditoria e Estratégia de Integração BIM

- **Padrão Adotado**: Arquitetura modular inspirada no padrão `@thatopen/components` (substituindo o antigo `web-ifc-viewer`), focada em fragmentos geométricos, árvore espacial determinística e isolamento de propriedades.
- **IFC Schema Suportado**: IFC2X3 e IFC4.
- **Categorias Canônicas Mapeadas**: `IfcProject`, `IfcSite`, `IfcBuilding`, `IfcBuildingStorey`, `IfcSpace`, `IfcWall`, `IfcWallStandardCase`, `IfcSlab`, `IfcDoor`, `IfcWindow`, `IfcBeam`, `IfcColumn`, `IfcRoof`, `IfcStair`, `IfcCovering`, `IfcFurnishingElement`, `IfcFlowTerminal`.

---

## 3. Modelo Relacional Unificado (`BIMEntityRelationship`)

Cada entidade no visualizador consolida os seguintes identificadores e metadados:

```json
{
  "visualId": "vis-sofa-living",
  "assetId": "SOFA-001",
  "ifcId": "34901",
  "ifcGuid": "1Xv_9e4nL7R8v01mQx2kLp",
  "revitId": "REV-70102",
  "projectId": "prj-praia-01",
  "roomId": "spc-living",
  "levelId": "lvl-01",
  "category": "IfcFurnishingElement",
  "name": "Sofá Modular 4 Lugares",
  "materialId": "mat-fabric-linen",
  "source": "GLB",
  "dimensions": {
    "lengthM": 3.6,
    "widthM": 1.8,
    "heightM": 0.8,
    "areaM2": 6.48,
    "volumeM3": 5.18
  },
  "propertySets": {
    "ArqVertice_Mobiliario": {
      "Fornecedor": "Jader Almeida",
      "Tecido": "Linho Italiano Cinza",
      "Status": "Especificado"
    }
  }
}
```

---

## 4. Recursos Operacionais no Visualizador

1. **Seleção e Inspeção de Propriedades**: Leitura instantânea de `Psets` (`Pset_WallCommon`, dimensões, isolamento acústico, resistência ao fogo).
2. **Cortes de Seção e Plantas Técnicas**: Planos de corte nos eixos X, Y e Z com preenchimento de cap.
3. **Isolamento por Pavimento**: Ocultação dinâmica de níveis superiores para análise da planta do pavimento térreo.
