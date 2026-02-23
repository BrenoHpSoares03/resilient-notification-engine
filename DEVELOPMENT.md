# Development Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ ([Download](https://nodejs.org))
- Redis 6+ ([Installation Guide](https://redis.io/download))
- npm or yarn

### 2. Setup

```bash
# Clone repository
git clone <your-repo-url>
cd resilient-notification-engine

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed
nano .env
```

### 3. Start Redis

```bash
# Using Docker (recommended)
docker run -d -p 6379:6379 redis:7-alpine

# Or if Redis is installed locally
redis-server
```

### 4. Start Development Server

```bash
# Start in watch mode (auto-reload)
npm run start:dev

# Output should show:
# ✓ Compiled successfully
# 🚀 Application is running on http://localhost:3000
# 📡 WebSocket namespace available at /notifications
```

### 5. Verify Installation

```bash
# Health check
curl http://localhost:3000/notifications/health

# Response:
# {"status":"ok","timestamp":"2026-02-20T..."}
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:cov

# Run specific test file
npm test -- notifications.service.spec.ts
```

### Code Quality

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Fix linting errors automatically
npm run lint -- --fix
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Output in ./dist directory

# Start production build
npm run start:prod
```

## File Structure

```
src/
├── notifications/              # Notification module
│   ├── dto/                   # Data transfer objects
│   │   ├── create-notification.dto.ts
│   │   ├── send-notification.dto.ts
│   │   └── notification-response.dto.ts
│   ├── notifications.controller.ts    # REST endpoints
│   ├── notifications.gateway.ts       # WebSocket gateway
│   ├── notifications.service.ts       # Business logic
│   └── notifications.module.ts        # Module definition
│
├── shared/                     # Shared utilities
│   ├── decorators/            # Custom decorators
│   │   └── current-user.decorator.ts
│   ├── filters/               # Exception filters
│   │   └── all-exceptions.filter.ts
│   ├── guards/                # Authentication guards
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── ws-jwt.guard.ts
│   ├── logger/                # Logging service
│   │   └── logger.service.ts
│   └── types/                 # TypeScript interfaces
│       ├── auth/              # Authentication types
│       │   ├── jwt-payload.interface.ts
│       │   └── user-socket-connection.interface.ts
│       └── notification/      # Notification types
│           ├── notification.interface.ts
│           ├── notification-queue-item.interface.ts
│           └── enum/
│               ├── notification-status.enum.ts
│               └── notification-type.enum.ts
│
├── config/                     # Configuration
│   └── redis.service.ts       # Redis client
│
├── app.module.ts              # Root module
└── main.ts                    # Application entry point

test/                           # Test files
├── notifications.e2e-spec.ts  # E2E tests
└── notifications.service.spec.ts  # Unit tests
```

## Adding a New Feature

### 1. Define Types (if needed)

```typescript
// src/shared/types/my-domain/my-feature.interface.ts
export interface MyFeatureEvent {
  id: string;
  userId: string;
  // ... properties
}
```

### 2. Create DTOs

```typescript
// src/notifications/dto/my-feature.dto.ts
import { IsString } from 'class-validator';

export class MyFeatureDto {
  @IsString()
  property: string;
}
```

### 3. Add Service Method

```typescript
// src/notifications/notifications.service.ts
async myNewFeature(dto: MyFeatureDto): Promise<MyFeatureEvent> {
  try {
    // Implementation
    this.logger.info('Feature executed');
    return event;
  } catch (error) {
    this.logger.error('Feature failed', error);
    throw error;
  }
}
```

### 4. Add Controller Endpoint (if REST)

```typescript
// src/notifications/notifications.controller.ts
@Post('my-feature')
@UseGuards(JwtAuthGuard)
async myFeature(
  @Body(ValidationPipe) dto: MyFeatureDto,
  @CurrentUser() user: JwtPayload,
): Promise<any> {
  return this.notificationsService.myNewFeature(dto);
}
```

### 5. Add WebSocket Handler (if real-time)

```typescript
// src/notifications/notifications.gateway.ts
@SubscribeMessage('my-event')
async handleMyEvent(
  @MessageBody() data: any,
  @ConnectedSocket() client: Socket,
  @CurrentWsUser() user: JwtPayload,
) {
  // Implementation
}
```

### 6. Write Tests

```typescript
// test/my-feature.spec.ts
describe('MyFeature', () => {
  it('should work correctly', async () => {
    // Test implementation
  });
});
```

## Debugging

### Using Chrome DevTools

```bash
# Start server with debugging
npm run start:debug

# Open Chrome and navigate to:
# chrome://inspect

# Click "Inspect" to open debugger
```

### Using VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "skipFiles": ["<node_internals>/**"],
  "program": "${workspaceFolder}/node_modules/.bin/nest",
  "args": ["start", "--debug", "--watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then press `F5` to start debugging.

### Logging

Adjust log level in `.env`:

```env
LOG_LEVEL=debug  # Verbose logging
LOG_LEVEL=info   # Normal logging
LOG_LEVEL=warn   # Warnings only
LOG_LEVEL=error  # Errors only
```

### Redis Inspection

```bash
# Using Redis CLI
redis-cli

# View all keys
> KEYS *

# Inspect specific key
> GET user:socket:user-123
> LRANGE notifications:pending:user-123 0 -1

# Clear all (development only!)
> FLUSHALL
```

## Docker Development

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Services:
# - notification-api: http://localhost:3000
# - redis: localhost:6379
# - redis-commander: http://localhost:8081 (debugging UI)

# View logs
docker-compose logs -f notification-api

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

### Building Custom Image

```bash
# Build image
docker build -t notification-engine:latest .

# Run container
docker run -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  notification-engine:latest

# With environment file
docker run --env-file .env -p 3000:3000 notification-engine:latest
```

## Testing Guide

### Unit Tests

```bash
# Test a single service
npm test -- notifications.service.spec.ts

# Test with coverage
npm test -- notifications.service.spec.ts --coverage

# Watch mode
npm test -- notifications.service.spec.ts --watch
```

### E2E Tests

```bash
# Run E2E tests
npm test -- e2e

# E2E tests require running application
# Start server before running tests
npm run start:dev &
npm run test:e2e
```

### Test Database Reset

```bash
# Clear Redis before tests
redis-cli FLUSHALL

# Or use Docker
docker-compose down -v && docker-compose up
```

### Example Test

```typescript
describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    // Setup
  });

  it('should send notification', async () => {
    const result = await service.sendNotification({
      recipientId: 'user-123',
      title: 'Test',
      message: 'Test message',
      type: 'INFO',
    });

    expect(result.delivered).toContain('user-123');
  });
});
```

## Environment Variables

### Development

```env
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-123
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### Production

