# Environnement Android commun (JDK 21, SDK, copie courte C:\yh pour Windows)
param(
    [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent)
)

$script:ShortBuildPath = "C:\yh"

function Set-AndroidBuildEnv {
    param([string]$Root)

    $sdk = "$env:LOCALAPPDATA\Android\Sdk"
    $env:ANDROID_HOME = $sdk

    $localProps = Join-Path $Root "android\local.properties"
    $sdkEscaped = $sdk -replace '\\', '/'
    "sdk.dir=$sdkEscaped" | Set-Content -Path $localProps -Encoding ASCII

    $jbr = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path "$jbr\bin\java.exe") {
        $env:JAVA_HOME = $jbr
    } else {
        throw "JDK Android Studio introuvable: $jbr"
    }
}

function Clear-NativeBuildCaches {
    param([string]$Root)

    Get-ChildItem -Path $Root -Directory -Recurse -Filter ".cxx" -ErrorAction SilentlyContinue |
        ForEach-Object {
            $long = "\\?\$($_.FullName)"
            cmd /c "rmdir /s /q `"$long`"" 2>$null | Out-Null
        }
}

function Stop-AndroidBuildProcesses {
    param([string]$AndroidDir)

    Write-Host ">> Arret des processus Gradle/Kotlin..." -ForegroundColor Cyan
    Push-Location $AndroidDir
    .\gradlew.bat --stop 2>$null | Out-Null
    Pop-Location
    Start-Sleep -Seconds 5

    Get-Process -Name "java" -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowTitle -eq '' } |
        ForEach-Object {
            try {
                $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
                if ($cmd -match 'gradle|kotlin.*daemon|GradleDaemon') {
                    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
    Start-Sleep -Seconds 2
}

function Clear-AndroidBuildLocks {
    param([string]$Root)

    $targets = @(
        "android\app\build\intermediates\classes",
        "android\app\build\intermediates\transforms",
        "android\app\build\tmp",
        "android\build\kotlin"
    )
    foreach ($rel in $targets) {
        $path = Join-Path $Root $rel
        if (Test-Path $path) {
            cmd /c "rmdir /s /q `"$path`"" 2>$null | Out-Null
        }
    }
}

function Sync-ToShortBuildPath {
    param([string]$Source)

    $dest = $script:ShortBuildPath
    $source = (Resolve-Path $Source).Path

    if ($source -eq $dest) {
        return $dest
    }

    $excludeDirs = @(
        "node_modules",
        "android\app\.cxx",
        "android\app\build",
        "android\.gradle",
        "android\build",
        ".expo"
    )
    $xd = ($excludeDirs | ForEach-Object { "/XD", $_ }) -join " "

    if (-not (Test-Path (Join-Path $dest "package.json"))) {
        Write-Host ">> Premiere compilation: copie vers $dest (chemins Windows trop longs sinon)..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        cmd /c "robocopy `"$source`" `"$dest`" /E $xd /NFL /NDL /NJH /NJS /NP" | Out-Null
        Push-Location $dest
        npm install --no-fund --no-audit
        Pop-Location
    } else {
        cmd /c "robocopy `"$source`" `"$dest`" /E $xd /XO /NFL /NDL /NJH /NJS /NP" | Out-Null
    }

    Set-AndroidBuildEnv -Root $dest

    Write-Host "Build depuis: $dest" -ForegroundColor Cyan
    return $dest
}
