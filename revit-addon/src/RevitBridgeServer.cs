using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.Revit.UI;

namespace ArqVertice.Revit
{
    /// <summary>
    /// Servidor TCP embutido para comunicação segura em localhost com o ArqVértice Studio.
    /// Usa mensagens JSON delimitadas por linha, validação de token e envelopes de comandos.
    /// </summary>
    public class RevitBridgeServer
    {
        private TcpListener? _listener;
        private readonly RevitExternalEventHandler _eventHandler;
        private readonly ExternalEvent _externalEvent;
        private static readonly HashSet<string> AllowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        };
        private CancellationTokenSource? _cts;
        private string _sessionToken = Guid.NewGuid().ToString("N");

        public string SessionToken => _sessionToken;

        public RevitBridgeServer(RevitExternalEventHandler eventHandler, ExternalEvent externalEvent)
        {
            _eventHandler = eventHandler;
            _externalEvent = externalEvent;
        }

        public void Start(int port = 4848)
        {
            try
            {
                _cts = new CancellationTokenSource();
            _listener = new TcpListener(IPAddress.Loopback, port);
                _listener.Start();

                Task.Run(() => ListenLoop(_cts.Token));
            }
            catch (Exception ex)
            {
                // Em caso de porta ocupada ou restrição de privilégio
                System.Diagnostics.Debug.WriteLine($"[RevitBridgeServer] Falha ao iniciar: {ex.Message}");
            }
        }

        public void Stop()
        {
            try
            {
                _cts?.Cancel();
                _listener?.Stop();
            }
            catch { }
        }

        private async Task ListenLoop(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested && _listener != null)
            {
                try
                {
                    var client = await _listener.AcceptTcpClientAsync();
                    _ = ProcessClientAsync(client, ct);
                }
                catch when (ct.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[RevitBridgeServer] Erro no loop de escuta: {ex.Message}");
                }
            }
        }

        private async Task ProcessClientAsync(TcpClient client, CancellationToken ct)
        {
            using (client)
            using (var stream = client.GetStream())
            using (var reader = new StreamReader(stream, Encoding.UTF8, false, 8192, true))
            using (var writer = new StreamWriter(stream, new UTF8Encoding(false), 8192, true) { AutoFlush = true })
            try
            {
                string? line;
                while (!ct.IsCancellationRequested && (line = await reader.ReadLineAsync()) != null)
                {
                    using var request = System.Text.Json.JsonDocument.Parse(line);
                    var root = request.RootElement;
                    string operation = root.TryGetProperty("operation", out var operationValue) ? operationValue.GetString() ?? "" : "";
                    if (operation == "STATUS")
                    {
                        await writer.WriteLineAsync(System.Text.Json.JsonSerializer.Serialize(new
                        {
                            status = "success", revitRunning = true, sessionToken = _sessionToken,
                            data = _eventHandler.GetRevitStatusSnapshot()
                        }));
                        continue;
                    }

                    string clientToken = root.TryGetProperty("sessionToken", out var tokenValue) ? tokenValue.GetString() ?? "" : "";
                    if (clientToken != _sessionToken)
                    {
                        await writer.WriteLineAsync("{\"status\":\"error\",\"message\":\"Token de sessao invalido.\"}");
                        continue;
                    }

                    var tcs = new TaskCompletionSource<string>();
                    _eventHandler.EnqueueCommand(line, tcs);
                    _externalEvent.Raise();
                    var completed = await Task.WhenAny(tcs.Task, Task.Delay(TimeSpan.FromSeconds(30), ct));
                    await writer.WriteLineAsync(completed == tcs.Task
                        ? await tcs.Task
                        : "{\"status\":\"error\",\"message\":\"Timeout aguardando ExternalEvent do Revit.\"}");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[RevitBridgeServer] Erro no cliente: {ex.Message}");
            }
        }
    }
}
