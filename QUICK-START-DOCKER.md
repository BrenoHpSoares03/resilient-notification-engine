# 🚀 Quick Start - Como Rodar via Docker

Este é um guia rápido. Para mais detalhes, veja `DOCKER-TESTING.md`.

## 📋 Checklist de Pré-requisitos

- [ ] Docker Desktop instalado no Windows
  - Download: https://www.docker.com/products/docker-desktop
- [ ] Docker Desktop está **aberto/ativo**
  - Procure o ícone Docker no canto inferior direito do Windows (system tray)

## ⚡ Passo a Passo (5 minutos)

### **Passo 1: Iniciar Docker Desktop** (Windows)

Se Docker Desktop não estiver aberto:
1. Digite "Docker" na barra de pesquisa do Windows
2. Clique em "Docker Desktop"
3. **Aguarde 1-2 minutos** até aparecer na system tray
4. Você verá o ícone da baleia 🐳 no canto direito taskbar

### **Passo 2: Abrir Terminal PowerShell**

```powershell
# Navegue até a pasta do projeto
cd C:\Users\Bhsoa\Documents\GitHub\resilient-notification-engine
```

### **Passo 3: Subir Docker Compose**

```powershell
# Inicia todos os 3 serviços: API, Redis, Redis Commander
docker-compose up -d
```

**Esperado:**
```
✅ Creating notification-redis
✅ Creating notification-engine
✅ Creating notification-redis-commander
```

### **Passo 4: Verificar Status**

```powershell
# Lista os containers rodando
docker-compose ps
```

**Deverá aparecer:**
```
NAME                          STATUS
notification-engine          Up 2 minutes
notification-redis           Up 2 minutes
notification-redis-commander Up 2 minutes
```

### **Passo 5: Testar os Endpoints**

#### **Opção A: Usar Script Automático (Recomendado)**

```powershell
# Execute o script de testes
.\test-api.ps1
```

Verá testes de:
- ✅ Health check
- ✅ Enviar notificação
- ✅ Enviar em batch
- ✅ Pegar notificações pendentes
- ✅ Histórico
- ✅ Marcar como lido

#### **Opção B: Testar Manualmente com curl**

```powershell
# 1. Definir token (em desenvolvimento, qualquer JWT serve)
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"

# 2. Testar saúde da API
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-WebRequest http://localhost:3000/notifications/health -Headers $headers
```

## 🌐 Acessar os Serviços

Após `docker-compose up -d`, acesse:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API** | http://localhost:3000 | Endpoints REST |
| **WebSocket** | ws://localhost:3000/notifications | Notificações em tempo real |
| **Redis Commander** | http://localhost:8081 | Interface visual do Redis |

## 📊 Redis Commander (Debugging)

Para ver os dados armazenados:

1. Abra: http://localhost:8081
2. Selecione "local" (Redis local)
3. Veja as chaves:
   - `user:socket:*` - Mapeamento usuário → socket
   - `notifications:pending:*` - Filas de notificações
   - `notifications:data:*` - Metadados

## 📝 Exemplo: Enviar Notificação via PowerShell

```powershell
$token = "YOUR_JWT_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    recipientId = "user123"
    title = "Hello!"
    message = "Teste via Docker"
    type = "in-app"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/notifications/send" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## 🛑 Parar os Serviços

```powershell
# Para os containers
docker-compose down

# Remove tudo (incluindo volumes/dados)
docker-compose down -v
```

## 📋 Logs em Tempo Real

```powershell
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs apenas da API
docker-compose logs -f notification-api

# Ver logs apenas do Redis
docker-compose logs -f redis
```

## 🐛 Troubleshooting

### Erro: "unable to find image 'redis:7-alpine'"
**Solução:** Docker Desktop não está rodando
1. Procure "Docker Desktop" no Windows Start
2. Clique para abrir
3. Aguarde 1-2 minutos
4. Tente novamente

### Erro: "connection refused" ao acessar API
**Solução:** Containers ainda estão iniciando
1. Aguarde 10 segundos
2. Tente novamente

### Não consigo acessar http://localhost:3000
**Solução:** Verifique status
```powershell
docker-compose ps
docker-compose logs notification-api
```

## 📚 Documentação Completa

Para mais detalhes:
- **DOCKER-TESTING.md** - Guia completo de testes
- **API-EXAMPLES.md** - Exemplos de código
- **README.md** - Documentação completa
- **DEVELOPMENT.md** - Guia de desenvolvimento

---

**Pronto!** Você tem uma Notification Engine completa rodando com Docker! 🎉
