# 🧪 Complete Guide: Testing the Notification Engine

Your project is **running in Docker**! Here are all the tests you can perform, organized by functionality.

---

## ✅ Step 1: Check Status

### Confirmation 1: Docker Containers Running

```powershell
docker-compose ps
```

**Expected:** 3 containers UP
- ✅ notification-redis → Up (healthy)
- ✅ notification-engine → Up 
- ✅ notification-redis-commander → Up (healthy)

### Confirmation 2: Access Services

Open in browsers:
- **API**: http://localhost:3000 (returns 404 error, but responding ✅)
- **Redis Commander**: http://localhost:8081 (visual Redis interface)

---

## 🔑 Step 2: Generate JWT Token for Tests

All endpoints require JWT authentication. Use this token for testing:

```powershell
# Define in a variable
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

Or generate a new one at https://jwt.io:
- **Header**: `{ "alg": "HS256", "typ": "JWT" }`
- **Payload**: `{ "sub": "user123", "email": "user@example.com" }`
- **Secret**: `super-secret-key-change-in-production` (from docker-compose.yml)

---

## 📡 Test 1: Health Check (Verify Health)

Checks if the API is responding and authentication works.

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

$headers = @{ "Authorization" = "Bearer $token" }

Invoke-WebRequest http://localhost:3000/notifications/health -Headers $headers
```

**Expected Response:**
```
StatusCode        : 200
StatusDescription : OK
```

✅ If returns `200`, the API is working!

---

## 📬 Test 2: Send Notification (1 User)

Sends a notification to a single user.

