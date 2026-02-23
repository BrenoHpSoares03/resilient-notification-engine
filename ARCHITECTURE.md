# Architecture Decision Records (ADRs)

## ADR 1: Use Redis for Distributed State Management

### Status: ACCEPTED

### Context
We need a system that works across multiple server instances (horizontal scaling) and requires fast access to user socket mappings and notification queues.

### Decision
Use Redis as central data store for:
- User socket ID mappings
- Pending notification queues
- Notification metadata

### Rationale
- **Performance**: O(1) lookups for socket IDs
- **Scalability**: Shared state across instances
- **Reliability**: Data persistence with optional durability
- **Simplicity**: Simple key-value operations
- **Industry Standard**: Widely used for real-time systems

### Alternatives Considered
1. **Database (PostgreSQL)** - Too slow for socket lookups
2. **In-memory only** - No cross-instance sharing
3. **Message Queue (RabbitMQ)** - Not designed for lookups

### Consequences
- Requires Redis infrastructure
- Need to handle Redis failures gracefully
- Memory management needed for TTLs
- Dependent on Redis stability

---

## ADR 2: Socket.io with Redis Adapter for Horizontal Scalability

### Status: ACCEPTED

### Context
Multiple NestJS instances need to communicate about WebSocket connections and deliver notifications across all connected clients regardless of which server they're connected to.

### Decision
Use Socket.io library with `@socket.io/redis-adapter` for:
- Broadcasting across instances
- Serving multiple clients from different servers
- Automatic pub/sub management

### Rationale
- **Scalability**: Automatic inter-instance communication
- **Simplicity**: Handles pub/sub internally
- **Flexibility**: Can add instances without reconfiguration
- **Reliability**: Proven in production at scale

### Alternatives Considered
1. **Direct TCP connections** - Complex coordination
2. **Custom pub/sub** - Reinventing the wheel
3. **Using only one server** - Doesn't scale

### Consequences
- Dependent on Socket.io stability
- Redis becomes critical infrastructure
- Slightly higher latency than single-instance

---

## ADR 3: Queue Pending Notifications in Redis for Offline Users

### Status: ACCEPTED

### Context
Users may be offline when notifications are sent. We need to:
1. Store notifications safely
2. Deliver them when user reconnects (catch-up)
3. Avoid notification loss
4. Support high volume

### Decision
Use Redis lists (FIFO queues) with TTL:
- One queue per user: `notifications:pending:{userId}`
- Store as serialized JSON strings
- Automatic expiration via Redis TTL (7 days default)
- Clear queue after user reconnects

### Rationale
- **Ordering**: FIFO ensures delivery order
- **Speed**: List operations are O(1)
- **TTL**: Automatic cleanup of expired notifications
- **Scalability**: Supports any number of pending messages

### Alternatives Considered
1. **Database** - Slower, requires cleanup
2. **RabbitMQ** - Overkill for this use case
3. **In-memory** - Lost on server restart

### Consequences
- Time-limited delivery (7 days max)
- Queue cleared on manual reconnect
- Requires TTL monitoring

---

## ADR 4: JWT for WebSocket Authentication

### Status: ACCEPTED

### Context
Need to authenticate WebSocket connections securely without session state.

### Decision
Use JWT tokens passed during Socket.io handshake via:
- Query parameter: `?token=<jwt>`
- Or Authorization header: `Authorization: Bearer <jwt>`

### Rationale
- **Stateless**: No session storage needed
- **Scalable**: Works across multiple instances
- **Standard**: Industry best practice
- **Secure**: Cryptographic signing

### Alternatives Considered
1. **Session cookies** - Requires sticky sessions
2. **API keys** - Less secure, harder to revoke
3. **OAuth** - Overkill for internal APIs

### Consequences
- Token expiration requires reconnection
- Token rotation needed for long sessions
- Must protect token in transit
- Requires HTTPS in production

---

## ADR 5: Separate REST and WebSocket Endpoints

### Status: ACCEPTED

### Context
Need to support both:
- Batch notification sending via REST API
- Real-time reception via WebSocket

### Decision
Provide distinct endpoints:
- **REST**: `POST /notifications/send` - For sending/triggering
- **WebSocket**: `/notifications` namespace - For receiving

### Rationale
- **Separation of Concerns**: Send vs receive logic
- **Flexibility**: Different clients can use different methods
- **Scalability**: Can scale API and WebSocket separately
- **Testing**: Easier to test independently

### Alternatives Considered
1. **WebSocket only** - Harder to integrate with systems
2. **REST only** - Polling would be inefficient
3. **Single endpoint** - Mixing concerns

### Consequences
- Clients must connect both endpoints (usually automatic)
- More surface area to secure
- Slight additional complexity

---

## ADR 6: Mark Notifications as Delivered/Read

### Status: ACCEPTED

### Context
Need to track notification lifecycle for:
- Debugging delivery issues
- User analytics
- Proper cleanup

### Decision
Track states:
- **PENDING**: Created, not yet delivered
- **DELIVERED**: Sent to client
- **READ**: User marked as read
- **FAILED**: Delivery failed

### Rationale
- **Debugging**: Clear visibility into what happened
- **Analytics**: Track delivery success rates
- **User Experience**: Distinguish new vs old
- **Cleanup**: Know when to archive

### Alternatives Considered
1. **No tracking** - No visibility
2. **Track in database only** - Slower
3. **Track everything** - Too much noise

### Consequences
- Requires state updates in Redis
- Must handle concurrent updates
- Needs cleanup/archival strategy

