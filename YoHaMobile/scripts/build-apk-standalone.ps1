# APK YouHa autonome — l'app s'ouvre directement (pas d'ecran "npx expo start")
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-apk-standalone.ps1

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

Write-Host ">> Compilation release (JS integre dans l'APK)..." -ForegroundColor Cyan
Write-Host "   Fermez Android Studio. Un seul terminal de build." -ForegroundColor DarkGray
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon --no-parallel

$apk = Join-Path $buildRoot "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
    $full = Resolve-Path $apk
    Write-Host ""
    Write-Host "APK YouHa pret (app autonome) :" -ForegroundColor Green
    Write-Host $full
    Write-Host ""
    Write-Host "Installez sur le telephone :"
    Write-Host "  adb install -r `"$full`""
} else {
    Write-Host "Echec: APK release introuvable" -ForegroundColor Red
    exit 1
}
