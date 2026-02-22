#!/usr/bin/env pwsh
# Notification Engine - Simple API Test Script

# Note: Token generated with PyJWT using:
# secret = "super-secret-key-change-in-production"
# payload = {"sub": "user123", "email": "user@example.com"}

param(
    [string]$Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjIzMDkyODAwfQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
)

Write-Host ""
Write-Host "Token being used: " -ForegroundColor Yellow
Write-Host $Token -ForegroundColor Gray
Write-Host ""

$api = "http://localhost:3000"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "`n=== NOTIFICATION ENGINE - API TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1] Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$api/notifications/health" -Headers $headers -ErrorAction Stop
    Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Send Single Notification
Write-Host "[2] Testing Send Notification..." -ForegroundColor Yellow
$body = @{
    recipientId = "user123"
    title = "Test Notification"
    message = "Test message from API"
    type = "in-app"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$api/notifications/send" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
    $notifId = ($response.Content | ConvertFrom-Json).id
    Write-Host "Notification ID: $notifId" -ForegroundColor Gray
}
catch {
    Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Send Batch
Write-Host "[3] Testing Send Batch..." -ForegroundColor Yellow
$batchBody = @{
    recipientIds = @("user123", "user456", "user789")
    title = "Batch Test"
    message = "Message to multiple users"
    type = "email"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$api/notifications/send/batch" `
        -Method POST `
        -Headers $headers `
        -Body $batchBody `
        -ErrorAction Stop
    Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Pending
Write-Host "[4] Testing Get Pending Notifications..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$api/notifications/pending" -Headers $headers -ErrorAction Stop
    Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get History
Write-Host "[5] Testing Get History..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$api/notifications/history?limit=5" -Headers $headers -ErrorAction Stop
    Write-Host "PASS - Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Error Handling - No Auth
Write-Host "[6] Testing Error Handling (No Token)..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$api/notifications/health" -ErrorAction Stop
    Write-Host "FAIL - Should have returned 401" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "PASS - Correctly returned 401 Unauthorized" -ForegroundColor Green
    }
    else {
        Write-Host "FAIL - Wrong error code" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== TESTS COMPLETED ===" -ForegroundColor Green
Write-Host "Next: Visit http://localhost:8081 for Redis Commander" -ForegroundColor Cyan
Write-Host "Logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host ""
