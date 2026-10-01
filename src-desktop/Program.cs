using System;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Diagnostics;
using System.Threading;
using System.Reflection;
using System.Windows.Forms;

namespace HisabKitab360
{
    static class Program
    {
        private static HttpListener listener;
        private static string webRoot;
        private static volatile bool isRunning = true;

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HisabKitab360");
                webRoot = Path.Combine(appDataDir, "www");

                string localDist = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist");
                if (Directory.Exists(localDist) && File.Exists(Path.Combine(localDist, "index.html")))
                {
                    webRoot = localDist;
                }
                else
                {
                    if (!Directory.Exists(webRoot) || !File.Exists(Path.Combine(webRoot, "index.html")))
                    {
                        Directory.CreateDirectory(webRoot);
                        Assembly assembly = Assembly.GetExecutingAssembly();
                        using (Stream stream = assembly.GetManifestResourceStream("app.zip"))
                        {
                            if (stream != null)
                            {
                                string tempZip = Path.Combine(appDataDir, "temp_app.zip");
                                using (FileStream fileStream = File.Create(tempZip))
                                {
                                    stream.CopyTo(fileStream);
                                }
                                ZipFile.ExtractToDirectory(tempZip, webRoot);
                                try { File.Delete(tempZip); } catch { }
                            }
                        }
                    }
                }

                int port = GetFreePort();
                string url = "http://127.0.0.1:" + port + "/";

                listener = new HttpListener();
                listener.Prefixes.Add(url);
                listener.Start();

                Thread serverThread = new Thread(ServerLoop);
                serverThread.IsBackground = true;
                serverThread.Start();

                string browserPath = FindBrowser();
                string userDataDir = Path.Combine(appDataDir, "BrowserProfile");

                Process browserProc = null;
                if (!string.IsNullOrEmpty(browserPath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = browserPath,
                        Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1366,850", url, userDataDir),
                        UseShellExecute = false
                    };
                    browserProc = Process.Start(psi);
                }
                else
                {
                    Process.Start(url);
                }

                if (browserProc != null)
                {
                    browserProc.WaitForExit();
                }
                else
                {
                    Thread.Sleep(5000);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("হিসাবকিতাব ৩৬০ চালু হতে সমস্যা হয়েছে: " + ex.Message, "HisabKitab 360", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                isRunning = false;
                try { if (listener != null) listener.Stop(); } catch { }
            }
        }

        private static int GetFreePort()
        {
            TcpListener l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        private static string FindBrowser()
        {
            string[] paths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void ServerLoop()
        {
            while (isRunning && listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(HandleRequest, context);
                }
                catch
                {
                    if (!isRunning) break;
                }
            }
        }

        private static void HandleRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string rawUrl = context.Request.Url.AbsolutePath;
                if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl)) rawUrl = "/index.html";
                string localPath = Path.Combine(webRoot, rawUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

                if (!File.Exists(localPath))
                {
                    localPath = Path.Combine(webRoot, "index.html");
                }

                if (File.Exists(localPath))
                {
                    byte[] bytes = File.ReadAllBytes(localPath);
                    context.Response.ContentType = GetMimeType(localPath);
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.StatusCode = 200;
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
                context.Response.OutputStream.Close();
            }
            catch { }
        }

        private static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLower();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".woff2": return "font/woff2";
                case ".woff": return "font/woff";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }
    }
}
