Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$rootEnv = Join-Path $projectRoot ".env"
$rootEnvExample = Join-Path $projectRoot ".env.example"

if (-not (Test-Path $rootEnv) -and (Test-Path $rootEnvExample)) {
    Copy-Item -Path $rootEnvExample -Destination $rootEnv
    Write-Host "Created $rootEnv from .env.example"
}

$serviceEnvPairs = @(
    @{ Example = (Join-Path $projectRoot "client\.env.example"); Target = (Join-Path $projectRoot "client\.env") },
    @{ Example = (Join-Path $projectRoot "api-gateway\.env.example"); Target = (Join-Path $projectRoot "api-gateway\.env") },
    @{ Example = (Join-Path $projectRoot "ai-service\.env.example"); Target = (Join-Path $projectRoot "ai-service\.env") }
)

foreach ($pair in $serviceEnvPairs) {
    if (-not (Test-Path $pair.Target) -and (Test-Path $pair.Example)) {
        Copy-Item -Path $pair.Example -Destination $pair.Target
    }
}

Push-Location $projectRoot
try {
    docker compose up --build -d
    Write-Host ""
    Write-Host "TezFinal is starting."
    Write-Host "Frontend : http://localhost:3000"
    Write-Host "API      : http://localhost:5000"
    Write-Host "AI       : http://localhost:8000"
}
finally {
    Pop-Location
}
