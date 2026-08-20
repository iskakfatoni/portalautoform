using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("PORTAL AutoForm")]
[assembly: AssemblyDescription("Launcher Portal AutoFill Google Form SMKN 1 Jetis")]
[assembly: AssemblyCompany("SMKN 1 Jetis Mojokerto")]
[assembly: AssemblyProduct("PORTAL AutoForm")]
[assembly: AssemblyCopyright("Copyright © 2026 Iskak Fatoni")]
[assembly: AssemblyFileVersion("3.2.0.0")]
[assembly: AssemblyVersion("3.2.0.0")]

namespace PortalAutoForm
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            string url = "https://iskakfatoni.github.io/portalautoform/autoform.html";
            if (args != null && args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
            {
                url = args[0];
            }

            string appArg = "--app=" + url;

            string[] candidatePaths = new string[]
            {
                // Edge (64-bit / 32-bit)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                
                // Chrome (64-bit / 32-bit / LocalAppData)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),

                // Brave (64-bit / LocalAppData)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"BraveSoftware\Brave-Browser\Application\brave.exe")
            };

            bool launched = false;
            foreach (string browserPath in candidatePaths)
            {
                if (File.Exists(browserPath))
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = browserPath,
                            Arguments = appArg,
                            UseShellExecute = true
                        });
                        launched = true;
                        break;
                    }
                    catch
                    {
                        // Coba kandidat berikutnya jika gagal
                    }
                }
            }

            if (!launched)
            {
                // Coba panggil binary langsung dari PATH
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "msedge.exe",
                        Arguments = appArg,
                        UseShellExecute = true
                    });
                    launched = true;
                }
                catch
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "chrome.exe",
                            Arguments = appArg,
                            UseShellExecute = true
                        });
                        launched = true;
                    }
                    catch
                    {
                        // Fallback terakhir: buka URL dengan browser default sistem
                        try
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = url,
                                UseShellExecute = true
                            });
                            launched = true;
                        }
                        catch (Exception ex)
                        {
                            MessageBox.Show("Gagal membuka peramban: " + ex.Message, "PORTAL AutoForm", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        }
                    }
                }
            }
        }
    }
}
