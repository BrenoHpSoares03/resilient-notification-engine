/**
 * Public API exports
 * 
 * This file defines the public API surface of the notification engine
 * that external modules can import from
 */

// Types and interfaces
export {
    JwtPayload,
    UserSocketConnection,
    NotificationStatus,
    NotificationType,
    Notification,
    NotificationQueueItem,
} from '@/shared/types';

// DTOs
export { CreateNotificationDto } from '@/notifications/dto/create-notification.dto';
export { SendNotificationDto } from '@/notifications/dto/send-notification.dto';
export {
    NotificationResponseDto,
    BatchNotificationResponseDto,
} from '@/notifications/dto/notification-response.dto';

// Services
export { NotificationsService } from '@/notifications/notifications.service';
export { RedisService } from '@/config/redis.service';
export { LoggerService } from '@/shared/logger/logger.service';

// Gateway
export { NotificationsGateway } from '@/notifications/notifications.gateway';

// Guards and strategies
export { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
export { WsJwtGuard } from '@/shared/guards/ws-jwt.guard';
export { JwtStrategy } from '@/shared/guards/jwt.strategy';

// Decorators
export { CurrentUser, CurrentWsUser } from '@/shared/decorators/current-user.decorator';

// Filters
export {
    AllExceptionsFilter,
    AllExceptionsWebSocketFilter,
} from '@/shared/filters/all-exceptions.filter';

// Module
export { NotificationsModule } from '@/notifications/notifications.module';
