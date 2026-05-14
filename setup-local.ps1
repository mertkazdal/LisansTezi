param(
    [switch]$SkipDependencies
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

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

function Find-PostgresTool {
    param([string]$ToolName)

    $command = Get-Command $ToolName -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = Get-ChildItem -Path "$Env:ProgramFiles\PostgreSQL" -Recurse -Filter $ToolName -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending

    if ($candidates) {
        return $candidates[0].FullName
    }

    throw "$ToolName was not found. Install PostgreSQL or add its bin folder to PATH."
}

function Test-PostgresConnection {
    param([string]$Psql, [string]$User, [string]$Password)

    $env:PGPASSWORD = $Password
    & $Psql -h localhost -p 5432 -U $User -d postgres -tAc "SELECT 1;" | Out-Null
    return $LASTEXITCODE -eq 0
}

function Start-UserPostgres {
    $pgCtl = Find-PostgresTool "pg_ctl.exe"
    $initDb = Find-PostgresTool "initdb.exe"
    $postgresUser = Get-EnvOrDefault "POSTGRES_USER" "postgres"
    $postgresPassword = Get-EnvOrDefault "POSTGRES_PASSWORD" "postgres"
    $dataDir = Join-Path $root "local-data\postgres"
    $logDir = Join-Path $root "logs\local"

    New-Item -ItemType Directory -Force -Path $logDir | Out-Null

    if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
        Write-Host "Creating project-local PostgreSQL data folder..."
        New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
        $passwordFile = Join-Path $logDir "postgres-password.tmp"

        try {
            Set-Content -Path $passwordFile -Value $postgresPassword -NoNewline
            & $initDb -D $dataDir -U $postgresUser --auth=scram-sha-256 --encoding=UTF8 --locale=C --pwfile=$passwordFile
            if ($LASTEXITCODE -ne 0) {
                throw "initdb failed."
            }
        } finally {
            Remove-Item $passwordFile -Force -ErrorAction SilentlyContinue
        }
    }

    $pidFile = Join-Path $dataDir "postmaster.pid"
    if (Test-Path $pidFile) {
        $existingPid = (Get-Content $pidFile -First 1 -ErrorAction SilentlyContinue)
        if ($existingPid) {
            $existingProcess = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
            if ($existingProcess -and $existingProcess.ProcessName -like "postgres*") {
                return
            }
        }
    }

    & $pgCtl -D $dataDir status | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Starting project-local PostgreSQL on port 5432..."
        $postgresLog = Join-Path $logDir "postgres.out.log"
        & $pgCtl -D $dataDir -l $postgresLog -o "-p 5432" start
        if ($LASTEXITCODE -ne 0) {
            throw "Could not start project-local PostgreSQL. See $postgresLog"
        }
    }
}

function Ensure-Postgres {
    $postgresDb = Get-EnvOrDefault "POSTGRES_DB" "moodlens"
    $postgresUser = Get-EnvOrDefault "POSTGRES_USER" "postgres"
    $postgresPassword = Get-EnvOrDefault "POSTGRES_PASSWORD" "postgres"
    $psql = Find-PostgresTool "psql.exe"

    if (-not (Test-PostgresConnection $psql $postgresUser $postgresPassword)) {
        $service = Get-Service | Where-Object { $_.Name -like "postgresql*" -or $_.DisplayName -like "*PostgreSQL*" } | Select-Object -First 1
        if ($service -and $service.Status -ne "Running") {
            try {
                Write-Host "Starting PostgreSQL service: $($service.Name)"
                Start-Service $service.Name
                $service.WaitForStatus("Running", "00:00:30")
            } catch {
                Write-Host "PostgreSQL service could not start; using project-local PostgreSQL instead."
                Start-UserPostgres
            }
        } elseif (-not $service) {
            Write-Host "PostgreSQL service was not found; using project-local PostgreSQL instead."
            Start-UserPostgres
        }
    }

    $ready = $false
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        if (Test-PostgresConnection $psql $postgresUser $postgresPassword) {
            $ready = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $ready) {
        throw "Could not connect to local PostgreSQL as '$postgresUser'. Check POSTGRES_USER/POSTGRES_PASSWORD in .env."
    }

    $exists = & $psql -h localhost -p 5432 -U $postgresUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$postgresDb';"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not check PostgreSQL database '$postgresDb'."
    }

    if ([string]::IsNullOrWhiteSpace($exists)) {
        Write-Host "Creating PostgreSQL database: $postgresDb"
        & $psql -h localhost -p 5432 -U $postgresUser -d postgres -c "CREATE DATABASE `"$postgresDb`";"
        if ($LASTEXITCODE -ne 0) {
            throw "Could not create PostgreSQL database '$postgresDb'."
        }
    }
}

function Install-FrontendDependencies {
    if (Test-Path "client\node_modules") {
        return
    }

    Write-Host "Installing frontend dependencies..."
    Push-Location "client"
    try {
        cmd /c npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed."
        }
    } finally {
        Pop-Location
    }
}

function Install-AiDependencies {
    $venvPython = Join-Path $root "ai-service\.venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        Write-Host "Creating AI service virtual environment..."
        python -m venv "ai-service\.venv"
    }

    Write-Host "Installing AI service dependencies..."
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r "ai-service\requirements.txt"
}

function Restore-ApiGateway {
    Write-Host "Restoring API gateway dependencies..."
    dotnet restore "api-gateway\MoodLens.ApiGateway.csproj"
}

Import-DotEnv ".env"
Ensure-Postgres

$postgresDb = Get-EnvOrDefault "POSTGRES_DB" "moodlens"
$postgresUser = Get-EnvOrDefault "POSTGRES_USER" "postgres"
$postgresPassword = Get-EnvOrDefault "POSTGRES_PASSWORD" "postgres"
$env:DATABASE_URL = "Host=localhost;Port=5432;Database=$postgresDb;Username=$postgresUser;Password=$postgresPassword"
$env:AI_SERVICE_URL = "http://localhost:8000"
$env:AI_SERVICE_TIMEOUT_SECONDS = Get-EnvOrDefault "AI_SERVICE_TIMEOUT_SECONDS" "180"
$env:ASPNETCORE_URLS = "http://localhost:5000"
$env:ASPNETCORE_ENVIRONMENT = Get-EnvOrDefault "ASPNETCORE_ENVIRONMENT" "Development"
$env:VITE_API_BASE_URL = Get-EnvOrDefault "VITE_API_BASE_URL" "http://localhost:5000"

if (-not $SkipDependencies) {
    Install-FrontendDependencies
    Install-AiDependencies
    Restore-ApiGateway
}

Write-Host "Local setup is ready."
