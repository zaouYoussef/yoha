# Exécuter en PowerShell ADMINISTRATEUR (clic droit → Exécuter en tant qu'admin)
# Autorise les téléphones sur le même Wi-Fi à joindre Django (port 8000)

$ruleName = "YouHa Django 8000"
$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "La règle '$ruleName' existe déjà."
} else {
    netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=8000
    Write-Host "Pare-feu ouvert pour le port 8000."
}
Write-Host ""
Write-Host "Test sur le téléphone (Chrome) :"
Write-Host "  http://192.168.0.231:8000/api/v1/restaurants/"
