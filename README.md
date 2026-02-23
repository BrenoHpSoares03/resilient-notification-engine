# Resilient Notification Engine

A production-ready, horizontally-scalable real-time notification system built with **NestJS**, **WebSockets (Socket.io)**, and **Redis**.

## 🎯 Architecture Overview

### Technology Stack
- **Framework**: NestJS (TypeScript)
- **Real-time Communication**: Socket.io with Redis adapter
- **Data Persistence**: Redis (ioredis)
- **Authentication**: JWT (Passport)
- **Code Quality**: TypeScript, ESLint, Prettier

### Key Features

✅ **Real-time Notifications** - Instant delivery via WebSocket
✅ **Offline Message Queue** - Catch-up delivery when users reconnect
✅ **Horizontal Scalability** - Multiple server instances using Redis adapter
✅ **JWT Authentication** - Secure WebSocket connections
✅ **Robust Error Handling** - Global exception filters and logging
✅ **SOLID Principles** - Clean, maintainable code architecture
✅ **Type Safety** - Full TypeScript support
✅ **Comprehensive Logging** - Winston-based structured logging

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│  (Web, Mobile - using Socket.io client library)            │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
        WebSocket                    WebSocket
        (Real-time)                  (Real-time)
             │                            │
┌────────────▼──────────────┬─────────────▼──────────────────┐
│  NestJS Server Instance 1 │  NestJS Server Instance N      │
│  ┌──────────────────────┐ │  ┌──────────────────────┐     │
│  │ Notifications Gateway  │ │  │ Notifications Gateway  │     │
│  │ Notifications Service  │ │  │ Notifications Service  │     │
│  └──────────────────────┘ │  └──────────────────────┘     │
└────────────┬──────────────┴─────────────┬───────────────────┘
             │                            │
             │    Socket.io Redis Adapter │
             │   (pub/sub + data sharing) │
             │                            │
        ┌────▼────────────────────────────▼────┐
        │         Redis Instance                │
        │ ┌────────────────────────────────┐  │
        │ │ User<->SocketId Mapping        │  │
        │ │ Pending Notifications Queues   │  │
        │ │ Notification Metadata          │  │
        │ └────────────────────────────────┘  │
        └───────────────────────────────────────┘
