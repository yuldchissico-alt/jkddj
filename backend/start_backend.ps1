# Script para iniciar o backend com Supabase
# A senha contem @ que precisa ser encoded como %40
$env:DATABASE_URL = "postgresql://postgres:5Y2c.EFh%24mU%40W7B@db.adrpyuedsyeohdhlnecj.supabase.co:5432/postgres"
$env:SECRET_KEY = "convergeai-secret-key-change-in-production"
$env:META_GRAPH_API_VERSION = "v25.0"

Write-Host "Iniciando backend do Log Pose..."
Write-Host "Banco: Supabase"
Write-Host "URL: http://localhost:8000"
Write-Host ""

python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