---

## ADR 7: Use Data Transfer Objects (DTOs) for Validation

### Status: ACCEPTED

### Context
Need to validate input data and ensure type safety.

### Decision
Use `class-validator` and `class-transformer` for:
- Input validation (DTOs)
- Type coercion and transformation
- Response formatting

### Rationale
- **Type Safety**: Full TypeScript support
- **Validation**: Declarative, readable rules
- **DRY**: Reusable validation logic
- **Security**: Prevents invalid data injection

### Alternatives Considered
1. **Manual validation** - Error-prone
2. **Joi/Yup** - Additional dependency
3. **Database constraints only** - Too late

### Consequences
- TypeScript compilation required
- Minor performance overhead
- Must create DTOs for each endpoint

---

## ADR 8: Global Exception Filters for Error Handling

### Status: ACCEPTED

### Context
Need consistent error handling across:
- HTTP requests
- WebSocket events
- Business logic

### Decision
Implement global filters:
- `AllExceptionsFilter` - For HTTP
- `AllExceptionsWebSocketFilter` - For WebSocket
- Log all errors with context

### Rationale
- **Consistency**: Same format everywhere
- **Security**: No sensitive data leaks
- **Observability**: Complete error logging
- **Maintainability**: Centralized handling

### Alternatives Considered
1. **Per-endpoint error handling** - Inconsistent
2. **Silent failures** - Bad for debugging
3. **Raw error messages** - Security risk

### Consequences
- All errors logged centrally
- Consistent response format
- Need to maintain filters

---

## ADR 9: Structured Logging with Winston

### Status: ACCEPTED

### Context
Need comprehensive logging for:
- Debugging
- Monitoring
- Auditing

### Decision
Use Winston with:
- Multiple transports (console, files)
- Structured JSON logging
- Configurable log levels
- Contextual metadata

### Rationale
- **Structured**: Easy to parse and search
- **Flexible**: Multiple output targets
- **Levels**: Different verbosity for different contexts
- **Context**: Includes relevant metadata

### Alternatives Considered
1. **Console.log** - Not suitable for production
2. **Simple file logging** - Hard to search
3. **Built-in NestJS logger** - Less flexible

### Consequences
- Dependency on Winston
- Log storage management needed
- Slightly increased I/O

---

## ADR 10: Delivery Strategy (Instant vs Queue)

### Status: ACCEPTED

### Context
Different users have different connection states requiring different delivery strategies.

### Decision
Implement adaptive delivery:
1. **User Online**: Instant delivery via WebSocket
2. **User Offline**: Queue in Redis, deliver on reconnect
3. **Long Offline**: TTL-based cleanup per config

### Rationale
- **Optimization**: Fast path for online users
- **Reliability**: No lost messages for offline users
- **Resource**: Automatic cleanup of old messages
- **Transparency**: Client knows what happened

### Alternatives Considered
1. **Always queue** - Unnecessary latency
2. **Never queue** - Message loss
3. **Database queue** - Too slow and expensive

### Consequences
- State must be checked for each notification
- Requires catch-up logic on reconnect
- TTL settings need tuning

---

## ADR 10: Modular Type Organization by Domain

### Status: ACCEPTED

### Context
TypeScript interfaces and types need to be organized in a way that is:
- Easy to find (descriptive filenames)
- Scalable (one interface per file)
- Maintainable (grouped by domain/context)
- Explicit (avoiding wildcard imports via barrel exports)

### Decision
Organize types in `src/shared/types/` with:
- **Domain-based directories**: `/auth`, `/notification`, etc
- **Descriptive filenames**: `jwt-payload.interface.ts`, `notification.interface.ts`
- **No barrel exports**: Each type file is imported directly
- **Clear separation**: Enums in `/enum` subdirectory

```
src/shared/types/
├── auth/
│   ├── jwt-payload.interface.ts
│   └── user-socket-connection.interface.ts
└── notification/
    ├── notification.interface.ts
    ├── notification-queue-item.interface.ts
    └── enum/
        ├── notification-status.enum.ts
        └── notification-type.enum.ts
```

### Rationale
- **Clarity**: Filename immediately tells you what the file contains
- **Type Safety**: No hidden exports via index files
- **Scalability**: Easy to add new domains without modifying index files
- **Developer Experience**: IDE can find types directly without searching
- **Single Responsibility**: Each file has one clear purpose

### Alternatives Considered
1. **Barrel exports (index.ts)**: Less explicit, harder to track imports
2. **Flat structure**: All types in one folder - hard to navigate
3. **Framework-based organization**: Doesn't align with feature/domain

### Consequences
- Import paths are slightly longer but more explicit
- Easier to track dependencies between types
- Clear file organization makes onboarding simpler
- No need to maintain index files

---

## Summary: Technology Stack Decisions

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | NestJS | TypeScript, scalable, modular |
| Real-time | Socket.io | Fallbacks, easy API, Redis support |
| Distribution | Redis Adapter | Horizontal scaling made simple |
| Storage | Redis | Fast, distributed, suitable for queues |
| Auth | JWT | Stateless, standard, scalable |
| Validation | class-validator | Type-safe, declarative |
| Logging | Winston | Structured, flexible, production-ready |
| HTTP | Express | NestJS default, widely used |

All decisions prioritize:
1. **Scalability** - Handle growth without major changes
2. **Reliability** - No lost messages, graceful degradation
3. **Developer Experience** - Clear code, easy to extend
4. **Operational** - Easy to deploy, monitor, and maintain
