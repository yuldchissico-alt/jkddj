# Script para iniciar o backend com Supabase
# Se já estiver definido no .env, não sobrescrever; caso contrário, usar o pooler do Supabase
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://postgres.adrpyuedsyeohdhlnecj:5Y2c.EFh%24mU%40W7B@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
}
if (-not $env:SECRET_KEY) {
    $env:SECRET_KEY = "convergeai-secret-key-change-in-production"
}
if (-not $env:META_GRAPH_API_VERSION) {
    $env:META_GRAPH_API_VERSION = "v25.0"
}

Write-Host "Iniciando backend do Log Pose..."
Write-Host "Banco: Supabase (Pooler)"
Write-Host "URL: http://localhost:8000"
Write-Host ""

$pythonCmd = "python"
if (Test-Path "..\.venv\Scripts\python.exe") {
    $pythonCmd = "..\.venv\Scripts\python.exe"
} elseif (Test-Path ".\.venv\Scripts\python.exe") {
    $pythonCmd = ".\.venv\Scripts\python.exe"
}

& $pythonCmd -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
