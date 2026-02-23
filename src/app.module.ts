import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggerService } from './shared/logger/logger.service';

@Module({
    imports: [NotificationsModule],
    providers: [LoggerService],
})
export class AppModule { }