```

### Data Flow

#### 1. **Real-time Delivery (Online User)**
```
API Request → Service validates → Check user is online (Redis)
→ Create notification → Broadcast via Gateway → User receives via WebSocket
```

#### 2. **Offline Queue (Offline User)**
```
API Request → Service validates → Check user is offline (Redis)
→ Create notification → Queue in Redis → User reconnects
→ Gateway delivers pending notifications (Catch-up)
```

#### 3. **Horizontal Scaling**
```
Request to Server A → Routes to Server B via Redis adapter
→ Broadcasts to all connected users across instances
```

## 📁 Complete File Architecture & Structure

### Full Directory Tree

```
resilient-notification-engine/
│
├── 📚 Documentation Files
│   ├── README.md                           # Main documentation
│   ├── ARCHITECTURE.md                     # 10 design decisions (ADRs)
│   ├── DEVELOPMENT.md                      # Development guide & workflows
│   ├── API-EXAMPLES.md                     # Code examples (JS, curl, etc)
│   ├── PROJECT-SUMMARY.md                  # Complete project overview
│   ├── PRODUCTION-CHECKLIST.md             # Pre-deployment checklist
│   └── QUICK-REFERENCE.md                  # Quick lookup reference
│
├── 📦 Source Code - src/
│   │
│   ├── 🔔 notifications/                   ─ Main Feature Module
│   │   ├── dto/                            ─ Data Transfer Objects
│   │   │   ├── create-notification.dto.ts  │ For creating single notification
│   │   │   ├── send-notification.dto.ts    │ For sending (batch support)
│   │   │   └── notification-response.dto.ts│ Response schemas
│   │   │
│   │   ├── notifications.controller.ts     ─ REST API Endpoints
│   │   │   ├── POST /notifications/send
│   │   │   ├── POST /notifications/send/batch
│   │   │   ├── GET /notifications/pending
│   │   │   ├── GET /notifications/history
│   │   │   ├── POST /notifications/:id/read
│   │   │   └── GET /notifications/health
│   │   │
│   │   ├── notifications.gateway.ts        ─ WebSocket Gateway
│   │   │   ├── @WebSocketGateway()         │ Socket.io namespace
│   │   │   ├── handleConnection()          │ User connect logic
│   │   │   ├── handleDisconnect()          │ User disconnect logic
│   │   │   ├── broadcastToUser()           │ Real-time delivery
│   │   │   └── deliverPendingNotifications()│ Catch-up mechanism
│   │   │
│   │   ├── notifications.service.ts        ─ Core Business Logic
│   │   │   ├── createNotification()        │ Notification creation
│   │   │   ├── sendNotification()          │ Routing logic
│   │   │   ├── registerUserSocket()        │ Socket mapping
│   │   │   ├── getPendingNotifications()   │ Queue retrieval
│   │   │   ├── markAsDelivered()           │ Status tracking
│   │   │   └── markAsRead()                │ Read status
│   │   │
│   │   └── notifications.module.ts         ─ Module Definition
│   │       └── Imports: JwtModule, PassportModule
│   │
│   ├── 🔐 shared/                          ─ Shared Components Layer
│   │   │
│   │   ├── guards/                         ─ Authentication & Protection
│   │   │   ├── jwt.strategy.ts             │ Passport JWT strategy
│   │   │   ├── jwt-auth.guard.ts           │ HTTP route protection
│   │   │   └── ws-jwt.guard.ts             │ WebSocket validation
│   │   │
│   │   ├── decorators/                     ─ Custom Decorators
│   │   │   └── current-user.decorator.ts   │ @CurrentUser() injection
│   │   │                                    │ @CurrentWsUser() for WS
│   │   │
│   │   ├── filters/                        ─ Error Handling
│   │   │   └── all-exceptions.filter.ts    │ Global exception filter
│   │   │                                    │ (HTTP + WebSocket)
│   │   │
│   │   ├── logger/                         ─ Logging Service
│   │   │   └── logger.service.ts           │ Winston integration
│   │   │                                    │ Structured logging
│   │   │
│   │   └── types/                          ─ TypeScript Interfaces
│   │       ├── auth/                       │ Authentication types
│   │       │   ├── jwt-payload.interface.ts│ JWT token payload
│   │       │   └── user-socket-connection.interface.ts
│   │       │                                │ WebSocket connection
│   │       │
│   │       └── notification/               │ Notification types
│   │           ├── notification.interface.ts
│   │           │                            │ Core notification
│   │           ├── notification-queue-item.interface.ts
│   │           │                            │ Queue item definition
│   │           └── enum/                   │ Enumerations
│   │               ├── notification-status.enum.ts
│   │               │                        │ PENDING, DELIVERED, READ, FAILED
│   │               └── notification-type.enum.ts
│   │                                        │ INFO, WARNING, ERROR, SUCCESS
│   │
│   ├── ⚙️ config/                          ─ Infrastructure Layer
│   │   └── redis.service.ts                │ Redis client wrapper
│   │                                        │ Connection pooling
│   │                                        │ Error handling
│   │
│   ├── app.module.ts                       ─ Root Module
│   └── main.ts                             ─ Application Bootstrap
│
├── 🧪 test/                                ─ Test Suite
│   ├── notifications.e2e-spec.ts           │ End-to-end tests
│   └── notifications.service.spec.ts       │ Unit tests
│
├── ⚙️ Configuration Files
│   ├── package.json                        │ Dependencies & npm scripts
│   ├── tsconfig.json                       │ TypeScript compiler
│   ├── jest.config.js                      │ Testing framework
│   ├── .eslintrc.js                        │ Code linting
│   ├── .prettierrc                         │ Code formatting
│   ├── .env.example                        │ Environment template
│   └── .gitignore                          │ Git ignore patterns
│
├── 🐳 Docker
│   ├── Dockerfile                          │ Production image
│   │   └── Multi-stage build
│   │   └── Non-root user
│   │   └── Health checks
│   └── docker-compose.yml                  │ Full stack orchestration
│       ├── notification-api (service)
│       ├── redis (service)
│       └── redis-commander (debugging UI)
│
└── .git/                                   ─ Git Repository

