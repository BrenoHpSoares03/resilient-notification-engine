🚀 QUICK REFERENCE - Resilient Notification Engine

═══════════════════════════════════════════════════════════════════════════════

📍 PROJECT OVERVIEW
────────────────────────────────────────────────────────────────────────────────
Real-time notification system with:
✓ WebSocket support (Socket.io)
✓ Redis persistence & scaling
✓ Catch-up delivery for offline users
✓ Horizontal scalability
✓ JWT authentication
✓ Production-ready code

═══════════════════════════════════════════════════════════════════════════════

🎯 QUICK START
────────────────────────────────────────────────────────────────────────────────

1. Setup:
   npm install
   cp .env.example .env
   redis-server  # or: docker run -d -p 6379:6379 redis:7-alpine

2. Development:
   npm run start:dev

3. Testing:
   npm test
   npm run test:cov

4. Production:
   npm run build
   npm run start:prod

═══════════════════════════════════════════════════════════════════════════════

📁 KEY FILES
────────────────────────────────────────────────────────────────────────────────

STARTUP & CONFIGURATION:
  src/main.ts                          → Application entry point
  src/app.module.ts                    → Root module
  .env.example                         → Environment template
  docker-compose.yml                   → Full stack setup

CORE BUSINESS LOGIC:
  src/notifications/notifications.service.ts       → Core logic
  src/notifications/notifications.gateway.ts       → WebSocket handler
  src/notifications/notifications.controller.ts    → REST API

SECURITY & VALIDATION:
  src/shared/guards/                   → Authentication guards
  src/notifications/dto/               → Input validation
  src/shared/filters/all-exceptions.filter.ts     → Error handling

INFRASTRUCTURE:
  src/config/redis.service.ts          → Redis client
  src/shared/logger/logger.service.ts  → Logging service

═══════════════════════════════════════════════════════════════════════════════

🔌 API ENDPOINTS
────────────────────────────────────────────────────────────────────────────────

Send Notification:
  POST /notifications/send
  - recipientId: string
  - title: string
  - message: string
  - type: "SYSTEM"|"USER"|"ALERT"|"INFO"|"WARNING"|"ERROR"
  - data?: object
  - expiresIn?: number (seconds)

Send Batch:
  POST /notifications/send/batch
  - recipientIds: string[]
  - title, message, type (same as above)

Get Pending:
  GET /notifications/pending

Get History:
  GET /notifications/history?limit=20&offset=0

Mark as Read:
  POST /notifications/:notificationId/read

Health Check:
  GET /notifications/health

═══════════════════════════════════════════════════════════════════════════════

🔌 WEBSOCKET EVENTS
────────────────────────────────────────────────────────────────────────────────

Client sends:
  socket.emit('notification:read', { notificationId })
  socket.emit('notification:history', { limit, offset })
  socket.emit('ping')

Server sends:
  socket.on('connected', data)
  socket.on('notification:received', notification)
  socket.on('notification:read-acknowledged', data)
  socket.on('notifications:catch-up-complete', data)
  socket.on('pong')
  socket.on('error', error)

═══════════════════════════════════════════════════════════════════════════════

🔐 AUTHENTICATION
────────────────────────────────────────────────────────────────────────────────

HTTP Requests:
  Authorization: Bearer <JWT_TOKEN>

WebSocket Connection:
  io('http://localhost:3000/notifications', {
    auth: { token: 'Bearer <JWT_TOKEN>' }
  })
  // OR
  io('http://localhost:3000/notifications?token=<JWT_TOKEN>')

═══════════════════════════════════════════════════════════════════════════════

🌍 ENVIRONMENT VARIABLES
────────────────────────────────────────────────────────────────────────────────

Required:
  NODE_ENV              → development|production
  PORT                  → 3000 (default)
  REDIS_URL             → redis://localhost:6379

Recommended:
  JWT_SECRET            → Change from default!
  JWT_EXPIRES_IN        → 24h
  CORS_ORIGIN           → Restrict to your domain
  LOG_LEVEL             → info|debug|warn|error

═══════════════════════════════════════════════════════════════════════════════

📊 DATA STRUCTURES
────────────────────────────────────────────────────────────────────────────────

Notification:
  {
    id: string                           // UUID
    recipientId: string                  // User ID
    senderId?: string                    // Source (optional)
    title: string
    message: string
    type: NotificationType               // Enum
    status: NotificationStatus           // PENDING|DELIVERED|READ|FAILED
    data?: object                        // Custom payload
    createdAt: number                    // Unix timestamp
    deliveredAt?: number
    readAt?: number
    expiresAt?: number
  }

NotificationStatus:
  PENDING   → Created, not yet delivered
  DELIVERED → Sent to user
  READ      → User marked as read
  FAILED    → Delivery failed

NotificationType:
  SYSTEM, USER, ALERT, INFO, WARNING, ERROR

═══════════════════════════════════════════════════════════════════════════════

🔍 REDIS KEYS
────────────────────────────────────────────────────────────────────────────────

