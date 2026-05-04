$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

function Test-DockerEngine {
    try {
        $oldPref = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        docker info 2>&1 | Out-Null
        $ErrorActionPreference = $oldPref
    } catch {}
    return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerEngine)) {
    $dockerDesktop = Join-Path $Env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktop) {
        Write-Host "Docker engine is not ready. Starting Docker Desktop..."
        Start-Process -FilePath $dockerDesktop | Out-Null
    }

    $deadline = (Get-Date).AddMinutes(2)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 5
        if (Test-DockerEngine) {
            break
        }
    }
}

if (-not (Test-DockerEngine)) {
    throw "Docker engine could not be reached. Start Docker Desktop and try again."
}

docker compose up --build -d
docker compose ps

Write-Host ""
Write-Host "Frontend : http://localhost:3000"
Write-Host "API      : http://localhost:5000"
Write-Host "AI       : http://localhost:8000"
