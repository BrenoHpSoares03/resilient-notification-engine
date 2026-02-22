# 📚 Documentation Index - Complete Map

Use this index to find exactly what you need.

---

## 🎯 By Objective

### "I want to run the application with Docker"
1. **Read:** `QUICK-START-DOCKER.md` (5 minutes) ⭐ START HERE
2. **Then:** `DOCKER-TESTING.md` (complete testing)
3. **Scripts:** Run `.\test-api.ps1` to test automatically

### "I want to understand the architecture"
1. **Read:** `README.md` → section "Architecture Overview"
2. **Then:** `ARCHITECTURE.md` (10 Architecture Decision Records)
3. **Visually:** `PROJECT-SUMMARY.md` (complete diagram)

### "I want to use the REST API"
1. **Quick reference:** `QUICK-REFERENCE.md` (endpoint summary)
2. **Practical examples:** `API-EXAMPLES.md` (JavaScript, curl, Postman)
3. **Tests:** `DOCKER-TESTING.md` → section "Test 1-6"

### "I want to develop new features"
1. **Read:** `DEVELOPMENT.md` (complete workflow)
2. **Setup:** `npm install` + `npm run start:dev`
3. **Tests:** `npm test` and `npm run test:cov`

### "I'm going to production"
1. **Checklist:** `PRODUCTION-CHECKLIST.md` (100+ items)
2. **Deploy:** Use `docker-compose` or `docker build + docker run`
3. **Setup:** Follow `README.md` → "Production" section

---

## 📖 Guide by Documentation Type

### 🔴 **Getting Started (Start Here)**

| File | Time | Content |
|------|------|---------|
| **QUICK-START-DOCKER.md** | 5 min | 5-step guide with Docker |
| **README.md** | 10 min | Overview + features |
| **test-api.ps1** | auto | Script to test everything |

### 🟠 **To Understand**

| File | Time | Content |
|------|------|---------|
| **ARCHITECTURE.md** | 15 min | 10 architectural decisions |
| **PROJECT-SUMMARY.md** | 10 min | Complete project summary |
| **README.md** (Architecture section) | 5 min | Visual diagrams |

### 🟡 **To Use the API**

| File | Time | Content |
|------|------|---------|
| **QUICK-REFERENCE.md** | 2 min | Endpoint summary |
| **API-EXAMPLES.md** | 10 min | Examples in JS, curl, Postman |
| **DOCKER-TESTING.md** | 20 min | Tests with expected responses |

### 🟢 **To Develop**