User socket mapping:
  user:socket:{userId} → Stores socketId + connection metadata

Pending notifications queue:
  notifications:pending:{userId} → FIFO list of notifications (LPUSH/RPOP)

Notification data:
  notifications:data:{notificationId} → Full notification object

═══════════════════════════════════════════════════════════════════════════════

🧪 TESTING
────────────────────────────────────────────────────────────────────────────────

Run tests:
  npm test                    # All tests
  npm test:watch              # Watch mode
  npm test:cov                # With coverage
  npm test -- filename        # Specific file

Important:
  Tests are in: test/
  Mocks are provided for Redis/Logger
  Run Redis before E2E tests

═══════════════════════════════════════════════════════════════════════════════

🐳 DOCKER
────────────────────────────────────────────────────────────────────────────────

Start everything:
  docker-compose up -d

Services:
  notification-api   → http://localhost:3000
  redis             → localhost:6379
  redis-commander   → http://localhost:8081 (debugging UI)

Build custom image:
  docker build -t notification-engine:v1.0.0 .

Stop:
  docker-compose down

Clean:
  docker-compose down -v  # Remove volumes

═══════════════════════════════════════════════════════════════════════════════

📈 DEPLOYMENT
────────────────────────────────────────────────────────────────────────────────

Build:
  npm run build           # Creates dist/ directory

Deploy (production):
  NODE_ENV=production npm run start:prod

Docker:
  docker build -t app:v1.0.0 .
  docker push your-registry.com/app:v1.0.0
  kubectl apply -f k8s-manifest.yaml  # If using K8s

Environment (production):
  - Change JWT_SECRET to strong random value
  - Set REDIS_URL to production Redis
  - Use HTTPS (wss:// for WebSocket)
  - Set CORS_ORIGIN to your domain
  - Set LOG_LEVEL=info
  - Enable monitoring & alerting

═══════════════════════════════════════════════════════════════════════════════

🚨 TROUBLESHOOTING
────────────────────────────────────────────────────────────────────────────────

Redis connection failed:
  → redis-cli ping
  → Check REDIS_URL in .env
  → Start Redis: redis-server or docker run

Port 3000 already in use:
  → Kill: kill -9 $(lsof -t -i :3000)
  → Or use: PORT=3001 npm run start:dev

WebSocket connection refused:
  → Check JWT token validity
  → Check CORS_ORIGIN setting
  → Check firewall rules

Tests failing:
  → Clear node_modules: rm -rf node_modules && npm install
  → Start Redis: redis-server
  → Clear cache: npm cache clean --force

═══════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTATION
────────────────────────────────────────────────────────────────────────────────

README.md                  → Full guide, API reference
ARCHITECTURE.md            → Design decisions (10 ADRs)
DEVELOPMENT.md             → Development workflow guide
API-EXAMPLES.md            → Working code examples
PROJECT-SUMMARY.md         → Complete file structure overview
PRODUCTION-CHECKLIST.md    → Pre-deployment checklist
QUICK-REFERENCE.md         → This file!

═══════════════════════════════════════════════════════════════════════════════

💡 COMMON TASKS
────────────────────────────────────────────────────────────────────────────────

Send a notification:
  curl -X POST http://localhost:3000/notifications/send \\
    -H "Authorization: Bearer <JWT>" \\
    -H "Content-Type: application/json" \\
    -d '{"recipientId":"user-123","title":"Test","message":"Hello","type":"INFO"}'

Monitor Redis:
  redis-cli MONITOR          # Watch all commands
  redis-cli KEYS "*"         # List all keys
  redis-cli DBSIZE           # Size info
  redis-cli INFO             # Stats

View logs:
  tail -f logs/combined.log
  tail -f logs/error.log

Debug in VS Code:
  F5 (with .vscode/launch.json configured)

═══════════════════════════════════════════════════════════════════════════════

🎓 LEARNING RESOURCES
────────────────────────────────────────────────────────────────────────────────

Code Examples:     API-EXAMPLES.md
Architecture:      ARCHITECTURE.md (10 detailed ADRs)
Development:       DEVELOPMENT.md (complete workflow)
Production:        PRODUCTION-CHECKLIST.md

Official Docs:
  NestJS:    https://docs.nestjs.com
  Socket.io: https://socket.io/docs/
  Redis:     https://redis.io/documentation
  TypeScript: https://www.typescriptlang.org/docs/

═══════════════════════════════════════════════════════════════════════════════

✅ PROJECT STATUS
────────────────────────────────────────────────────────────────────────────────

[✓] Core architecture implemented
[✓] REST API endpoints complete
[✓] WebSocket gateway functional
[✓] Redis integration working
[✓] Authentication (JWT) configured
[✓] Error handling & logging
[✓] Documentation complete
[✓] Docker setup ready
[✓] Tests provided
[✓] Production-ready code

STATUS: Ready for production! 🚀

═══════════════════════════════════════════════════════════════════════════════

Last Updated: 2026-02-20
Version: 1.0.0
