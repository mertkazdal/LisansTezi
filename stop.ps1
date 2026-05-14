$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $root "logs\local"

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

    return $null
}

if (-not (Test-Path $logDir)) {
    Write-Host "No local app process logs were found."
} else {
    Get-ChildItem -Path $logDir -Filter "*.pid" | ForEach-Object {
        $name = $_.BaseName
        $pidValue = Get-Content $_.FullName -ErrorAction SilentlyContinue
        if (-not $pidValue) {
            Remove-Item $_.FullName -Force
            return
        }

        $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping $name on PID $pidValue"
            Stop-Process -Id ([int]$pidValue) -Force
        }

        Remove-Item $_.FullName -Force
    }
}

$projectPostgresDir = Join-Path $root "local-data\postgres"
if (Test-Path (Join-Path $projectPostgresDir "PG_VERSION")) {
    $pgCtl = Find-PostgresTool "pg_ctl.exe"
    if ($pgCtl) {
        & $pgCtl -D $projectPostgresDir status | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stopping project-local PostgreSQL"
            & $pgCtl -D $projectPostgresDir stop -m fast | Out-Null
        }
    }
}

Write-Host "Local app processes stopped."
