# Installe et lance YouHa sur le telephone USB (JDK 21 requis pour Gradle)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/run-device.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

. "$PSScriptRoot\android-env.ps1" -ProjectRoot $root

$buildRoot = Sync-ToShortBuildPath -Source $root
$androidDir = Join-Path $buildRoot "android"
Write-Host "JAVA_HOME -> $env:JAVA_HOME" -ForegroundColor Cyan

Stop-AndroidBuildProcesses -AndroidDir $androidDir
Clear-AndroidBuildLocks -Root $buildRoot

Set-Location $buildRoot

& "$PSScriptRoot\adb-reverse.ps1"

Write-Host ">> Compilation + installation (5-10 min si deja compile une fois)..." -ForegroundColor Cyan
Write-Host "   Fermez Android Studio. Un seul terminal de build." -ForegroundColor DarkGray
npx expo run:android --device
