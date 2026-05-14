$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Normalize-ProcessPath {
    $pathValue = [Environment]::GetEnvironmentVariable("Path", "Process")
    if ([string]::IsNullOrWhiteSpace($pathValue)) {
        $pathValue = [Environment]::GetEnvironmentVariable("PATH", "Process")
    }

    if (-not [string]::IsNullOrWhiteSpace($pathValue)) {
        [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
        [Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")
    }
}

Normalize-ProcessPath

& ".\setup-local.ps1" -SkipDependencies

function Import-DotEnv {
    param([string]$Path)

    Get-Content -Path $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($name) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Get-EnvOrDefault {
    param([string]$Name, [string]$Default)

    $value = [Environment]::GetEnvironmentVariable($Name, "Process")
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $Default
    }

    return $value
}

function Start-TrackedProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string]$ArgumentList,
        [string]$WorkingDirectory
    )

    $logDir = Join-Path $root "logs\local"
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null

    $pidFile = Join-Path $logDir "$Name.pid"
    if (Test-Path $pidFile) {
        $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
        if ($oldPid) {
            $oldProcess = Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
            if ($oldProcess) {
                Write-Host "$Name is already running on PID $oldPid"
                return
            }
        }
    }

    $stdout = Join-Path $logDir "$Name.out.log"
    $stderr = Join-Path $logDir "$Name.err.log"
    $process = Start-Process -FilePath $FilePath `
        -ArgumentList $ArgumentList `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -PassThru `
        -WindowStyle Hidden

    Set-Content -Path $pidFile -Value $process.Id
    Write-Host "Started $Name on PID $($process.Id)"
}

Import-DotEnv ".env"

$postgresDb = Get-EnvOrDefault "POSTGRES_DB" "moodlens"
$postgresUser = Get-EnvOrDefault "POSTGRES_USER" "postgres"
$postgresPassword = Get-EnvOrDefault "POSTGRES_PASSWORD" "postgres"
$env:DATABASE_URL = "Host=localhost;Port=5432;Database=$postgresDb;Username=$postgresUser;Password=$postgresPassword"
$env:AI_SERVICE_URL = "http://localhost:8000"
$env:AI_SERVICE_TIMEOUT_SECONDS = Get-EnvOrDefault "AI_SERVICE_TIMEOUT_SECONDS" "180"
$env:ASPNETCORE_URLS = "http://localhost:5000"
$env:ASPNETCORE_ENVIRONMENT = Get-EnvOrDefault "ASPNETCORE_ENVIRONMENT" "Development"
$env:VITE_API_BASE_URL = Get-EnvOrDefault "VITE_API_BASE_URL" "http://localhost:5000"
Normalize-ProcessPath

$venvPython = Join-Path $root "ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    throw "AI virtual environment is missing. Run .\setup-local.ps1 first."
}

if (-not (Test-Path "client\node_modules")) {
    throw "Frontend dependencies are missing. Run .\setup-local.ps1 first."
}

Start-TrackedProcess -Name "ai-service" -FilePath $venvPython -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $root "ai-service")
Start-TrackedProcess -Name "api-gateway" -FilePath "dotnet" -ArgumentList "run --project api-gateway\MoodLens.ApiGateway.csproj" -WorkingDirectory $root
Start-TrackedProcess -Name "client" -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --host 0.0.0.0" -WorkingDirectory (Join-Path $root "client")

Write-Host ""
Write-Host "Local app is starting without Docker."
Write-Host "Frontend : http://localhost:5173"
Write-Host "API      : http://localhost:5000"
Write-Host "AI       : http://localhost:8000"
Write-Host "Logs     : $root\logs\local"
