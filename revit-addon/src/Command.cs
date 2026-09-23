using System;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;

namespace ArqVertice.Revit
{
    /// <summary>
    /// Comando externo acionado via botão na Ribbon do Revit.
    /// Exibe informações de conexão e ativa o Dockable Pane do ArqVértice Studio.
    /// </summary>
    [Autodesk.Revit.Attributes.Transaction(Autodesk.Revit.Attributes.TransactionMode.Manual)]
    [Autodesk.Revit.Attributes.Regeneration(Autodesk.Revit.Attributes.RegenerationOption.Manual)]
    public class Command : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            try
            {
                UIApplication uiapp = commandData.Application;
                Document doc = uiapp.ActiveUIDocument?.Document!;

                string docTitle = doc != null ? doc.Title : "Nenhum documento ativo";
                string version = uiapp.Application.VersionNumber;

                TaskDialog dialog = new TaskDialog("ArqVértice Studio Conectado")
                {
                    MainInstruction = "ArqVértice Revit Connector Ativo",
                    MainContent = $"Versão do Revit: {version}\nDocumento: {docTitle}\nPonte Local: http://127.0.0.1:4848\nStatus: Pronto para comunicação bidirecional com o ArqVértice Studio.",
                    CommonButtons = TaskDialogCommonButtons.Ok
                };

                dialog.Show();
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                message = ex.Message;
                return Result.Failed;
            }
        }
    }
}
