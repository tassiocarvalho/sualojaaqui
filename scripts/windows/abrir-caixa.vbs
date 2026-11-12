' Roda o abrir-caixa.ps1 (mesma pasta) sem mostrar a janela do PowerShell.
Set fso = CreateObject("Scripting.FileSystemObject")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & pasta & "\abrir-caixa.ps1""", 0, False
