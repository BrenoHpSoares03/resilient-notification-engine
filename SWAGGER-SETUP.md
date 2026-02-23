# 📚 Swagger API Documentation Guide

Your Notification Engine now includes comprehensive **OpenAPI/Swagger documentation** with interactive testing capabilities!

---

## 🚀 Accessing Swagger Documentation

### Open in Browser:
```
http://localhost:3000/api/docs
```

---

## 📖 What You'll Find in Swagger

### 1. **All Endpoints Listed**
- **POST** `/notifications/send` - Send notification to single user
- **POST** `/notifications/send/batch` - Send notification to multiple users
- **GET** `/notifications/pending` - Get pending (offline) notifications
- **GET** `/notifications/history` - Get notification history with pagination
- **POST** `/notifications/:notificationId/read` - Mark notification as read
- **GET** `/notifications/health` - Health check (no auth required)

### 2. **Detailed Descriptions**
Each endpoint includes:
- ✅ Operation summary
- ✅ Full description of what the endpoint does
- ✅ Required and optional parameters
- ✅ Example request bodies
- ✅ Expected response codes and formats

### 3. **Request Examples**
All endpoints show example payloads:

**Example: Send Notification**
```json
{
  "recipientId": "user123",
  "title": "Order Confirmation",
  "message": "Your order #12345 has been confirmed. Estimated delivery: 3-5 business days.",
  "type": "in-app",
  "senderId": "admin-system",
  "data": {
    "orderId": "12345",
    "amount": 99.99,
    "currency": "USD"
  }
}
```

### 4. **Response Examples**
Each endpoint shows expected responses:

**Example: Send Notification Response (201)**
```json
{
  "total": 1,
  "delivered": 1,
  "queued": 0,
  "failed": 0,
  "timestamp": "2026-02-22T10:30:00.000Z"
}
```

### 5. **Error Documentation**
All error codes documented:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Server error

---

## 🔐 Authentication in Swagger

All endpoints (except `/health`) require JWT authentication.

### Step 1: Get JWT Token

**Option A: Use Python script**
```bash
python3 generate-token.py
```

**Option B: Generate online at https://jwt.io**
- Header: `{ "alg": "HS256", "typ": "JWT" }`
- Payload: `{ "sub": "user123", "email": "user@example.com" }`
- Secret: `super-secret-key-change-in-production`

### Step 2: Add Token to Swagger
1. Click **"Authorize"** button (top right)
2. Paste your JWT token in the format: `<your-token>`
3. Click **"Authorize"**
4. Now test all protected endpoints!

---

## 🧪 Testing Endpoints in Swagger

### Method 1: Simple Click & Test

1. **Open Swagger**: http://localhost:3000/api/docs
2. **Authenticate**: Click "Authorize" button (top right)
3. **Expand endpoint**: Click any endpoint (e.g., "POST /notifications/send")
4. **"Try it out"**: Click the "Try it out" button
5. **Edit Request**: Modify the example request body if needed
6. **Execute**: Click "Execute" button
7. **View Response**: See the status code and response body

### Method 2: Manual cURL from Documentation

Swagger generates cURL commands you can copy and run:

```bash
# Example from Swagger docs
curl -X POST "http://localhost:3000/notifications/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user123",
    "title": "Hello",
    "message": "Test message",
    "type": "in-app"
  }'
```

---

## 📊 API Schema Details

### Notification Types
```
- "in-app"   : Application notification
- "email"    : Email notification
- "sms"      : SMS notification
- "push"     : Push notification
```

### Notification Status
```
- "pending"   : Waiting for delivery
- "delivered" : Successfully delivered
- "read"      : User has read it
- "failed"    : Delivery failed
```

---

## 🔍 Exploring the API Schema

### Models/Schemas Section
Swagger shows all data models:

**NotificationResponseDto**
```
- id (string) - Notification UUID
- recipientId (string) - Recipient user ID
- title (string) - Notification title
- message (string) - Notification content
- type (string) - Notification type
- status (string) - Current status
- data (object) - Optional metadata
- createdAt (string, date-time) - Creation timestamp
- deliveredAt (string, date-time) - Delivery timestamp
- readAt (string, date-time) - Read timestamp
```

