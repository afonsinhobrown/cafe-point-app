# Deploy Monolith Script
# Este script constrói o Frontend e o copia para o Backend

Write-Host "INICIANDO PREPARACAO DE DEPLOY (Monolito)" -ForegroundColor Cyan

# 1. Diretorios
$Root = Get-Location
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"
$PublicDir = Join-Path $BackendDir "public"

# 2. Build do Frontend
Write-Host "Construindo Frontend (Vite)..." -ForegroundColor Yellow
Set-Location $FrontendDir

# Garantir dependencias
try {
    npm list vite > $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Instalando dependencias do frontend..." -ForegroundColor Cyan
        npm install
    }
} catch {
    npm install
}

# Rodar Build
try {
    # Tentar build normal
    npm run build
    if ($LASTEXITCODE -ne 0) { 
        # Se falhar por type check (tsc), tentar apenas build do vite
        Write-Host "Build padrao falhou. Tentando build sem checagem de tipos..." -ForegroundColor Magenta
        npx vite build
        if ($LASTEXITCODE -ne 0) { throw "Erro no build do frontend" }
    }
} catch {
    Write-Host "ERRO ao construir Frontend!" -ForegroundColor Red
    Set-Location $Root
    exit 1
}

# 3. Limpar e Copiar para Backend
Write-Host "Copiando arquivos para Backend/public..." -ForegroundColor Yellow

# Verificar se dist existe
if (-not (Test-Path "dist")) {
    Write-Host "ERRO: Pasta 'dist' nao encontrada no frontend." -ForegroundColor Red
    Set-Location $Root
    exit 1
}

if (Test-Path $PublicDir) {
    Remove-Item $PublicDir -Recurse -Force
}
New-Item -ItemType Directory -Path $PublicDir | Out-Null

# Copiar conteudo de frontend/dist para backend/public
Copy-Item "dist\*" $PublicDir -Recurse -Force

Write-Host "Copiado com sucesso!" -ForegroundColor Green

# 4. Finalizacao
Set-Location $Root
Write-Host "SUCESSO! O projeto esta pronto." -ForegroundColor Green
Write-Host "Agora o Backend ira servir o site automaticamente."
