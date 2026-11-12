# Cria na Área de Trabalho o atalho "SuaLojaAqui - Caixa" (ícone do sistema), que abre o caixa
# com impressão direta e liga o sistema se ele estiver desligado.
# Uso (PowerShell, na raiz do projeto):  powershell -ExecutionPolicy Bypass -File scripts\windows\criar-atalho-caixa.ps1
$Projeto = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Atalho  = Join-Path ([Environment]::GetFolderPath('Desktop')) 'SuaLojaAqui - Caixa.lnk'

$s = (New-Object -ComObject WScript.Shell).CreateShortcut($Atalho)
$s.TargetPath       = "$env:WINDIR\System32\wscript.exe"
$s.Arguments        = "`"$PSScriptRoot\abrir-caixa.vbs`""
$s.WorkingDirectory = $Projeto
$s.IconLocation     = "$Projeto\apps\desktop\build\icon.ico,0"
$s.Description      = 'Abre o caixa (liga o sistema se estiver desligado) com impressão direta'
$s.Save()
Write-Host "Atalho criado: $Atalho"
Write-Host 'A impressão sai direto na impressora PADRÃO do Windows (Configurações > Impressoras).'
