# Matriz de Versões e Compatibilidade da Revit API

O Autodesk Revit introduziu mudanças estruturais significativas no seu runtime a partir do Revit 2025. O conector do ArqVértice Studio adota uma estratégia versionada em C# para assegurar suporte contínuo desde o Revit 2023 até o Revit 2026+.

---

## 1. Tabela Comparativa de Versões e Runtimes

| Versão do Revit | Runtime / Target Framework | Assemblies de Referência | Principais Mudanças na API |
| :--- | :--- | :--- | :--- |
| **Revit 2023** | `.NET Framework 4.8` | `RevitAPI.dll`<br>`RevitAPIUI.dll` | Introdução de `IFailuresPreprocessor` moderno; suporte avançado a parâmetros compartilhados e vinculação IFC4. |
| **Revit 2024** | `.NET Framework 4.8` | `RevitAPI.dll`<br>`RevitAPIUI.dll` | Novo sistema de Toposolid substituindo Toposurface; modernização de Textures e Dark Theme na UI. |
| **Revit 2025** | **`.NET 8.0`** *(Mudança Maior)* | `RevitAPI.dll`<br>`RevitAPIUI.dll` | Migração completa de .NET Framework para .NET Core/.NET 8.0 moderno; suporte a C# 12 e melhorias substanciais de performance. |
| **Revit 2026** | **`.NET 8.0 / .NET 9.0`** | `RevitAPI.dll`<br>`RevitAPIUI.dll` | Continuidade em .NET moderno; novas APIs de nuvem de pontos, geometria avançada e propriedades analíticas de sustentabilidade. |

---

## 2. Regra Estrita de Isolamento de Assemblies

> **REGRA ABSOLUTA**: Nunca misturar DLLs ou assemblies de versões diferentes do Revit no mesmo build.

Para compilar e empacotar o conector:
1. O projeto C# (`ArqVerticeRevitConnector.csproj`) utiliza compilação condicional (`#if REVIT2025 || REVIT2026 ... #else ... #endif`).
2. O target framework é configurado como:
   - `<TargetFrameworks>net48;net8.0-windows</TargetFrameworks>`
3. O instalador deposita o manifesto `.addin` e a respectiva DLL na pasta correspondente à versão instalada do usuário:
   - `%APPDATA%\Autodesk\Revit\Addins\2023\`
   - `%APPDATA%\Autodesk\Revit\Addins\2024\`
   - `%APPDATA%\Autodesk\Revit\Addins\2025\`
   - `%APPDATA%\Autodesk\Revit\Addins\2026\`

---

## 3. Detecção em Tempo de Execução

O conector local identifica a versão ativa do Revit durante o handshake inicial através da propriedade nativa `Autodesk.Revit.ApplicationServices.Application.VersionNumber` e `VersionName` e a transmite para o ArqVértice Studio.
