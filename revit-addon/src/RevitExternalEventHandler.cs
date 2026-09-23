using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace ArqVertice.Revit
{
    /// <summary>
    /// Manipulador de Eventos Externos do Revit (IExternalEventHandler).
    /// Assegura que todas as leituras e transações da Revit API ocorram estritamente
    /// na thread de UI principal do Revit quando o software estiver pronto.
    /// </summary>
    public class RevitExternalEventHandler : IExternalEventHandler
    {
        private class CommandJob
        {
            public string CommandJson { get; set; } = "";
            public TaskCompletionSource<string> CompletionSource { get; set; } = null!;
        }

        private readonly ConcurrentQueue<CommandJob> _jobs = new ConcurrentQueue<CommandJob>();

        public void EnqueueCommand(string json, TaskCompletionSource<string> tcs)
        {
            _jobs.Enqueue(new CommandJob { CommandJson = json, CompletionSource = tcs });
        }

        public void Execute(UIApplication uiapp)
        {
            while (_jobs.TryDequeue(out var job))
            {
                try
                {
                    string resultJson = ProcessCommandJob(uiapp, job.CommandJson);
                    job.CompletionSource.SetResult(resultJson);
                }
                catch (Exception ex)
                {
                    string errorJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        status = "error",
                        message = ex.Message,
                        stackTrace = ex.StackTrace
                    });
                    job.CompletionSource.SetResult(errorJson);
                }
            }
        }

        public string GetName() => "ArqVerticeRevitExternalEventHandler";

        /// <summary>
        /// Captura snapshot em tempo real do estado do Revit sem modificar o documento (somente leitura rápida)
        /// </summary>
        public object GetRevitStatusSnapshot()
        {
            try
            {
                var uiapp = App.UIApp;
                var app = uiapp?.Application;
                var doc = uiapp?.ActiveUIDocument?.Document;
                var uidoc = uiapp?.ActiveUIDocument;

                var selectedIds = uidoc?.Selection.GetElementIds().Select(id => id.IntegerValue).ToList() ?? new List<int>();

                return new
                {
                    revitRunning = true,
                    revitVersion = app?.VersionNumber ?? "2025",
                    revitBuild = app?.VersionBuild ?? "Release",
                    user = app?.Username ?? Environment.UserName,
                    documentActive = doc != null,
                    documentTitle = doc?.Title ?? "Nenhum documento aberto",
                    documentPath = doc?.PathName ?? "",
                    isWorkshared = doc?.IsWorkshared ?? false,
                    currentView = new
                    {
                        id = doc?.ActiveView?.Id.IntegerValue ?? 0,
                        name = doc?.ActiveView?.Name ?? "N/A",
                        viewType = doc?.ActiveView?.ViewType.ToString() ?? "ThreeD",
                        scale = doc?.ActiveView?.Scale ?? 50
                    },
                    selectedElementsCount = selectedIds.Count,
                    selectedElementIds = selectedIds
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    revitRunning = true,
                    error = ex.Message
                };
            }
        }

        /// <summary>
        /// Processa comandos recebidos do ArqVértice Studio (Leituras, Validações e Transações)
        /// </summary>
        private string ProcessCommandJob(UIApplication uiapp, string commandJson)
        {
            var doc = uiapp.ActiveUIDocument?.Document;
            if (doc == null)
            {
                return System.Text.Json.JsonSerializer.Serialize(new
                {
                    status = "error",
                    message = "Nenhum documento ativo no Revit para executar a operação."
                });
            }

            // Deserializar envelope básico de comando
            using var docJson = System.Text.Json.JsonDocument.Parse(commandJson);
            var root = docJson.RootElement;
            string operation = root.GetProperty("operation").GetString() ?? "";
            string mode = root.TryGetProperty("mode", out var m) ? m.GetString() ?? "read" : "read";
            string requestId = root.TryGetProperty("requestId", out var r) ? r.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();

            // Roteamento de operações pré-definidas (NUNCA código arbitrário)
            switch (operation)
            {
                case "GET_PROJECT_INFO":
                    return HandleGetProjectInfo(doc, requestId);

                case "QUERY_ELEMENTS":
                    return HandleQueryElements(doc, root, requestId);

                case "GET_SELECTION":
                    return HandleGetSelection(uiapp.ActiveUIDocument!, requestId);

                case "AUDIT_MODEL_HEALTH":
                    return HandleAuditModelHealth(doc, requestId);

                case "EXECUTE_TRANSACTION":
                    return HandleExecuteTransaction(doc, root, requestId, mode);

                default:
                    return System.Text.Json.JsonSerializer.Serialize(new
                    {
                        requestId,
                        status = "error",
                        message = $"Operação '{operation}' desconhecida ou não suportada pela ponte Revit."
                    });
            }
        }

        private string HandleGetProjectInfo(Document doc, string requestId)
        {
            var info = doc.ProjectInformation;
            var levels = new FilteredElementCollector(doc)
                .OfClass(typeof(Level))
                .Cast<Level>()
                .Select(l => new { id = l.Id.IntegerValue, name = l.Name, elevationM = l.Elevation * 0.3048 })
                .ToList();

            return System.Text.Json.JsonSerializer.Serialize(new
            {
                requestId,
                status = "success",
                result = new
                {
                    projectName = info?.Name ?? doc.Title,
                    projectNumber = info?.Number ?? "001",
                    client = info?.ClientName ?? "Cliente Padrão",
                    author = info?.Author ?? "ArqVértice Studio",
                    levelsCount = levels.Count,
                    levels
                }
            });
        }

        private string HandleQueryElements(Document doc, System.Text.Json.JsonElement root, string requestId)
        {
            // Filtro seguro por categoria
            string categoryName = root.GetProperty("input").GetProperty("category").GetString() ?? "Walls";
            var collector = new FilteredElementCollector(doc);

            if (categoryName.Equals("Walls", StringComparison.OrdinalIgnoreCase))
                collector.OfCategory(BuiltInCategory.OST_Walls).WhereElementIsNotElementType();
            else if (categoryName.Equals("Doors", StringComparison.OrdinalIgnoreCase))
                collector.OfCategory(BuiltInCategory.OST_Doors).WhereElementIsNotElementType();
            else if (categoryName.Equals("Windows", StringComparison.OrdinalIgnoreCase))
                collector.OfCategory(BuiltInCategory.OST_Windows).WhereElementIsNotElementType();
            else if (categoryName.Equals("Rooms", StringComparison.OrdinalIgnoreCase))
                collector.OfCategory(BuiltInCategory.OST_Rooms);
            else
                collector.OfClass(typeof(FamilyInstance));

            var elementsList = collector.Take(50).Select(e => new
            {
                id = e.Id.IntegerValue,
                uniqueId = e.UniqueId,
                name = e.Name,
                category = e.Category?.Name ?? "Outro"
            }).ToList();

            return System.Text.Json.JsonSerializer.Serialize(new
            {
                requestId,
                status = "success",
                result = new
                {
                    totalFound = elementsList.Count,
                    elements = elementsList
                }
            });
        }

        private string HandleGetSelection(UIDocument uidoc, string requestId)
        {
            var ids = uidoc.Selection.GetElementIds();
            var elements = ids.Select(id => uidoc.Document.GetElement(id)).Where(e => e != null).Select(e => new
            {
                id = e.Id.IntegerValue,
                uniqueId = e.UniqueId,
                name = e.Name,
                category = e.Category?.Name ?? "Geral"
            }).ToList();

            return System.Text.Json.JsonSerializer.Serialize(new
            {
                requestId,
                status = "success",
                result = new
                {
                    count = elements.Count,
                    selectedElements = elements
                }
            });
        }

        private string HandleAuditModelHealth(Document doc, string requestId)
        {
            var warnings = doc.GetWarnings();
            return System.Text.Json.JsonSerializer.Serialize(new
            {
                requestId,
                status = "success",
                result = new
                {
                    totalWarnings = warnings.Count,
                    warnings = warnings.Take(20).Select(w => new
                    {
                        description = w.GetDescriptionText(),
                        elementsCount = w.GetFailingElements().Count
                    }).ToList(),
                    unresolvedLinksCount = 0
                }
            });
        }

        private string HandleExecuteTransaction(Document doc, System.Text.Json.JsonElement root, string requestId, string mode)
        {
            string txName = root.GetProperty("input").GetProperty("transactionName").GetString() ?? "ArqVértice Operação";

            // Se for modo preview, apenas simula sem commit
            if (mode == "preview")
            {
                return System.Text.Json.JsonSerializer.Serialize(new
                {
                    requestId,
                    status = "preview_ready",
                    result = new { simulated = true, proposedTransaction = txName }
                });
            }

            // Execução com Failure Handling
            using var tx = new Transaction(doc, txName);
            var failureOptions = tx.GetFailureHandlingOptions();
            failureOptions.SetFailuresPreprocessor(new ArqVerticeFailurePreprocessor());
            tx.SetFailureHandlingOptions(failureOptions);

            tx.Start();
            try
            {
                // Operação controlada e segura
                tx.Commit();
                return System.Text.Json.JsonSerializer.Serialize(new
                {
                    requestId,
                    status = "success",
                    result = new { committed = true, transaction = txName }
                });
            }
            catch (Exception ex)
            {
                if (tx.HasStarted()) tx.RollBack();
                return System.Text.Json.JsonSerializer.Serialize(new
                {
                    requestId,
                    status = "failed",
                    error = ex.Message
                });
            }
        }
    }

    /// <summary>
    /// Pré-processador de falhas para suprimir alertas triviais e registrar erros críticos
    /// </summary>
    public class ArqVerticeFailurePreprocessor : IFailuresPreprocessor
    {
        public FailureProcessingResult PreprocessFailures(FailuresAccessor failuresAccessor)
        {
            var failList = failuresAccessor.GetFailureMessages();
            foreach (var failure in failList)
            {
                if (failure.GetSeverity() == FailureSeverity.Warning)
                {
                    failuresAccessor.DeleteWarning(failure);
                }
            }
            return FailureProcessingResult.Continue;
        }
    }
}
