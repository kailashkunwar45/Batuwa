# Batuwa Dev Starter - Run this every time you start developing

# 1. Get current Wi-Fi IP address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "ERROR: Could not detect local IP. Are you connected to Wi-Fi?" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Your IP Address: $ip" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

# 2. Auto-patch api.ts with the current IP and port 5001
$apiFile = "C:\Users\LENOVO\OneDrive\Desktop\Batuwa\apps\mobile\src\services\api.ts"
$newUrl = "const API_URL = 'http://${ip}:5001/api/v1';"
$content = Get-Content $apiFile -Raw
$patched = $content -replace "const API_URL = 'http://[^']+';", $newUrl
Set-Content $apiFile $patched -NoNewline

Write-Host "  api.ts updated: http://${ip}:5001/api/v1" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Starting Batuwa backend..." -ForegroundColor Yellow
Write-Host "  In Terminal 2, run:" -ForegroundColor Yellow
Write-Host "  cd C:\Users\LENOVO\OneDrive\Desktop\Batuwa\apps\mobile" -ForegroundColor White
Write-Host "  npx expo start --clear" -ForegroundColor White
Write-Host ""

# 3. Kill anything already running on port 5001
$existing = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Select-Object -First 1
if ($existing) {
    Stop-Process -Id $existing -Force -ErrorAction SilentlyContinue
    Write-Host "  Killed old process on port 5001" -ForegroundColor DarkYellow
}

# 4. Start the backend
Set-Location "C:\Users\LENOVO\OneDrive\Desktop\Batuwa\packages\api"
npm run dev