```powershell
$token = "your-token-here"

$body = @{
    recipientId = "user123"
    title = "Hello!"
    message = "This is your first notification"
    type = "in-app"
    metadata = @{ source = "test-api" }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/notifications/send" `
    -Method POST `
    -Headers $headers `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "recipientId": "user123",
  "title": "Hello!",
  "message": "This is your first notification",
  "type": "in-app",
  "status": "queued",
  "createdAt": "2026-02-22T18:45:30Z"
}
```

✅ **Functionality Tested:**
- Notification creation ✅
- Data validation ✅
- UUID generation ✅
- Redis storage ✅

---

## 📨 Test 3: Send Batch (Multiple Users)

Sends the same notification to multiple users at once.

```powershell
$body = @{
    recipientIds = @("user123", "user456", "user789")
    title = "Important Notice"
    message = "Message to multiple users"
    type = "email"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/notifications/send/batch" `
    -Method POST `
    -Headers $headers `
    -Body $body | % { $_.Content | ConvertFrom-Json } | ConvertTo-Json
```

**Expected Response:**
```json
{
  "total": 3,
  "delivered": 0,
  "queued": 3,
  "failed": 0,
  "timestamp": "2026-02-22T18:46:00Z"
}
```

✅ **Tested Functionalities:**
- Batch sending ✅
- Multiple processing ✅
- Status counting ✅

---

## 📋 Test 4: View Pending Notifications

Retrieves notifications that were queued (for offline users).

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/notifications/pending" `
    -Headers $headers | % { $_.Content | ConvertFrom-Json } | ConvertTo-Json
```

**Expected Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "recipientId": "user123",
    "title": "Hello!",
    "message": "This is your first notification",
    "status": "queued",
    "createdAt": "2026-02-22T18:45:30Z"
  }
]
```

✅ **Tested Functionalities:**
- Redis queue reading ✅
- Data retrieval ✅
- Response format ✅

---

## 📚 Test 5: Notification History

Retrieves sent notifications with pagination.

```powershell
# Without pagination
Invoke-WebRequest -Uri "http://localhost:3000/notifications/history" `
    -Headers $headers | % { $_.Content | ConvertFrom-Json } | ConvertTo-Json

# With pagination
Invoke-WebRequest -Uri "http://localhost:3000/notifications/history?limit=5&offset=0" `
    -Headers $headers | % { $_.Content | ConvertFrom-Json } | ConvertTo-Json
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "recipientId": "user123",
    "title": "...",
    "status": "queued",
    "createdAt": "..."
  }
]
```

✅ **Tested Functionalities:**
- History reading ✅
- Pagination (limit/offset) ✅

---

## ✅ Test 6: Mark as Read

Marks a notification as read (updates status).

```powershell
# Use a real notification ID from the previous test
$notificationId = "550e8400-e29b-41d4-a716-446655440000"

Invoke-WebRequest -Uri "http://localhost:3000/notifications/$notificationId/read" `
    -Method POST `
    -Headers $headers
```

**Expected Response:**
```
StatusCode : 204
```

✅ **Tested Functionalities:**
- Status update ✅
- Access by ID ✅

---

## 🔴 Test 7: Test Errors (Validation)

Tests if the system rejects invalid data.

### Error: No JWT Token

```powershell
Invoke-WebRequest http://localhost:3000/notifications/health
```

**Expected Response:** `401 Unauthorized` ✅

### Error: Invalid Data

```powershell
$badBody = @{
    recipientId = "user123"
    # Missing 'title' and 'message'
    type = "invalid-type"  # invalid type
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/notifications/send" `
    -Method POST `
    -Headers $headers `
    -Body $badBody
```

**Expected Response:** `400 Bad Request` with validation errors ✅

---

## 🔍 Test 8: View Data in Redis (Visual)

Inspect stored data in real-time.

### Via Web Interface (Recommended)

1. Open: http://localhost:8081
2. Select "local" (local Redis)
3. See the keys:
   - `user:socket:*` - Connected users
   - `notifications:pending:*` - Notification queues
   - `notifications:data:*` - Notification data

### Via Command Line

```powershell
# Connect to Redis
docker exec notification-redis redis-cli

# List all keys
> KEYS *

# View content of a key (example)
> GET notifications:data:550e8400-e29b-41d4-a716-446655440000

# Exit
> EXIT
```

✅ **Verifies:**
- Redis storage ✅
- Data persistence ✅
- Key structure ✅

---

## 📡 Test 9: WebSocket Real-Time (Advanced)

Tests real-time notifications via WebSocket (Node.js required).

### Create `test-ws.js` file

```javascript
const io = require('socket.io-client');

const token = 'your-jwt-token';
const socket = io('http://localhost:3000/notifications', {
    auth: { token }
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket!');
});

socket.on('notification:delivered', (data) => {
    console.log('📬 Notification delivered:', data);
});

socket.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

socket.on('disconnect', () => {
    console.log('🔌 Disconnected');
});

// Keep open for 30 seconds
setTimeout(() => socket.disconnect(), 30000);
```

### Execute

```bash
npm install socket.io-client
node test-ws.js
```

✅ **Verifies:**
- WebSocket connection ✅
- Real-time delivery ✅
- Live events ✅

---

## 📝 Test 10 (Bonus): View Logs in Real-Time

Monitor everything that's happening:

```powershell
# All logs
docker-compose logs -f

# API logs only
docker-compose logs -f notification-api

# Redis logs only
docker-compose logs -f redis

# Last 50 lines
docker-compose logs -f notification-api --tail=50
```

---

## 📊 Summary Interactive: Automatic Script

To test **EVERYTHING AT ONCE**, run:

```powershell
.\test-api.ps1
```

This script runs all tests automatically and shows if each one passed ✅ or failed ❌.

---

## 🎯 Feature Checklist

After running the tests, you verified:

### Core Features
- [ ] ✅ Health check (API responding)
- [ ] ✅ JWT authentication (security)
- [ ] ✅ Notification creation
- [ ] ✅ Batch sending
- [ ] ✅ Pending queue
- [ ] ✅ History with pagination
- [ ] ✅ Status update

### Database
- [ ] ✅ Redis storage
- [ ] ✅ Data persistence
- [ ] ✅ Well-structured keys

### API Features
- [ ] ✅ Data validation
- [ ] ✅ Error handling
- [ ] ✅ Consistent responses
- [ ] ✅ Logging

### Optional
- [ ] ✅ WebSocket real-time
- [ ] ✅ Visualization in Redis Commander
- [ ] ✅ Formatted logs

---

##  🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `401 Unauthorized` | Invalid token or missing. Use token from step 2. |
| `Connection refused` | API not running. Check `docker-compose ps`. |
| `400 Bad Request` | Invalid data. Check JSON syntax. |
| Redis empty | Normal! Data is temporary (TTL=7 days). |
| WebSocket won't open | Check firewall or port 3000 blocking. |

---

## 📞 Next Steps

1. ✅ Run all tests above
2. ✅ Explore data at http://localhost:8081
3. ✅ Read logs: `docker-compose logs -f`
4. ✅ For production: see `PRODUCTION-CHECKLIST.md`
5. ✅ For development: see `DEVELOPMENT.md`

**Congratulations! Your Notification Engine is fully functional! 🎉**
