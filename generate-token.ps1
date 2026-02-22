#!/usr/bin/env pwsh
# Generate valid JWT token for testing

# JWT secret from docker-compose.yml
$secret = "super-secret-key-change-in-production"

# This is a pre-generated valid token with:
# - Header: { "alg": "HS256", "typ": "JWT" }
# - Payload: { "sub": "user123", "email": "user@example.com" }
# - Signature: signed with the secret above
# - Expires: year 2099 (never expires in testing)

$validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjIzMDkyODAwLCJleHAiOjQ4MzA0NjY0MDB9.o-jUMsVfIXiF87-dRSWWcnAGKoSUI89rvI33FMCOWAk"

Write-Host ""
Write-Host "=== VALID JWT TOKEN FOR TESTING ===" -ForegroundColor Green
Write-Host ""
Write-Host "Token:" -ForegroundColor Yellow
Write-Host $validToken
Write-Host ""
Write-Host "Set in PowerShell:" -ForegroundColor Cyan
Write-Host "`$token = '$validToken'" -ForegroundColor Gray
Write-Host ""
Write-Host "Then use in requests:" -ForegroundColor Cyan
Write-Host "`$headers = @{ 'Authorization' = 'Bearer `$token'; 'Content-Type' = 'application/json' }" -ForegroundColor Gray
Write-Host ""
Write-Host "Test it:" -ForegroundColor Cyan
Write-Host "Invoke-WebRequest http://localhost:3000/notifications/health -Headers `$headers" -ForegroundColor Gray
Write-Host ""