**SendNotificationDto**
```
- recipientId (string, optional) - Single recipient
- recipientIds (array, optional) - Multiple recipients
- title* (string) - Required, min 1, max 200
- message* (string) - Required, min 1, max 1000
- type* (enum) - Required, one of: in-app, email, sms, push
- senderId (string, optional) - Sender ID
- data (object, optional) - Extra metadata
- expiresIn (number, optional) - TTL in seconds (7 days default)
```

---

## 💡 Common Testing Scenarios

### Test 1: Send Single Notification
1. Go to **POST /notifications/send**
2. Click **"Try it out"**
3. Keep example request body
4. Click **"Execute"**
5. ✅ See `201 Created` response

### Test 2: Send to Multiple Users
1. Go to **POST /notifications/send/batch**
2. Click **"Try it out"**
3. Edit **recipientIds** array with IDs
4. Click **"Execute"**
5. ✅ See aggregated delivery statistics

### Test 3: Get Notification History
1. Go to **GET /notifications/history**
2. Click **"Try it out"**
3. Set **limit**: `10`
4. Set **offset**: `0`
5. Click **"Execute"**
6. ✅ See historical notifications

### Test 4: Health Check (No Auth Needed!)
1. Go to **GET /notifications/health**
2. Click **"Try it out"**
3. Click **"Execute"** (no auth required)
4. ✅ See `{ "status": "ok" }` response

---

## 📱 Mobile & Desktop Clients

Swagger provides auto-generated client code:

### Generate Client Code
1. Look for **"Download"** or **"Generate Client"** option (if available)
2. Select language (JavaScript, Python, Go, etc.)
3. Use the auto-generated SDK in your project

### Example: JavaScript Client (from Swagger)
```javascript
const token = 'your-jwt-token';

const response = await fetch('http://localhost:3000/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 'user123',
    title: 'Hello',
    message: 'Test message',
    type: 'in-app'
  })
});

const data = await response.json();
console.log(data);
```

---

## 🔗 Integration with Other Tools

### Postman
1. Go to Swagger: http://localhost:3000/api/docs
2. Look for **OpenAPI JSON** or **Download** button
3. Copy the OpenAPI JSON URL
4. In Postman: `File` → `Import` → `Link`
5. Paste the URL
6. ✅ All endpoints imported into Postman!

### API Testing Tools
- **Bruno** - Import OpenAPI spec
- **REST Client (VS Code extension)** - Use generated examples
- **Thunder Client** - Import from Swagger

---

## 📚 Swagger Features

### ✅ What's Included
- Complete API specification in **OpenAPI 3.0** format
- **JWT Bearer authentication** configured
- Detailed **request/response examples**
- **Error documentation** for all codes
- **Parameter descriptions** and constraints
- **Data model schemas** with field details

### 📖 Browse Documentation
1. Click any endpoint to expand details
2. Hover over fields for inline documentation
3. See validation rules and constraints
4. View data type information

### 💬 Response Details
Every response shows:
- Status codes (200, 201, 400, 401, etc.)
- Response body examples
- Content type (application/json)
- Field descriptions

---

## 🔧 Customizing Swagger

### In Code
The Swagger configuration is in [src/main.ts](src/main.ts):

```typescript
const swaggerConfig = new DocumentBuilder()
    .setTitle('Resilient Notification Engine API')
    .setDescription('Real-time notification engine...')
    .setVersion('1.0.0')
    .addBearerAuth(...)
    .build();
```

### Modify Documentation
1. Edit endpoint descriptions in [src/notifications/notifications.controller.ts](src/notifications/notifications.controller.ts)
2. Update DTO field descriptions in DTOs
3. Rebuild: `npm run build`
4. Swagger auto-updates!

---

## 🚀 Next Steps

1. **Open Swagger**: http://localhost:3000/api/docs
2. **Authorize**: Click "Authorize" and add JWT token
3. **Test Endpoints**: Try each operation
4. **Generate Clients**: Download SDK if needed
5. **Integrate**: Use in your application

---

## 📍 Swagger File Locations

- **Interactive UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json (if enabled)
- **Configuration**: `src/main.ts` (lines ~38-62)
- **Endpoint Decorators**: `src/notifications/notifications.controller.ts`
- **DTO Descriptions**: `src/notifications/dto/`

---

## 🎉 You're All Set!

Your API is now **fully documented** with:
- ✅ Detailed endpoint descriptions
- ✅ Request/response examples
- ✅ Data model documentation
- ✅ Interactive testing interface
- ✅ JWT authentication flow

**Start testing at**: http://localhost:3000/api/docs

Enjoy! 🚀
