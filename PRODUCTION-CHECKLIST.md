# Production Checklist & Deployment Guide

Use este checklist antes de fazer deploy em produção.

## 🔐 Security

### JWT Configuration
- [ ] Change `JWT_SECRET` to a strong random string (64+ characters)
  ```bash
  # Generate secure secret
  openssl rand -base64 32
  ```
- [ ] Set `JWT_EXPIRES_IN` to reasonable value (e.g., "24h")
- [ ] Use environment-specific secrets (never commit to git)
- [ ] Rotate secrets periodically

### Redis Security
- [ ] Set Redis password in connection string
  ```
  REDIS_URL=redis://:password@host:6379
  ```
- [ ] Use Redis over TLS/SSL for production
- [ ] Enable Redis AUTH in server config
- [ ] Restrict Redis access to application only (firewall)
- [ ] Use managed Redis service (AWS ElastiCache, Cloud Memorystore, etc.)

### HTTPS/TLS
- [ ] Enable HTTPS for all endpoints
- [ ] Use WebSocket Secure (wss://) for Socket.io
  ```typescript
  // In production setup
  const server = https.createServer(httpsOptions, app);
  ```
- [ ] Install valid SSL certificate
- [ ] Enable HSTS headers

### CORS Configuration
- [ ] Set specific `CORS_ORIGIN` instead of `*`
  ```env
  CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com
  ```
- [ ] Validate origin header on requests
- [ ] Use credentials: true only if needed

### API Security
- [ ] Implement rate limiting
  ```bash
  npm install @nestjs/throttler
  ```
- [ ] Add request size limits
- [ ] Implement CSRF protection if using cookies
- [ ] Add request validation
- [ ] Sanitize user inputs (already done via DTOs)

## 📊 Monitoring & Logging

### Logging Setup
- [ ] Set `LOG_LEVEL=info` (not debug)
- [ ] Configure log rotation
- [ ] Setup centralized logging (ELK, Datadog, etc.)
- [ ] Remove sensitive data from logs
- [ ] Setup log alerts for errors

### Application Monitoring
- [ ] Setup APM (Application Performance Monitoring)
  - New Relic
  - Datadog
  - AWS CloudWatch
  - Prometheus + Grafana
- [ ] Monitor endpoint latency
- [ ] Monitor notification delivery rates
- [ ] Setup alerts for failures

### Infrastructure Monitoring
- [ ] Monitor Redis memory usage
- [ ] Monitor Redis CPU usage
- [ ] Monitor application memory
- [ ] Monitor application CPU
- [ ] Setup disk space alerts
- [ ] Monitor network bandwidth

### Health Checks
- [ ] Test `/notifications/health` endpoint
- [ ] Monitor WebSocket connection status
- [ ] Setup synthetic monitoring
- [ ] Configure alerting on health check failures

## 🗄️ Database & Persistence

### Redis Persistence
- [ ] Enable Redis persistence (RDB or AOF)
- [ ] Configure backup strategy
- [ ] Test disaster recovery procedures
- [ ] Setup automated backups
- [ ] Monitor Redis replication lag (if using replicas)

### Data Retention
- [ ] Define notification TTL policy (currently 7 days)
- [ ] Setup archival process for old notifications
- [ ] Consider database for historical data
- [ ] Setup cleanup jobs

### Backup & Recovery
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Automate daily backups
- [ ] Store backups in multiple locations

## 🐳 Docker & Container

### Image Optimization
- [ ] Use multi-stage build (already configured)
- [ ] Minimize image size
- [ ] Use specific version tags (not `latest`)
- [ ] Scan image for vulnerabilities
  ```bash
  docker scan notification-engine:v1.0.0
  ```

### Container Security
- [ ] Run as non-root user (already configured)
- [ ] Use read-only root filesystem where possible
- [ ] No hardcoded secrets in image
- [ ] Use secrets management (AWS Secrets, Vault, etc.)

### Container Registry
- [ ] Push to private registry
- [ ] Enable image scanning
- [ ] Setup automatic cleanup of old images
- [ ] Configure image signing

## 🚀 Deployment

### Environment Setup
- [ ] Create production `.env` file (don't commit)
- [ ] Verify all environment variables set
- [ ] Test environment variables in staging
- [ ] Document all required variables

### Application Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Disable development features
- [ ] Configure appropriate timeouts
- [ ] Set rate limiting thresholds

### Database Migration
- [ ] Define data structures (if adding DB)
- [ ] Write migration scripts
- [ ] Test migrations in staging
- [ ] Plan rollback procedure

### Load Testing
- [ ] Test with expected load
- [ ] Identify bottlenecks
- [ ] Test auto-scaling triggers
- [ ] Document capacity limits

## 🔄 Scaling

### Horizontal Scaling
- [ ] Configure load balancer (sticky sessions not needed!)
- [ ] Setup multiple application instances
- [ ] Configure Redis adapter for multi-instance
- [ ] Test inter-instance communication

### Auto-scaling
- [ ] Setup CPU/Memory based scaling
- [ ] Configure min/max instances
- [ ] Test scale-up scenarios
- [ ] Test scale-down scenarios

### Redis Scaling
- [ ] Consider Redis cluster for high availability
- [ ] Setup Redis sentinel for failover
- [ ] Test failover procedures
- [ ] Monitor cluster health

## 🛡️ High Availability

### Redundancy
- [ ] Setup multiple application instances (at least 2)
- [ ] Setup Redis replication
- [ ] Configure automatic failover
- [ ] Setup load balancing

### Disaster Recovery
- [ ] Document RTO (Recovery Time Objective)
- [ ] Document RPO (Recovery Point Objective)
- [ ] Test disaster recovery procedure
- [ ] Maintain up-to-date documentation

### Network
- [ ] Use CDN if applicable
- [ ] Setup DDoS protection
- [ ] Configure firewall rules
- [ ] Monitor network traffic

## 📋 Testing

### Pre-deployment Testing
- [ ] Run full test suite
  ```bash
  npm test
  ```
- [ ] Run E2E tests
  ```bash
  npm run test:e2e
  ```
- [ ] Run linting
  ```bash
  npm run lint
  ```
- [ ] Run type checking
  ```bash
  npx tsc --noEmit
  ```

### Load Testing
- [ ] Use Apache JMeter or k6
- [ ] Test notification delivery under load
- [ ] Identify performance bottlenecks
- [ ] Document results

### Integration Testing
- [ ] Test with actual Redis instance
- [ ] Test with actual database (if using)
- [ ] Test third-party integrations
- [ ] Test WebSocket connections

## 📚 Documentation

### Code Documentation
- [ ] Code comments are clear
- [ ] README is up-to-date
- [ ] API documentation is complete
- [ ] Setup instructions are accurate

### Operational Documentation
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Monitoring setup documented
- [ ] Troubleshooting guide created

### Team Knowledge
- [ ] Team trained on deployment
- [ ] On-call procedures documented
- [ ] Incident response procedures defined
- [ ] Runbooks created for common issues

## 🔧 Operations

### Maintenance Windows
- [ ] Schedule maintenance windows
- [ ] Notify users of planned downtime
- [ ] Test zero-downtime deployment
- [ ] Document maintenance procedures

### Updates & Patches
- [ ] Plan security update process
- [ ] Monitor for critical updates
- [ ] Test updates in staging first
- [ ] Plan rollback strategy

### Monitoring & Alerting
- [ ] Setup critical alerts (API down, Redis down)
- [ ] Setup warning alerts (high latency, high memory)
- [ ] Configure escalation procedures
- [ ] Test alert notifications

## 🔍 Compliance & Audit

### Compliance
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)
- [ ] Data retention policies
- [ ] User consent management

### Audit & Logging
- [ ] Enable audit logging
- [ ] Log all security-relevant events
- [ ] Configure log retention
- [ ] Setup log monitoring

### Security Scanning
- [ ] Run dependency security scan
  ```bash
  npm audit
  npm audit fix
  ```
- [ ] Run SAST (Static Application Security Testing)
- [ ] Run DAST (Dynamic Application Security Testing)
- [ ] Fix all critical vulnerabilities

## 🎯 Final Pre-deployment Checklist

Before going live:

```bash
# 1. Run complete test suite
npm test

# 2. Run linting
npm run lint

# 3. Check dependencies for vulnerabilities
npm audit

# 4. Build application
npm run build

# 5. Build Docker image
docker build -t notification-engine:v1.0.0 .

# 6. Scan Docker image
docker scan notification-engine:v1.0.0

# 7. Run final verification
npm run start:prod

# 8. Test all endpoints
curl http://localhost:3000/notifications/health

# 9. Document any issues
# 10. Get approval from team
```

## 📞 Deployment Support

### During Deployment
- [ ] Have rollback plan ready
- [ ] Monitor all systems
- [ ] Have team available for issues
- [ ] Document any issues found
- [ ] Have communication channel open

### Post-deployment
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor resource usage
- [ ] Check user feedback
- [ ] Be prepared to rollback if needed

## 🎓 Team Training

Before production launch, ensure team is trained on:
- [ ] How to deploy the application
- [ ] How to monitor the system
- [ ] How to respond to incidents
- [ ] How to scale the system
- [ ] How to handle common issues
- [ ] Where to find documentation

## 📅 Post-launch Review

After 1 week in production:
- [ ] Review all metrics
- [ ] Check error logs
- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Plan improvements

After 1 month in production:
- [ ] Review capacity planning
- [ ] Optimize configurations
- [ ] Plan scaling strategy
- [ ] Update documentation

---

## Resources

- [OWASP Production Best Practices](https://cheatsheetseries.owasp.org/)
- [NestJS Production Checklist](https://docs.nestjs.com/deployment)
- [Redis Production Guide](https://redis.io/topics/admin)
- [Socket.io Security](https://socket.io/docs/v4/security/)

---

**Last Updated: 2026-02-20**
**Version: 1.0.0-ready**
