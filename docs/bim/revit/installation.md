# Instalação e Configuração do Add-in Revit

Guia oficial para instalação e registro do Add-In do ArqVértice Studio no Autodesk Revit.

---

## 1. Diretórios Canônicos de Instalação (`.addin`)

O manifesto `ArqVertice.addin` deve ser posicionado na pasta correspondente à versão instalada do Revit:

- **Revit 2024**: `%APPDATA%\Autodesk\Revit\Addins\2024\`
- **Revit 2025**: `%APPDATA%\Autodesk\Revit\Addins\2025\`
- **Revit 2026**: `%APPDATA%\Autodesk\Revit\Addins\2026\`

---

## 2. Conteúdo do Manifesto `.addin`

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Application">
    <Name>ArqVertice Revit Connector</Name>
    <Assembly>ArqVerticeRevitConnector.dll</Assembly>
    <FullClassName>ArqVertice.Revit.App</FullClassName>
    <ClientId>A9C3E1B2-7489-4D35-985E-37F159048E21</ClientId>
    <VendorId>ARQV</VendorId>
  </AddIn>
</RevitAddIns>
```

---

## 3. Inicialização e Verificação

1. Abra o Autodesk Revit.
2. Observe a nova aba na Ribbon: **ArqVértice** ➔ Painel **Design Engine**.
3. Clique em **ArqVértice Studio** para abrir o Dockable Pane e verificar o indicador verde de porta ativa (`127.0.0.1:4848`).