```

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  (Web/Mobile apps using Socket.io client)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────────────┐      ┌────────────▼──────────┐
│    REST API Layer      │      │   WebSocket Layer     │
│ (HTTP Endpoints)       │      │ (Real-time Events)    │
│                        │      │                       │
│ NotificationsController│      │ NotificationsGateway  │
│   ├─ send             │      │   ├─ connection       │
│   ├─ send/batch       │      │   ├─ disconnect       │
│   ├─ pending          │      │   ├─ notification:read│
│   ├─ history          │      │   └─ ping/pong        │
│   └─ health           │      │                       │
└───────┬────────────────┘      └────────────┬──────────┘
        │                                    │
        └──────────────────┬─────────────────┘
                           │
                    ┌──────▼──────────┐
                    │  SERVICE LAYER  │
                    │                 │
                    │ NotificationsService
                    │  ├─ Routing logic (online/offline)
                    │  ├─ Queue management
                    │  ├─ Status tracking
                    │  └─ Catch-up delivery
                    └──────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼─────────┐ ┌─────▼──────────┐
│   AUTH LAYER   │ │ LOGGING LAYER   │ │ ERROR HANDLING │
│                │ │                 │ │                │
│ JwtStrategy    │ │ LoggerService   │ │ Exception      │
│ JwtAuthGuard   │ │ (Winston)       │ │ Filters        │
│ WsJwtGuard     │ │                 │ │                │
│                │ │ - info()        │ │ - HTTP errors  │
│ @CurrentUser   │ │ - error()       │ │ - WS errors    │
│ @CurrentWsUser │ │ - debug()       │ │                │
└────────────────┘ └─────────────────┘ └────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────────┐
                    │   DATA LAYER    │
                    │                 │
                    │  RedisService   │
                    │  ├─ set/get     │
                    │  ├─ lpush/rpop  │
                    │  ├─ hset/hget   │
                    │  └─ Connection  │
                    │     Management  │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────┐
                    │      REDIS      │
                    │                 │
                    │ Users:      1M  │
                    │ Queues:     1M  │
                    │ Metadata:   1M  │
                    └─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Key Methods |
|-----------|---|---|
| **Controller** | HTTP request handling, input validation | POST/GET endpoints |
| **Gateway** | WebSocket connections, real-time events | handleConnection, broadcastToUser |
| **Service** | Core business logic, notification routing | sendNotification, getPendingNotifications |
| **DTOs** | Input validation, type safety | Decorated classes with validators |
| **Guards** | Authentication, authorization | canActivate, validate |
| **Decorators** | Parameter injection, metadata | @CurrentUser, @CurrentWsUser |
| **Logger** | Structured logging | info, error, debug, warn |
| **Filters** | Global error handling | catch, format, log |
| **Redis** | Data persistence, caching | set, get, lpush, rpop, hset |
| **Module** | Feature encapsulation, dependency injection | provides, imports, exports |

### Data Flow Through Layers

```
1. REQUEST ARRIVES
   ├─ HTTP: POST /notifications/send
   └─ WS: socket.emit('notification:read')

2. AUTHENTICATION LAYER
   ├─ JwtAuthGuard validates token
   └─ @CurrentUser extracts userId

3. CONTROLLER/GATEWAY LAYER
   ├─ Controller receives DTO
   └─ Gateway receives message body

4. VALIDATION LAYER
   ├─ DTOs validate input
   └─ Throw 400 if invalid

5. SERVICE LAYER
   ├─ Query Redis for user socket
   ├─ Check if user is online
   ├─ Create notification
   └─ Route (instant or queue)

6. DATA LAYER
   ├─ Read: get user socket ID
   ├─ Write: store notification
   └─ Manage: queues, metadata

7. RESPONSE
   ├─ HTTP: Return 201 with status
   └─ WS: Emit to connected users

8. LOGGING & ERRORS
   ├─ Success logged at info level
   └─ Errors caught & formatted
```

### Redis Data Structure

```
STRING keys (fast lookups):
  user:socket:{userId}
  → Value: { userId, socketId, connectedAt, isActive }

LIST keys (FIFO queues):
  notifications:pending:{userId}
  → Items: [Notification, Notification, ...]

STRING keys (metadata):
  notifications:data:{notificationId}
  → Value: { full notification object }
```

## 🏗️ Project Structure

```
src/
├── notifications/
│   ├── dto/
│   │   ├── create-notification.dto.ts       # Input validation
│   │   ├── send-notification.dto.ts         # Batch send validation
│   │   └── notification-response.dto.ts     # Response format
│   ├── notifications.controller.ts          # REST endpoints
│   ├── notifications.gateway.ts             # WebSocket gateway
│   ├── notifications.service.ts             # Business logic
│   └── notifications.module.ts              # Module configuration
├── shared/
│   ├── decorators/
│   │   └── current-user.decorator.ts        # User injection
│   ├── filters/
│   │   └── all-exceptions.filter.ts         # Exception handling
│   ├── guards/
│   │   ├── jwt.strategy.ts                  # JWT strategy
│   │   ├── jwt-auth.guard.ts                # HTTP guard
│   │   └── ws-jwt.guard.ts                  # WebSocket guard
│   ├── logger/
│   │   └── logger.service.ts                # Structured logging
│   └── types/
│       └── index.ts                         # TypeScript interfaces
├── config/
│   └── redis.service.ts                     # Redis client
├── app.module.ts                            # Root module
└── main.ts                                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis 6.0+

