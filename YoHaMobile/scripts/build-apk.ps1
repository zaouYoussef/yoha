# APK debug DEV CLIENT — ecran "npx expo start" sans Metro
# Pour l'app reelle sur le telephone : npm run build:apk:app
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

. "$PSScriptRoot\android-env.ps1" -ProjectRoot $root

$buildRoot = Sync-ToShortBuildPath -Source $root
$androidDir = Join-Path $buildRoot "android"
Write-Host "JAVA_HOME -> $env:JAVA_HOME" -ForegroundColor Cyan

if (-not (Test-Path $androidDir)) {
    Write-Host ">> expo prebuild..." -ForegroundColor Cyan
    Set-Location $buildRoot
    npx expo prebuild --platform android
}

Stop-AndroidBuildProcesses -AndroidDir $androidDir
Clear-AndroidBuildLocks -Root $buildRoot

Set-Location $androidDir

Write-Host ">> gradle assembleDebug (5-10 min si deja compile une fois)..." -ForegroundColor Cyan
Write-Host "   Fermez Android Studio. Un seul terminal de build." -ForegroundColor DarkGray
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon --no-parallel

$apk = Join-Path $buildRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $full = Resolve-Path $apk
    Write-Host ""
    Write-Host "APK dev-client pret (PAS l'app finale) :" -ForegroundColor Yellow
    Write-Host $full
    Write-Host ""
    Write-Host "Cet APK affiche 'npx expo start' sans Metro."
    Write-Host "Pour l'app YouHa autonome : npm run build:apk:app"
} else {
    Write-Host "Echec: APK introuvable" -ForegroundColor Red
    exit 1
}
