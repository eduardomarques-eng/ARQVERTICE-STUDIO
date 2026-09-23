using System;
using System.Reflection;
using Autodesk.Revit.UI;
using Autodesk.Revit.DB;

namespace ArqVertice.Revit
{
    /// <summary>
    /// Ponto de entrada principal do Add-In do ArqVértice Studio no Autodesk Revit.
    /// Gerencia o ciclo de vida da aplicação, criação da Ribbon e inicialização do servidor de ponte local.
    /// </summary>
    public class App : IExternalApplication
    {
        public static App? Instance { get; private set; }
        public static UIControlledApplication? UIApp { get; private set; }
        public static readonly DockablePaneId PaneId = new DockablePaneId(new Guid("D7F2A341-9876-4C55-B123-998877665544"));

        private RevitBridgeServer? _bridgeServer;
        private RevitExternalEventHandler? _eventHandler;
        private ExternalEvent? _externalEvent;

        public Result OnStartup(UIControlledApplication application)
        {
            Instance = this;
            UIApp = application;

            try
            {
                // 1. Criar Ribbon Tab e Painel "ArqVértice"
                string tabName = "ArqVértice";
                try { application.CreateRibbonTab(tabName); } catch { /* Tab pode já existir */ }

                RibbonPanel panel = application.CreateRibbonPanel(tabName, "Design Engine");
                string thisAssemblyPath = Assembly.GetExecutingAssembly().Location;

                PushButtonData buttonData = new PushButtonData(
                    "cmdOpenArqVertice",
                    "ArqVértice\nStudio",
                    thisAssemblyPath,
                    "ArqVertice.Revit.Command"
                )
                {
                    ToolTip = "Abre o painel conectado do ArqVértice Studio para visualização, IA e sincronização BIM.",
                    LongDescription = "Conecta o projeto ativo do Revit ao Intelligent Design Engine do ArqVértice Studio via localhost seguro."
                };

                panel.AddItem(buttonData);

                // 2. Configurar o Manipulador de Eventos Externos (Thread Safety)
                _eventHandler = new RevitExternalEventHandler();
                _externalEvent = ExternalEvent.Create(_eventHandler);

                // 3. Iniciar a ponte TCP local (127.0.0.1:4848)
                _bridgeServer = new RevitBridgeServer(_eventHandler, _externalEvent);
                _bridgeServer.Start(4848);

                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                TaskDialog.Show("Erro ArqVértice Revit Connector", "Falha ao inicializar o Add-In: " + ex.Message);
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                _bridgeServer?.Stop();
                return Result.Succeeded;
            }
            catch
            {
                return Result.Failed;
            }
        }
    }
}
