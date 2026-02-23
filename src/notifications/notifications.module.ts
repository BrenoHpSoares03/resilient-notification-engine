import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { RedisService } from '@/config/redis.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { JwtStrategy } from '@/shared/guards/jwt.strategy';

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