```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis.prod.example.com:6379
JWT_SECRET=<strong-random-key>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## Common Issues

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should respond: PONG

# If not running:
redis-server  # Start Redis

# Or with Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or with npm cache clear
npm cache clean --force
npm install
```

### TypeScript Compilation Errors

```bash
# Type check without building
npx tsc --noEmit

# Watch mode type checking
npx tsc --watch --noEmit
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push branch
git push origin feature/my-feature

# Create pull request on GitHub/GitLab
```

## Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run lint
npm test -- --testPathPattern="$(git diff --cached --name-only | grep -o '[^/]*\.spec\.ts')"
```

## Performance Monitoring

### Checking Response Times

```typescript
// In service method
const start = Date.now();
// ... do work ...
const elapsed = Date.now() - start;
this.logger.debug(`Operation took ${elapsed}ms`);
```

### Memory Usage

```bash
# Monitor while running
watch -n 1 'ps aux | grep node'

# Or in separate terminal
node --inspect dist/main
# Open chrome://inspect
```

## Deployment

### Building Distribution

```bash
npm run build

# Creates ./dist directory with:
# - Compiled JavaScript
# - Type definitions
# - Source maps
```

### Creating Release

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tags
git push origin --tags

# Create release notes
# Update CHANGELOG.md
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Socket.io Documentation](https://socket.io/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

1. Check [README.md](./README.md) for overview
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design
3. Check existing tests for examples
4. Review inline code comments
5. Open an issue on GitHub
