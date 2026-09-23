using System;
using System.Windows;
using System.Windows.Controls;
using Autodesk.Revit.UI;

namespace ArqVertice.Revit.DockablePane
{
    public partial class ArqVerticePane : UserControl, IDockablePaneProvider
    {
        public ArqVerticePane()
        {
            InitializeComponent();
        }

        public void SetupDockablePane(DockablePaneProviderData data)
        {
            data.FrameworkElement = this;
            data.InitialState = new DockablePaneState
            {
                DockPosition = DockPosition.Right
            };
        }

        public void UpdateDocInfo(string docTitle, int selectionCount)
        {
            Dispatcher.Invoke(() =>
            {
                TxtDocTitle.Text = docTitle;
                TxtSelectionCount.Text = $"{selectionCount} elemento(s) selecionado(s)";
            });
        }

        public void AppendLog(string message)
        {
            Dispatcher.Invoke(() =>
            {
                TxtLogs.Text += $"\n[{DateTime.Now:HH:mm:ss}] {message}";
            });
        }

        private void BtnSync_Click(object sender, RoutedEventArgs e)
        {
            AppendLog("Sincronização manual iniciada com o ArqVértice Studio.");
        }

        private void BtnInspect_Click(object sender, RoutedEventArgs e)
        {
            AppendLog("Inspeção contextual de seleção disparada.");
        }

        private void BtnAudit_Click(object sender, RoutedEventArgs e)
        {
            AppendLog("Auditoria de conformidade com NBR 16636 iniciada.");
        }
    }
}