### Installation

```bash
# Clone repository
git clone <repo-url>
cd resilient-notification-engine

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start Redis (if not running)
redis-server

# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## 📡 API Documentation

### REST Endpoints

#### 1. Send Notification
```http
POST /notifications/send

Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "recipientId": "user-123",
  "title": "Order Shipped",
  "message": "Your order has been shipped",
  "type": "INFO",
  "senderId": "admin",
  "data": {
    "orderId": "order-456",
    "trackingUrl": "https://..."
  },
  "expiresIn": 604800
}
```

**Response (201)**:
```json
{
  "total": 1,
  "delivered": 1,
  "queued": 0,
  "failed": 0,
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

#### 2. Send Batch Notifications
```http
POST /notifications/send/batch

Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "recipientIds": ["user-1", "user-2", "user-3"],
  "title": "New Feature Available",
  "message": "Check out our new dashboard",
  "type": "SYSTEM"
}
```

#### 3. Get Pending Notifications
```http
GET /notifications/pending

Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**:
```json
{
  "count": 5,
  "notifications": [
    {
      "id": "notif-123",
      "recipientId": "user-123",
      "title": "Order Status",
      "message": "Your order is ready for pickup",
      "type": "INFO",
      "status": "PENDING",
      "createdAt": "2026-02-20T09:00:00.000Z"
    }
  ]
}
```

#### 4. Get Notification History
```http
GET /notifications/history?limit=20&offset=0

Authorization: Bearer <JWT_TOKEN>
```

#### 5. Mark as Read
```http
POST /notifications/:notificationId/read

Authorization: Bearer <JWT_TOKEN>
```

#### 6. Health Check
```http
GET /notifications/health
```

### WebSocket Events

#### Client → Server

**Connect**
```javascript
// Connection with JWT
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'Bearer <JWT_TOKEN>'
  }
  // OR query parameter: query: { token: '<JWT_TOKEN>' }
});
```

**Mark as Read**
```javascript
socket.emit('notification:read', { notificationId: 'notif-123' });
```

**Get History**
```javascript
socket.emit('notification:history', { limit: 20, offset: 0 });
```

**Health Check**
```javascript
socket.emit('ping');
```

#### Server → Client

**Connected**
```javascript
socket.on('connected', (data) => {
  // { message, socketId, userId, timestamp }
});
```

**Notification Received**
```javascript
socket.on('notification:received', (notification) => {
  // {
  //   id, recipientId, title, message, type, status, 
  //   data, createdAt, deliveredAt, wasPending
  // }
});
```

**Read Acknowledged**
```javascript
socket.on('notification:read-acknowledged', (data) => {
  // { notificationId, timestamp }
});
```

**Catch-up Complete**
```javascript
socket.on('notifications:catch-up-complete', (data) => {
  // { count, timestamp }
});
```

**Pong**
```javascript
socket.on('pong', (data) => {
  // { timestamp }
});
```

**Error**
```javascript
socket.on('error', (error) => {
  // { type, message }
});
```

## 💡 Usage Examples

### JavaScript Client Example

```javascript
import io from 'socket.io-client';
import axios from 'axios';

// Create JWT token (normally from login endpoint)
const jwtToken = 'eyJhbGc...';

// Initialize WebSocket connection
const socket = io('http://localhost:3000/notifications', {
  auth: { token: `Bearer ${jwtToken}` }
});

// Listen for notifications
socket.on('notification:received', (notification) => {
  console.log('📬 New notification:', notification.title);
  console.log('Message:', notification.message);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    socket.emit('notification:read', { notificationId: notification.id });
  }, 5000);
});

// Listen for catch-up completion
socket.on('notifications:catch-up-complete', (data) => {
  console.log(`✅ Received ${data.count} offline notifications`);
});

// Send notification via REST API
async function sendNotificationViaAPI() {
  try {
    const response = await axios.post(
      'http://localhost:3000/notifications/send',
      {
        recipientId: 'user-456',
        title: 'Hello!',
        message: 'This is a test notification',
        type: 'INFO'
      },
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );
    
    console.log('✅ Notification sent:', response.data);
  } catch (error) {
    console.error('❌ Error sending notification:', error.response.data);
  }
}

