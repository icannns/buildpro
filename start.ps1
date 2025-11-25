# BuildPro - Start All Microservices
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Starting BuildPro Polyglot Microservices" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Compile Java first
Write-Host "[1/7] Compiling Java Budget Service..." -ForegroundColor Yellow
$javacPath = "C:\Program Files\Java\jdk-22\bin\javac.exe"
& $javacPath "services\budget-service\BudgetService.java"
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Java compiled successfully`n" -ForegroundColor Green
}
else {
    Write-Host "      Java compilation failed`n" -ForegroundColor Red
    exit 1
}

# Start services in background
Write-Host "[2/7] Starting API Gateway (Node.js - Port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "$PSScriptRoot\services\api-gateway" -WindowStyle Hidden
Start-Sleep -Seconds 1

Write-Host "[3/7] Starting Project Service (Node.js - Port 5001)..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "$PSScriptRoot\services\project-service" -WindowStyle Hidden
Start-Sleep -Seconds 1

Write-Host "[4/7] Starting Material Service (Python - Port 5002)..." -ForegroundColor Yellow
$pythonPath = "C:\Users\Legion\AppData\Local\Programs\Python\Python314\python.exe"
Start-Process -FilePath $pythonPath -ArgumentList "app.py" -WorkingDirectory "$PSScriptRoot\services\material-service" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "[5/7] Starting Vendor Service (Go - Port 5003)..." -ForegroundColor Yellow
Start-Process -FilePath "go" -ArgumentList "run", "main.go" -WorkingDirectory "$PSScriptRoot\services\vendor-service" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "[6/7] Starting Budget Service (Java - Port 5004)..." -ForegroundColor Yellow
$javaPath = "C:\Program Files\Java\jdk-22\bin\java.exe"
Start-Process -FilePath $javaPath -ArgumentList "-cp", ".", "BudgetService" -WorkingDirectory "$PSScriptRoot\services\budget-service" -WindowStyle Hidden
Start-Sleep -Seconds 1

Write-Host "[7/7] Starting Frontend Client (Vite - Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PSScriptRoot\client"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "Access your applications:" -ForegroundColor White
Write-Host "   Main App:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Vendor Portal: http://localhost:5005" -ForegroundColor Cyan
Write-Host "`nMicroservices running on:" -ForegroundColor White
Write-Host "   API Gateway:   http://localhost:5000" -ForegroundColor Gray
Write-Host "   Project (Node):http://localhost:5001" -ForegroundColor Gray
Write-Host "   Material (Py): http://localhost:5002" -ForegroundColor Gray
Write-Host "   Vendor (Go):   http://localhost:5003" -ForegroundColor Gray
Write-Host "   Budget (Java): http://localhost:5004" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to stop the frontend, then manually kill other services if needed." -ForegroundColor Yellow