| File | Time | Content |
|------|------|---------|
| **DEVELOPMENT.md** | 15 min | Dev workflow |
| **README.md** (File Architecture) | 10 min | File structure |
| **src/** directory | - | Commented source code |

### 🔵 **For Production**

| File | Time | Content |
|------|------|---------|
| **PRODUCTION-CHECKLIST.md** | 20 min | 100+ verification items |
| **Dockerfile** | - | Multi-stage build |
| **docker-compose.yml** | - | Container orchestration |

---

## 🗺️ Recommended Usage Flow

```
Start
  ↓
QUICK-START-DOCKER.md (basic setup)
  ↓
test-api.ps1 (verify functionality)
  ↓
┌─────────────────────────────────────┐
│ What do you want to do?             │
├─────────────────────────────────────┤
│                                     │
│ ✓ Understand the architecture       │
│   → ARCHITECTURE.md                 │
│   → PROJECT-SUMMARY.md              │
│                                     │
│ ✓ Use the endpoints                 │
│   → QUICK-REFERENCE.md              │
│   → API-EXAMPLES.md                 │
│   → DOCKER-TESTING.md               │
│                                     │
│ ✓ Develop features                  │
│   → DEVELOPMENT.md                  │
│   → npm run start:dev               │
│   → npm test                        │
│                                     │
│ ✓ Deploy to production              │
│   → PRODUCTION-CHECKLIST.md         │
│   → docker-compose up -d            │
│   → Monitor logs                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 📁 File Structure

```
resilient-notification-engine/
│
├── 📚 DOCUMENTATION
│   ├── README.md                    ← Start here for overview
│   ├── QUICK-START-DOCKER.md       ← How to run in 5 minutes ⭐
│   ├── DOCKER-TESTING.md           ← Complete testing guide
│   ├── ARCHITECTURE.md             ← Architectural decisions (ADRs)
│   ├── DEVELOPMENT.md              ← For developers
│   ├── API-EXAMPLES.md             ← Code examples
│   ├── QUICK-REFERENCE.md          ← Quick endpoint summary
│   ├── PRODUCTION-CHECKLIST.md     ← For production
│   ├── PROJECT-SUMMARY.md          ← Complete summary
│   └── DOCUMENTATION-INDEX.md      ← This file
│
├── 🐳 DOCKER
│   ├── Dockerfile                  ← Production build
│   └── docker-compose.yml          ← Orchestration (Redis + API)
│
├── 💻 SOURCE CODE (src/)
│   ├── main.ts                     ← Application entry point
│   ├── app.module.ts               ← Root module
│   ├── notifications/              ← Main feature (controller, service, gateway)
│   ├── shared/                     ← Guards, filters, pipes, decorators
│   └── config/                     ← Redis service
│
├── 🧪 TESTS
│   ├── test-api.ps1                ← PowerShell script to test everything
│   ├── test/                       ← E2E and unit tests
│   └── jest.config.js              ← Jest configuration
│
├── ⚙️ CONFIGURATION
│   ├── package.json                ← Dependencies and scripts
│   ├── tsconfig.json               ← TypeScript config
│   ├── .eslintrc.js                ← Linting
│   ├── .prettierrc                 ← Formatting
│   └── .env.example                ← Environment variables
│
└── 📦 BUILD
    └── dist/                       ← Compiled output (after npm run build)
```

---

## ⚡ Main Commands

### Docker
```bash
# Start complete stack (recommended)
docker-compose up -d

# View logs in real-time
docker-compose logs -f

# Stop containers
docker-compose down

# Remove everything (data + containers)
docker-compose down -v
```

### Local Development
```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run start:dev

# Build for production
npm run build

# Run tests
npm test
npm run test:cov
```

### Testing
```bash
# Via PowerShell (automatic)
.\test-api.ps1

# Via individual curl
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/notifications/health
```

---

## 🎯 Decision Matrix: Which Documentation to Read?

| Situation | Best Documentation | Time |
|-----------|-------------------|------|
| Already have Docker running, want to test API | DOCKER-TESTING.md | 15 min |
| Don't know how to run Docker | **QUICK-START-DOCKER.md** | 5 min ⭐ |
| Want to understand the design | ARCHITECTURE.md | 15 min |
| Need code examples | API-EXAMPLES.md | 10 min |
| Want to add features | DEVELOPMENT.md | 15 min |
| Going to production | PRODUCTION-CHECKLIST.md | 20 min |
| Need endpoints quickly | QUICK-REFERENCE.md | 2 min |
| Want good general overview | README.md | 10 min |

---

## 🆘 Troubleshooting by Error

| Error | Quick Solution | Documentation |
|-------|---------------|--------------|
| Docker can't find redis:7-alpine | Enable Docker Desktop | QUICK-START-DOCKER.md |
| 401 Unauthorized in tests | Generate valid JWT token | DOCKER-TESTING.md |
| Connection refused at localhost:3000 | Check `docker-compose ps` | DOCKER-TESTING.md |
| Don't know how to test WebSocket | See test-websocket.js in | DOCKER-TESTING.md |
| Errors in production | Consult checklist | PRODUCTION-CHECKLIST.md |

---

## 📞 Quick Information

### Available Ports
- **3000** - REST API + WebSocket
- **6379** - Redis (internal)
- **8081** - Redis Commander (debug)

### Main Environment Variables
```
NODE_ENV=development          # production for prod
JWT_SECRET=super-secret...    # CHANGE IN PRODUCTION!
REDIS_URL=redis://redis:6379 # Redis URL
PORT=3000                     # API port
CORS_ORIGIN=*                 # CORS for development
```

### Main Endpoints
```
POST   /notifications/send           - Send 1 notification
POST   /notifications/send/batch     - Send to multiple users
GET    /notifications/pending        - Pending notifications
GET    /notifications/history        - History
POST   /notifications/:id/read       - Mark as read
GET    /notifications/health         - Health check
```

---

## 🚀 Recommended Next Steps

1. **Now:** `QUICK-START-DOCKER.md` (5 min)
2. **Then:** `.\test-api.ps1` (run tests)
3. **Understand:** `ARCHITECTURE.md` or `DEVELOPMENT.md`
4. **Use:** `API-EXAMPLES.md` and `QUICK-REFERENCE.md`
5. **Production:** `PRODUCTION-CHECKLIST.md`

---

**Last updated:** February 20, 2026

For specific questions, consult the relevant documentation or run `.\test-api.ps1` to verify everything is working.
