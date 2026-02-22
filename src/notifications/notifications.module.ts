import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { RedisService } from '@/config/redis.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { JwtStrategy } from '@/shared/guards/jwt.strategy';

/**
 * Notifications Module
 * 
 * Encapsulates all notification-related functionality:
 * - REST API endpoints for sending/managing notifications
 * - WebSocket gateway for real-time delivery
 * - Business logic for notification routing
 * - Integration with Redis for persistence and scaling
 * 
 * Exported services:
 * - NotificationsService: Core business logic
 * - NotificationsGateway: WebSocket gateway
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationsGateway,
        RedisService,
        LoggerService,
        JwtStrategy,
    ],
    exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }
