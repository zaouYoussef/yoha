# Installe le dernier APK YouHa sur le telephone USB
$ErrorActionPreference = "Stop"

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { throw "adb introuvable" }

$release = "C:\yh\android\app\build\outputs\apk\release\app-release.apk"
$debug = "C:\yh\android\app\build\outputs\apk\debug\app-debug.apk"

if (Test-Path $release) {
    $apk = $release
    Write-Host "Installation APK release (app autonome)..." -ForegroundColor Green
} elseif (Test-Path $debug) {
    $apk = $debug
    Write-Host "ATTENTION: APK debug dev-client — lancez aussi: npm run start:dev" -ForegroundColor Yellow
} else {
    throw "Aucun APK. Lancez: npm run build:apk:app"
}

& $adb devices
& $adb install -r $apk
Write-Host "OK — YouHa installe." -ForegroundColor Green
