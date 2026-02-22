import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggerService } from './shared/logger/logger.service';

/**
 * Root Application Module
 * 
 * Main module that imports all feature modules
 * Currently includes:
 * - NotificationsModule: Real-time notification system
 * 
 * Can be extended with additional modules:
 * - AuthModule: User authentication
 * - DatabaseModule: Data persistence
 * - etc.
 */
@Module({
    imports: [NotificationsModule],
    providers: [LoggerService],
})
export class AppModule { }
