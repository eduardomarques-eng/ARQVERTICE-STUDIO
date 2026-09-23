# J31 - Project 3D Data

`js/project-3d-core.js` fornece um modelo independente da arvore visual do DOM/React.

## Entidades

`Project`, `Building`, `Level`, `Zone`, `Scene`, `Node`, `Asset`, `Mesh`, `Material`, `Texture`, `Light`, `Camera`, `Measurement`, `Annotation`, `View` e `BIMReference` sao tipos aceitos. Cada entidade preserva `id`, `type`, `name`, `parentId`, `children`, `transform`, `visibility`, `metadata`, `source`, `version` e IDs opcionais `projectId`, `sceneId`, `assetId`, `nodeId`, `bimId`, `ifcId` e `revitId`.

## Comandos

A IA deve produzir somente comandos determinísticos: `select`, `move`, `rotate`, `scale`, `hide`, `show`, `rename`, `duplicate`, `delete`, `replaceAsset`, `changeMaterial`, `changeLight`, `changeCamera`, `setVisibility` e `setTransform`. O core rejeita comandos fora da lista.

## Versionamento

Cada mutacao incrementa a versao apropriada de projeto, cena ou asset. `undo()` e `redo()` operam sobre snapshots internos; `serialize()` e `load()` permitem persistencia sem acoplar o estado a React.
