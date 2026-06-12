# Active les chemins longs Windows (>260 caracteres) — necessite PowerShell Admin
# Usage: clic droit PowerShell -> Executer en tant qu'administrateur

$path = "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem"
$current = Get-ItemProperty -Path $path -Name "LongPathsEnabled" -ErrorAction SilentlyContinue

if ($current.LongPathsEnabled -eq 1) {
    Write-Host "Chemins longs deja actives." -ForegroundColor Green
    exit 0
}

try {
    New-ItemProperty -Path $path -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force | Out-Null
    Write-Host "Chemins longs actives. Redemarrez le PC puis relancez npm run device." -ForegroundColor Green
} catch {
    Write-Host "ERREUR: lancez ce script en administrateur." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
