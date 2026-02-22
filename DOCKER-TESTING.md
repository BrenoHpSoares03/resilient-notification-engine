# 🧪 Testing the Notification Engine

Complete guide to test the Resilient Notification Engine after deploying with Docker Compose.

## 🚀 Prerequisites

Before testing, ensure:
1. Docker Desktop is running (Windows/Mac) or Docker daemon is active (Linux)
2. Applications are running: `docker-compose ps`

## 📋 Services Status

After `docker-compose up -d`, you should see:

```
NAME                          IMAGE                            STATUS
notification-engine          (local image)                    Up 1 min
notification-redis           redis:7-alpine                   Up 1 min
notification-redis-commander rediscommander/redis-commander   Up 1 min
```

---

## 🔑 Generate Test JWT Token

The application requires JWT authentication for all endpoints.

### Option 1: Use a Test Token (Development)

```powershell
# Quick test token (valid for development)
$testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjIzMDkyODAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

### Option 2: Generate Real Token (Better)

Use an online JWT encoder like https://jwt.io:
1. Paste Header:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

2. Paste Payload:
```json
{
  "sub": "user123",
  "email": "user@example.com",
  "iat": 1623092800
}
```

3. Paste Secret (from docker-compose.yml): `super-secret-key-change-in-production`

4. Copy the generated token

---

## ✅ Test 1: Health Check

Verify API is running and responding:

```powershell
# Without authentication (will fail with 401)
curl http://localhost:3000/notifications/health

# With JWT token
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{ "Authorization" = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:3000/notifications/health" `
  -Headers $headers | ConvertTo-Json
```

**Expected Response**: `200 OK` with health status

---

## ✅ Test 2: Send Single Notification

Send a notification to one recipient:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    recipientId = "user123"
    title = "Test Notification"
    message = "This is a test notification"
    type = "in-app"
    metadata = @{ source = "test-api" }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/notifications/send" `
    -Method POST `
    -Headers $headers `
    -Body $body | ConvertTo-Json
```

**Expected Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "recipientId": "user123",
  "title": "Test Notification",
  "message": "This is a test notification",
  "type": "in-app",
  "status": "queued",
  "createdAt": "2026-02-20T22:15:30Z"
}
```

---

## ✅ Test 3: Send Batch Notifications

Send to multiple recipients at once:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    recipientIds = @("user123", "user456", "user789")
    title = "Batch Notification"
    message = "Sent to multiple users"
    type = "email"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/notifications/send/batch" `
    -Method POST `
    -Headers $headers `
    -Body $body | ConvertTo-Json
```

**Expected Response**:
```json
{
  "total": 3,
  "delivered": 0,
  "queued": 3,
  "failed": 0,
  "timestamp": "2026-02-20T22:15:45Z"
}
```

---

## ✅ Test 4: Get Pending Notifications

Retrieve notifications queued for offline users:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{ "Authorization" = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:3000/notifications/pending" `
    -Headers $headers | ConvertTo-Json
```

**Expected Response**:
```json
[
  {
    "id": "550e8400-...",
    "recipientId": "user123",
    "title": "Test Notification",
    "status": "queued",
    "createdAt": "2026-02-20T22:15:30Z"
  }
]
```

---

## ✅ Test 5: Get Notification History

Retrieve sent/read notifications with pagination:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{ "Authorization" = "Bearer $token" }

# Get history with pagination
Invoke-WebRequest -Uri "http://localhost:3000/notifications/history?limit=10&offset=0" `
    -Headers $headers | ConvertTo-Json
```

---

## ✅ Test 6: Mark Notification as Read

Update notification status:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$notificationId = "550e8400-e29b-41d4-a716-446655440000"

$headers = @{ "Authorization" = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:3000/notifications/$notificationId/read" `
    -Method POST `
    -Headers $headers | ConvertTo-Json
```

**Expected Response**: `204 No Content` or status update

---

## 🔴 Test 7: WebSocket Real-Time Delivery (Node.js)

Test real-time notification delivery via WebSocket:

Create file `test-websocket.js`:

```javascript
const io = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN_HERE';
const socket = io('http://localhost:3000/notifications', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket');
});

socket.on('notification:delivered', (data) => {
    console.log('📬 Notification received:', data);
});

socket.on('notification:read', (data) => {
    console.log('✓ Notification read:', data);
});

socket.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

socket.on('disconnect', () => {
    console.log('🔌 Disconnected');
});

// Keep connection alive
setTimeout(() => {
    socket.disconnect();
    console.log('Test completed');
    process.exit(0);
}, 30000);
```

Run:
```bash
npm install socket.io-client
node test-websocket.js
```

---

## 🖥️ Test 8: Redis Commander UI

Inspect stored data visually:

1. Open: http://localhost:8081
2. Select "local" connection
3. Explore keys:
   - `user:socket:*` - User to Socket ID mappings
   - `notifications:pending:*` - Pending notification queues
   - `notifications:data:*` - Notification metadata

---

## 🔍 Debugging & Logs

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f notification-api
docker-compose logs -f redis
```

### Common Issues

**Issue**: 401 Unauthorized
- **Solution**: Check JWT token validity and secret key in docker-compose.yml

**Issue**: Connection refused
- **Solution**: Verify `docker-compose ps` shows all containers running

**Issue**: Redis connection error
- **Solution**: Check Redis is healthy: `docker-compose logs redis`

---

## 📊 Performance Testing

### Load Test with Apache Bench

```bash
# Install: sudo apt-get install apache2-utils (Linux)
# Or use WSL on Windows

# Test single endpoint
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:3000/notifications/health
```

### Test Concurrent WebSocket Connections

```javascript
// test-concurrent-ws.js
const io = require('socket.io-client');
const token = 'YOUR_TOKEN';

for (let i = 0; i < 10; i++) {
    const socket = io('http://localhost:3000/notifications', {
        auth: { token }
    });
    socket.on('connect', () => {
        console.log(`Client ${i} connected`);
    });
}
```

---

## ✅ Test Checklist

- [ ] Health endpoint returns 200
- [ ] Single notification sends successfully
- [ ] Batch notifications sends to multiple users
- [ ] Pending notifications retrieved
- [ ] History endpoint pagination works
- [ ] Mark as read updates status
- [ ] WebSocket connection established
- [ ] Real-time delivery received
- [ ] Redis Commander shows data
- [ ] Logs show no errors

---

## 🚨 Clean Up After Testing

```bash
# Stop containers
docker-compose down

# Remove everything (careful!)
docker-compose down -v

# View final logs before cleanup
docker-compose logs
```

---

## 📞 Troubleshooting

If endpoints return 500 errors:
1. Check logs: `docker-compose logs notification-api`
2. Verify Redis connection: `docker-compose logs redis`
3. Ensure JWT secret matches across services

For detailed help, see:
- `ARCHITECTURE.md` - System design
- `API-EXAMPLES.md` - More code examples
- `DEVELOPMENT.md` - Development guide
