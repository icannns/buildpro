# Start Auth Service (Node.js) - FIRST
Start-Process -FilePath "node" -ArgumentList "services/auth-service/index.js" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro" -WindowStyle Minimized

# Wait a bit for auth service to start
Start-Sleep -Seconds 2

# Start API Gateway (Node.js)
Start-Process -FilePath "node" -ArgumentList "services/api-gateway/index.js" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro" -WindowStyle Minimized

# Start Project Service (Node.js)
Start-Process -FilePath "node" -ArgumentList "services/project-service/index.js" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro" -WindowStyle Minimized

# Start Material Service (Python)
Start-Process -FilePath "C:\Users\Legion\AppData\Local\Programs\Python\Python314\python.exe" -ArgumentList "services/material-service/app.py" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro" -WindowStyle Minimized

# Start Vendor Service (Go)
Start-Process -FilePath "go" -ArgumentList "run main.go" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro\services\vendor-service" -WindowStyle Minimized

# Start Budget Service (Java)
# Compile first
& "C:\Program Files\Java\jdk-22\bin\javac.exe" services/budget-service/BudgetService.java
# Run
Start-Process -FilePath "C:\Program Files\Java\jdk-22\bin\java.exe" -ArgumentList "-cp services/budget-service BudgetService" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro" -WindowStyle Minimized

# Start Frontend (Client)
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro\client"

# Start Vendor Portal (HTML) - Changed to port 5006
Start-Process -FilePath "C:\Users\Legion\AppData\Local\Programs\Python\Python314\python.exe" -ArgumentList "-m http.server 5006" -WorkingDirectory "C:\Users\Legion\Documents\Semester 1 Kuliah Ekstensi\BuildPro\vendor-portal" -WindowStyle Minimized

Write-Host "🚀 All services are starting..."
Write-Host "0. Auth Service: http://localhost:5005"
Write-Host "1. API Gateway: http://localhost:5000"
Write-Host "2. Project Service (Node): http://localhost:5001"
Write-Host "3. Material Service (Python): http://localhost:5002"
Write-Host "4. Vendor Service (Go): http://localhost:5003"
Write-Host "5. Budget Service (Java): http://localhost:5004"
Write-Host "6. Frontend: http://localhost:5173 or http://localhost:3000"
Write-Host "7. Vendor Portal: http://localhost:5006"
Write-Host ""
Write-Host "Login credentials:"
Write-Host "  Admin: admin@buildpro.com / admin123"
Write-Host "  PM: pm@buildpro.com / pm123"
Write-Host "  Vendor: vendor@buildpro.com / vendor123"

