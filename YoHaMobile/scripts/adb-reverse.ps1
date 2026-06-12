$paths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "C:\Android\platform-tools\adb.exe"
)

$adb = $paths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $adb) {
    Write-Host ""
    Write-Host "ERREUR: adb introuvable." -ForegroundColor Red
    Write-Host "Installez Android Studio : https://developer.android.com/studio"
    Write-Host "Puis SDK Manager -> Android SDK Platform-Tools"
    Write-Host ""
    exit 1
}

Write-Host "Utilisation de: $adb"
& $adb devices
& $adb reverse tcp:8000 tcp:8000
& $adb reverse tcp:8081 tcp:8081
Write-Host ""
Write-Host "OK - le telephone voit Django sur http://127.0.0.1:8000" -ForegroundColor Green