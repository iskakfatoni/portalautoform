using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("PORTAL AutoForm")]
[assembly: AssemblyDescription("Aplikasi Desktop Standalone PORTAL:AutoForm SMKN 1 Jetis")]
[assembly: AssemblyCompany("SMKN 1 Jetis Mojokerto")]
[assembly: AssemblyProduct("PORTAL AutoForm")]
[assembly: AssemblyCopyright("Copyright © 2026 Iskak Fatoni")]
[assembly: AssemblyFileVersion("3.3.0.0")]
[assembly: AssemblyVersion("3.3.0.0")]

namespace PortalAutoForm
{
    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        private const string BASE_URL = "https://iskakfatoni.github.io/portalautoform/autoform.html";

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                if (Environment.OSVersion.Version.Major >= 6)
                {
                    SetProcessDPIAware();
                }
            }
            catch { }

            string targetUrl = BASE_URL;

            // Dukungan Parameter Baris Perintah (Custom URL atau NIP Langsung)
            if (args != null && args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
            {
                string arg0 = args[0].Trim();
                if (arg0.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                    arg0.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    targetUrl = arg0;
                }
                else
                {
                    long dummyVal;
                    if (arg0.Length >= 4 && long.TryParse(arg0, out dummyVal))
                    {
                        // Parameter NIP Guru
                        targetUrl = "https://iskakfatoni.github.io/portalautoform/asset/pages/portal.html?nip=" + Uri.EscapeDataString(arg0);
                    }
                }
            }

            string appArgs = "--app=" + targetUrl + " --window-size=1280,850 --disable-features=Translate";

            string[] candidateBrowsers = new string[]
            {
                // Microsoft Edge (Pre-installed pada seluruh Windows 10 & 11)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                
                // Google Chrome
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),

                // Brave Browser
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"BraveSoftware\Brave-Browser\Application\brave.exe")
            };

            bool isLaunched = false;
            foreach (string browserPath in candidateBrowsers)
            {
                if (File.Exists(browserPath))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = browserPath,
                            Arguments = appArgs,
                            UseShellExecute = true,
                            WindowStyle = ProcessWindowStyle.Normal
                        };
                        Process.Start(psi);
                        isLaunched = true;
                        break;
                    }
                    catch
                    {
                        // Coba browser kandidat berikutnya
                    }
                }
            }

            if (!isLaunched)
            {
                // Fallback 1: Coba eksekusi msedge / chrome via PATH
                string[] directExecutables = new string[] { "msedge.exe", "chrome.exe", "brave.exe" };
                foreach (string exeName in directExecutables)
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = exeName,
                            Arguments = appArgs,
                            UseShellExecute = true
                        };
                        Process.Start(psi);
                        isLaunched = true;
                        break;
                    }
                    catch { }
                }
            }

            if (!isLaunched)
            {
                // Fallback 2: Buka melalui default browser sistem
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = targetUrl,
                        UseShellExecute = true
                    });
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Gagal meluncurkan aplikasi PORTAL AutoForm:\n" + ex.Message, 
                                    "PORTAL:AutoForm Error", 
                                    MessageBoxButtons.OK, 
                                    MessageBoxIcon.Error);
                }
            }
        }
    }
}
