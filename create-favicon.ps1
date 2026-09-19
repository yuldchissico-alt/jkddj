# Script para criar favicon do NexusScale
# Requer: ImageMagick instalado (https://imagemagick.org/script/download.php#windows)

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceImage
)

$publicDir = "frontend\public"
$iconsDir = "$publicDir\icons"

# Criar diretório icons se não existir
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force
}

Write-Host "🎨 Gerando favicons do LomusTrack..." -ForegroundColor Cyan

# Verificar se ImageMagick está instalado
$magickCmd = Get-Command magick -ErrorAction SilentlyContinue
if (!$magickCmd) {
    Write-Host "❌ ImageMagick não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instale em: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
    Write-Host "Ou use o gerador online: https://realfavicongenerator.net/" -ForegroundColor Yellow
    exit 1
}

# Verificar se arquivo existe
if (!(Test-Path $SourceImage)) {
    Write-Host "❌ Arquivo não encontrado: $SourceImage" -ForegroundColor Red
    exit 1
}

# Gerar favicon.png (32x32)
Write-Host "📦 Gerando favicon.png (32x32)..." -ForegroundColor Green
magick convert $SourceImage -resize 32x32 "$publicDir\favicon.png"

# Gerar favicon.ico (multi-size: 16x16, 32x32, 48x48)
Write-Host "📦 Gerando favicon.ico (multi-size)..." -ForegroundColor Green
magick convert $SourceImage -resize 16x16 -define icon:auto-resize=16,32,48 "$publicDir\favicon.ico"

# Gerar apple-touch-icon.png (180x180)
Write-Host "🍎 Gerando apple-touch-icon.png (180x180)..." -ForegroundColor Green
magick convert $SourceImage -resize 180x180 "$iconsDir\apple-touch-icon.png"

# Gerar PWA icons
Write-Host "📱 Gerando pwa-192.png (192x192)..." -ForegroundColor Green
magick convert $SourceImage -resize 192x192 "$iconsDir\pwa-192.png"

Write-Host "📱 Gerando pwa-512.png (512x512)..." -ForegroundColor Green
magick convert $SourceImage -resize 512x512 "$iconsDir\pwa-512.png"

Write-Host ""
Write-Host "✅ Favicons criados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Arquivos gerados:" -ForegroundColor Cyan
Write-Host "  - $publicDir\favicon.ico"
Write-Host "  - $publicDir\favicon.png"
Write-Host "  - $iconsDir\apple-touch-icon.png"
Write-Host "  - $iconsDir\pwa-192.png"
Write-Host "  - $iconsDir\pwa-512.png"
Write-Host ""
Write-Host "🔄 Reinicie o servidor frontend para ver as mudanças!" -ForegroundColor Yellow
