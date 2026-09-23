# Integração BIM (IFC / That Open Engine)

O ArqVértice Studio não pretende substituir softwares de autoria estrutural e executiva (como o Autodesk Revit ou Archicad), mas consolidar-se como a camada definitiva de **visualização, consulta estruturada, validação de quantitativos e interoperabilidade aberta** orientada ao padrão **IFC (Industry Foundation Classes)**.

---

## 1. Princípio da Autoridade BIM

Em qualquer fluxo de inteligência multimodal:

> **Propriedades estruturadas IFC (áreas, volumes, materiais de camadas, classificações) possuem precedência absoluta sobre estimativas visuais geradas por IA.**

Por exemplo:
- Uma IA visual analisando um render pode estimar que uma sala tem aproximadamente 35m².
- No entanto, a consulta à entidade `IfcSpace` no modelo IFC associado retorna a área líquida exata de `38.52 m²`.
- O sistema automaticamente descarta o palpite visual e exibe o dado do `IfcSpace` com carimbo de procedência autoritativa.

---

## 2. Capacidades de Consulta e Análise

1. **Extração de Quantitativos NBR**:
   - Volume de concreto (`IfcBeam`, `IfcColumn`, `IfcSlab`).
   - Área de alvenarias (`IfcWall`, `IfcWallStandardCase`).
   - Contagem e especificação de esquadrias (`IfcDoor`, `IfcWindow`).
2. **Checagem de Regras NBR 16636**:
   - Vãos mínimos de iluminação e ventilação.
   - Largura mínima de portas de circulação (80cm acessível).
   - Pé-direito mínimo para áreas sociais e de serviço.
3. **Fragmentos de Alto Desempenho (That Open Engine)**:
   - Carregamento instantâneo via WebAssembly de modelos com centenas de milhares de entidades sem travar a thread principal do navegador.
