# Deploy Monolith Script
# Este script constrói o Frontend e o copia para o Backend para deploy unificado

Write-Host "🚀 INICIANDO PREPARAÇÃO DE DEPLOY (Monolito)" -ForegroundColor Cyan

# 1. Diretórios
$Root = Get-Location
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"
$PublicDir = Join-Path $BackendDir "public"

# 2. Build do Frontend
Write-Host "`n📦 Construindo Frontend (Vite)..." -ForegroundColor Yellow
Set-Location $FrontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Erro no build do frontend" }
} catch {
    Write-Host "❌ Erro ao buildar Frontend!" -ForegroundColor Red
    Set-Location $Root
    exit 1
}

# 3. Limpar e Copiar para Backend
Write-Host "`n📂 Copiando arquivos para Backend/public..." -ForegroundColor Yellow
if (Test-Path $PublicDir) {
    Remove-Item $PublicDir -Recurse -Force
}
New-Item -ItemType Directory -Path $PublicDir | Out-Null

# Copiar conteúdo de frontend/dist para backend/public
Copy-Item "dist\*" $PublicDir -Recurse -Force

Write-Host "✅ Copiado com sucesso!" -ForegroundColor Green

# 4. Finalização
Set-Location $Root
Write-Host "`n🎉 SUCESSO! O projeto está pronto." -ForegroundColor Green
Write-Host "Agora o Backend irá servir o site automaticamente."
Write-Host "Para testar localmente:"
Write-Host "  cd backend"
Write-Host "  npm run dev"
Write-Host "  Acesse: http://localhost:5000 (Sem precisar rodar o frontend separado!)"