// Health check
socket.emit('ping');
socket.on('pong', () => console.log('✅ Connection alive'));
```

### cURL Examples

```bash
# Send notification
curl -X POST http://localhost:3000/notifications/send \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-123",
    "title": "Test",
    "message": "Hello World",
    "type": "INFO"
  }'

# Get pending notifications
curl -X GET http://localhost:3000/notifications/pending \
  -H "Authorization: Bearer $JWT_TOKEN"

# Health check
curl http://localhost:3000/notifications/health
```

## 🏆 Design Patterns & SOLID Principles

### 1. **Single Responsibility Principle (SRP)**
- `NotificationsService`: Business logic only
- `NotificationsGateway`: WebSocket communication only
- `NotificationsController`: HTTP request handling only
- `RedisService`: Data persistence only

### 2. **Open/Closed Principle (OCP)**
- Easy to extend notification types without modifying core logic
- Can add new delivery channels (Email, SMS) without changing existing code

### 3. **Liskov Substitution Principle (LSP)**
- Guards and filters are replaceable/upgradeable
- Redis can be swapped with other data stores

### 4. **Interface Segregation Principle (ISP)**
- DTOs separate concerns (send vs create vs response)
- Interfaces define minimal required contracts

### 5. **Dependency Injection Principle (DIP)**
- All dependencies injected via constructor
- No tight coupling between modules
- Testable and mockable

### Additional Patterns

- **Gateway Pattern**: NotificationsGateway for WebSocket handling
- **Service Pattern**: Centralized business logic in NotificationsService
- **Factory Pattern**: Notification creation with validation
- **Observer Pattern**: WebSocket events and Redis pub/sub
- **Repository Pattern**: Redis acts as data store abstraction

## 🔒 Security Features

1. **JWT Authentication**
   - All endpoints require valid JWT token
   - WebSocket connections validated at handshake
   - Token expiration enforced

2. **Input Validation**
   - DTOs with class-validator
   - Whitelist unknown properties
   - Type coercion and transformation

3. **Error Handling**
   - No sensitive data in error messages
   - Structured logging for debugging
   - Global exception filtering

4. **Data Protection**
   - Redis keys namespaced for isolation
   - Automatic TTL on sensitive data
   - No passwords/secrets in logs

## 📊 Performance Considerations

### Scalability
- **Horizontal**: Multiple server instances via Redis adapter
- **Vertical**: Efficient async/await pattern, no blocking operations
- **Data**: Redis lists for O(1) append/pop operations

### Optimization
- **Batch Delivery**: Stagger pending notifications to prevent client overload
- **Connection Pooling**: Redis client connection reuse
- **Caching**: Socket ID lookups in Redis (O(1) access)

### Monitoring
- Structured logging with timestamps
- Event tracking for debugging
- Health check endpoint

## 🧪 Testing

```bash
# Run tests
npm test

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🐳 Docker & Docker Compose

### **Quick Start with Docker Compose (Recommended)**

The easiest way to run the complete stack with Redis included:

```bash
# Step 1: Ensure Docker Desktop is running
# For Windows: Open "Docker Desktop" application

# Step 2: Start the complete stack
docker-compose up -d

# Step 3: Verify all services are running
docker-compose ps
```

Services will be available:
- **API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000/notifications
- **Redis Commander** (debug): http://localhost:8081

### **Stop and Clean Up**

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (careful - deletes Redis data!)
docker-compose down -v
```

### **View Logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f notification-api
docker-compose logs -f redis
```

### **Manual Docker Build and Run**

If you prefer to manage containers individually:

```bash
# Build the image
docker build -t notification-engine:latest .

# Run the container
docker run -d \
  --name notification-engine \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=your-secret-key \
  notification-engine

# View logs
docker logs -f notification-engine
```

### **Prerequisites**

- **Windows/Mac**: Docker Desktop installed and running
- **Linux**: Docker Engine and Docker Compose installed

To start Docker Desktop on Windows:
1. Search for "Docker Desktop" in Start menu
2. Click to launch (takes 1-2 minutes to start)
3. Monitor system tray (right side of taskbar) for Docker icon
4. Once ready, Docker services are available

## 📝 Production Checklist

- [ ] Change JWT_SECRET in `.env`
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS_ORIGIN
- [ ] Set up Redis with password/SSL
- [ ] Enable HTTPS for WebSocket (wss://)
- [ ] Configure logging to file system
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Set up database for persistent history
- [ ] Configure backup strategy for Redis

## 🤝 Contributing

When extending this codebase:
1. Follow TypeScript strict mode
2. Add proper error handling
3. Include comprehensive comments
4. Write unit tests
5. Follow existing code style

## 📄 License

MIT
