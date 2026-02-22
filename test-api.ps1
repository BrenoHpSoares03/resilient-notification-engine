#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete API Testing Script for Notification Engine
.DESCRIPTION
    Tests all endpoints of the notification engine running on localhost:3000
.PARAMETER Token
    JWT token for authentication (optional, uses test token if not provided)
.EXAMPLE
    .\test-api.ps1
    .\test-api.ps1 -Token "your-jwt-token"
#>

param(
    [string]$Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
)

$api = "http://localhost:3000"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$testsPassed = 0
$testsFailed = 0
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "🧪 Teste: $Name" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    try {
        if ($Body) {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            Write-Host "📤 Enviando: `n$bodyJson`n" -ForegroundColor Gray
            $response = Invoke-WebRequest -Uri $Url `
                -Method $Method `
                -Headers $headers `
                -Body $bodyJson `
                -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url `
                -Method $Method `
                -Headers $headers `
                -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASSOU - Status: $($response.StatusCode)" -ForegroundColor Green
            $testResults += @{ Name = $Name; Status = "PASSOU"; Code = $response.StatusCode }
            $script:testsPassed++
            
            # Mostrar resposta
            if ($response.Content) {
                Write-Host "📥 Resposta:" -ForegroundColor Gray
                Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3) -ForegroundColor Gray
            }
            
            # Retornar resposta para acesso posterior
            return $response.Content | ConvertFrom-Json
        } else {
            Write-Host "❌ FALHOU - Status esperado: $ExpectedStatus, recebido: $($response.StatusCode)" -ForegroundColor Red
            $testResults += @{ Name = $Name; Status = "FALHOU"; Code = $response.StatusCode }
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = $Name; Status = "ERRO"; Error = $_.Exception.Message }
        $script:testsFailed++
    }
}

# Banner
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 NOTIFICATION ENGINE - Suíte Completa de Testes      ║" -ForegroundColor Cyan
Write-Host "║  API: http://localhost:3000                             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Teste 1: Health Check
$healthResult = Test-Endpoint -Name "Health Check" `
    -Url "$api/notifications/health" `
    -Method GET `
    -ExpectedStatus 200

# Teste 2: Send Single Notification
$singleNotif = @{
    recipientId = "user123"
    title = "Teste Notificação Única"
    message = "Esta é uma notificação de teste"
    type = "in-app"
    metadata = @{ source = "test-api"; timestamp = (Get-Date).ToString() }
}

$singleResult = Test-Endpoint -Name "Enviar Notificação (1 usuário)" `
    -Url "$api/notifications/send" `
    -Method POST `
    -Body $singleNotif `
    -ExpectedStatus 201

$notificationId = $null
if ($singleResult -and $singleResult.id) {
    $notificationId = $singleResult.id
    Write-Host "💾 ID da notificação: $notificationId" -ForegroundColor Yellow
}

# Teste 3: Send Batch Notifications
$batchNotif = @{
    recipientIds = @("user123", "user456", "user789")
    title = "Notificação em Batch"
    message = "Enviada para múltiplos usuários"
    type = "email"
}

Test-Endpoint -Name "Enviar Notificações em Batch" `
    -Url "$api/notifications/send/batch" `
    -Method POST `
    -Body $batchNotif `
    -ExpectedStatus 201 | Out-Null

# Teste 4: Get Pending Notifications
Write-Host "`n⏳ Aguardando processamento..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

Test-Endpoint -Name "Ver Notificações Pendentes" `
    -Url "$api/notifications/pending" `
    -Method GET `
    -ExpectedStatus 200 | Out-Null

# Teste 5: Get History
Test-Endpoint -Name "Histórico de Notificações" `
    -Url "$api/notifications/history?limit=5&offset=0" `
    -Method GET `
    -ExpectedStatus 200 | Out-Null

# Teste 6: Mark as Read (se temos ID)
if ($notificationId) {
    Test-Endpoint -Name "Marcar como Lido" `
        -Url "$api/notifications/$notificationId/read" `
        -Method POST `
        -ExpectedStatus 204 | Out-Null
}

# Teste 7: Error Handling - Missing Auth
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🧪 Teste: Validação - Sem Token JWT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri "$api/notifications/health" -ErrorAction Stop
    Write-Host "❌ FALHOU - Deveria ter retornado 401" -ForegroundColor Red
    $testResults += @{ Name = "Validação - Sem Token"; Status = "FALHOU"; Code = "N/A" }
    $script:testsFailed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASSOU - Retornou 401 Unauthorized (esperado)" -ForegroundColor Green
        $testResults += @{ Name = "Validação - Sem Token"; Status = "PASSOU"; Code = 401 }
        $script:testsPassed++
    } else {
        Write-Host "❌ FALHOU - Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = "Validação - Sem Token"; Status = "FALHOU"; Error = $_.Exception.Message }
        $script:testsFailed++
    }
}

# Resumo Final
Write-Host "`n`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         📊 RESUMO DOS TESTES                              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

foreach ($result in $testResults) {
    if ($result.Status -eq "PASSOU") {
        Write-Host "✅ $($result.Name)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($result.Name)" -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "Testes Passaram: $testsPassed ✅" -ForegroundColor Green
Write-Host "Testes Falharam: $testsFailed ❌" -ForegroundColor Red
Write-Host "Total: $($testsPassed + $testsFailed)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow

if ($testsFailed -eq 0) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM! Seu Notification Engine está funcionando perfeitamente!`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  $testsFailed teste(s) falharam. Veja os detalhes acima.`n" -ForegroundColor Yellow
}

# Instruções adicionais
Write-Host "📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host "  1. Ver dados em tempo real: http://localhost:8081 (Redis Commander)" -ForegroundColor Gray
Write-Host "  2. Monitorar logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "  3. Testar WebSocket: npm install socket.io-client && node test-ws.js" -ForegroundColor Gray
Write-Host "  4. Ler documentação: TESTING-GUIDE.md para testes avançados" -ForegroundColor Gray
Write-Host ""
