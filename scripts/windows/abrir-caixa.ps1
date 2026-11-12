# Abre a frente de caixa com impressão direta (sem a janela de impressão do navegador).
# Se o sistema não estiver no ar, inicia com "npm start" numa janela minimizada e espera ficar pronto.
# Normalmente é chamado pelo atalho criado por criar-atalho-caixa.ps1 (via abrir-caixa.vbs, sem piscar janela).
$ErrorActionPreference = 'SilentlyContinue'
$Projeto = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Icone   = Join-Path $Projeto 'apps\desktop\build\icon.ico'
# Perfil separado do navegador: o --kiosk-printing só vale quando o navegador é aberto com ele,
# e um perfil próprio garante isso mesmo com o navegador normal já aberto.
$Perfil  = Join-Path $env:LOCALAPPDATA 'SuaLojaAqui\chrome-caixa'
$env:Path = "$env:ProgramFiles\nodejs;$env:Path"

$Navegador = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
if (-not $Navegador) {
  [Windows.Forms.MessageBox]::Show('Instale o Google Chrome ou o Microsoft Edge.', 'SuaLojaAqui', 'OK', 'Error') | Out-Null
  exit 1
}

function No-Ar([string]$url) {
  try { (Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 3).StatusCode -eq 200 } catch { $false }
}
function Abrir([string]$base) {
  Start-Process $Navegador -ArgumentList @('--kiosk-printing', "--user-data-dir=`"$Perfil`"", '--no-first-run', "--app=$base/caixa")
}

# 1. Já está rodando? (5173 = npm run dev; 3000 = npm start)
foreach ($base in 'http://localhost:5173', 'http://localhost:3000') {
  if (No-Ar "$base/caixa") { Abrir $base; exit }
}

# 2. Não está: inicia o sistema numa janela minimizada (fechar essa janela desliga o sistema).
$cmd = "title SuaLojaAqui - servidor (nao feche) && cd /d `"$Projeto`" && " +
       "(if not exist apps\web\dist\index.html call npm run build) && " +
       "call npm run db:deploy -w @vl/api && npm start"
Start-Process cmd.exe -ArgumentList '/k', $cmd -WindowStyle Minimized

# Aviso enquanto inicia.
$f = New-Object Windows.Forms.Form
$f.Text = 'SuaLojaAqui'; $f.Size = New-Object Drawing.Size(360, 120); $f.StartPosition = 'CenterScreen'
$f.FormBorderStyle = 'FixedDialog'; $f.ControlBox = $false; $f.TopMost = $true
if (Test-Path $Icone) { $f.Icon = New-Object Drawing.Icon($Icone) }
$l = New-Object Windows.Forms.Label
$l.Text = 'Iniciando o sistema, aguarde...'; $l.Dock = 'Fill'; $l.TextAlign = 'MiddleCenter'
$l.Font = New-Object Drawing.Font('Segoe UI', 11)
$f.Controls.Add($l); $f.Show(); [Windows.Forms.Application]::DoEvents()

# 3. Espera o sistema responder (até 5 minutos; a primeira vez pode compilar) e abre o caixa.
$limite = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $limite) {
  if (No-Ar 'http://localhost:3000/caixa') { $f.Close(); Abrir 'http://localhost:3000'; exit }
  for ($i = 0; $i -lt 10; $i++) { Start-Sleep -Milliseconds 200; [Windows.Forms.Application]::DoEvents() }
}
$f.Close()
[Windows.Forms.MessageBox]::Show("O sistema não respondeu em 5 minutos.`nVeja a janela 'SuaLojaAqui - servidor' na barra de tarefas.", 'SuaLojaAqui', 'OK', 'Warning') | Out-Null
