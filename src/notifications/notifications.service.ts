import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '@/config/redis.service';
import { LoggerService } from '@/shared/logger/logger.service';
import {
    Notification,
} from '@/shared/types/notification/notification.interface';
import { NotificationStatus } from '@/shared/types/notification/enum/notification-status.enum';
import {
    UserSocketConnection,
} from '@/shared/types/auth/user-socket-connection.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
    // Redis key prefixes
    private readonly USER_SOCKET_KEY_PREFIX = 'user:socket:';
    private readonly PENDING_NOTIFICATIONS_KEY_PREFIX = 'notifications:pending:';
    private readonly NOTIFICATION_KEY_PREFIX = 'notifications:data:';

    constructor(
        private redisService: RedisService,
        private logger: LoggerService,
    ) { }

    async createNotification(dto: CreateNotificationDto): Promise<Notification> {
        try {
            const notification: Notification = {
                id: randomUUID(),
                recipientId: dto.recipientId,
                senderId: dto.senderId,
                title: dto.title,
                message: dto.message,
                type: dto.type,
                status: NotificationStatus.PENDING,
                data: dto.data,
                createdAt: Date.now(),
                expiresAt: dto.expiresIn ? Date.now() + dto.expiresIn * 1000 : undefined,
            };

            this.logger.debug(`Notification created: ${notification.id}`, {
                recipientId: notification.recipientId,
                type: notification.type,
            });

            return notification;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to create notification', errorMessage);
            throw new BadRequestException('Failed to create notification');
        }
    }

    async sendNotification(dto: SendNotificationDto): Promise<{
        delivered: string[];
        queued: string[];
        failed: string[];
    }> {
        try {
            // Validate input
            if (!dto.recipientId && (!dto.recipientIds || dto.recipientIds.length === 0)) {
                throw new BadRequestException('Either recipientId or recipientIds must be provided');
            }

            const recipientIds = dto.recipientId ? [dto.recipientId] : dto.recipientIds || [];
            const delivered: string[] = [];
            const queued: string[] = [];
            const failed: string[] = [];

            // Process each recipient
            for (const recipientId of recipientIds) {
                try {
                    const notification = await this.createNotification({
                        recipientId,
                        title: dto.title,
                        message: dto.message,
                        type: dto.type,
                        senderId: dto.senderId,
                        data: dto.data,
                        expiresIn: dto.expiresIn,
                    });

                    // Check if user is online
                    const socketId = await this.getUserSocketId(recipientId);

                    if (socketId) {
                        delivered.push(recipientId);
                        this.logger.debug(`Notification routed to WebSocket: ${recipientId}`);
                    } else {
                        await this.queueNotification(notification);
                        queued.push(recipientId);
                        this.logger.debug(`Notification queued for offline user: ${recipientId}`);
                    }

                    await this.storeNotification(notification);
                } catch (error) {
                    const currentErrorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to process notification for ${recipientId}`, currentErrorMessage);
                    failed.push(recipientId);
                }
            }

            this.logger.info('Notifications processed', {
                total: recipientIds.length,
                delivered: delivered.length,
                queued: queued.length,
                failed: failed.length,
            });

            return { delivered, queued, failed };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Notification send operation failed', errorMessage);
            throw error;
        }
    }

    async registerUserSocket(userId: string, socketId: string): Promise<void> {
        try {
            const connection: UserSocketConnection = {
                userId,
                socketId,
                connectedAt: Date.now(),
                isActive: true,
            };

            const key = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
            await this.redisService.set(key, JSON.stringify(connection), 86400); // 24h TTL

            this.logger.info(`User socket registered: ${userId} -> ${socketId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to register user socket: ${userId}`, errorMessage);
            throw error;
        }
    }

    async unregisterUserSocket(userId: string): Promise<void> {
        try {
            const key = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
            await this.redisService.delete(key);

            this.logger.info(`User socket unregistered: ${userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to unregister user socket: ${userId}`, errorMessage);
            throw error;
        }
    }

    async getUserSocketId(userId: string): Promise<string | null> {
        try {
            const key = `${this.USER_SOCKET_KEY_PREFIX}${userId}`;
            const data = await this.redisService.get(key);

            if (!data) {
                return null;
            }

            const connection = JSON.parse(data) as UserSocketConnection;
            return connection.isActive ? connection.socketId : null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to get socket ID for user: ${userId}`, errorMessage);
            return null;
        }
    }

    private async queueNotification(notification: Notification): Promise<void> {
        try {
            const key = `${this.PENDING_NOTIFICATIONS_KEY_PREFIX}${notification.recipientId}`;
            const payload = JSON.stringify(notification);

            await this.redisService.lpush(key, payload);

            // Set expiration on the queue key
            if (notification.expiresAt) {
                const ttl = Math.floor((notification.expiresAt - Date.now()) / 1000);
                if (ttl > 0) {
                    await this.redisService.getClient().expire(key, ttl);
                }
            } else {
                // Default 7 days TTL
                await this.redisService.getClient().expire(key, 604800);
            }

            this.logger.debug(`Notification queued: ${notification.id}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to queue notification: ${notification.id}`, errorMessage);
            throw error;
        }
    }

    private async storeNotification(notification: Notification): Promise<void> {
        try {
            const key = `${this.NOTIFICATION_KEY_PREFIX}${notification.id}`;
            await this.redisService.set(
                key,
                JSON.stringify(notification),
                86400, // 24h TTL
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to store notification: ${notification.id}`, errorMessage);
            // Non-critical, don't throw
        }
    }

    async getPendingNotifications(userId: string): Promise<Notification[]> {
        try {
            const key = `${this.PENDING_NOTIFICATIONS_KEY_PREFIX}${userId}`;
            const items = await this.redisService.lrange(key, 0, -1);

            if (!items || items.length === 0) {
                return [];
            }

            const notifications: Notification[] = items
                .map((item) => {
                    try {
                        return JSON.parse(item) as Notification;
                    } catch {
                        return null;
                    }
                })
                .filter((n): n is Notification => n !== null);

            this.logger.info(`Retrieved ${notifications.length} pending notifications for user: ${userId}`);
            return notifications;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to get pending notifications for user: ${userId}`, errorMessage);
            return [];
        }
    }

    async clearPendingNotifications(userId: string): Promise<void> {
        try {
            const key = `${this.PENDING_NOTIFICATIONS_KEY_PREFIX}${userId}`;
            await this.redisService.delete(key);

            this.logger.debug(`Cleared pending notifications for user: ${userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to clear pending notifications for user: ${userId}`, errorMessage);
            throw error;
        }
    }

    async markAsDelivered(notificationId: string): Promise<void> {
        try {
            const key = `${this.NOTIFICATION_KEY_PREFIX}${notificationId}`;
            const data = await this.redisService.get(key);

            if (data) {
                const notification = JSON.parse(data) as Notification;
                notification.status = NotificationStatus.DELIVERED;
                notification.deliveredAt = Date.now();

                await this.redisService.set(key, JSON.stringify(notification), 86400);
                this.logger.debug(`Notification marked as delivered: ${notificationId}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to mark notification as delivered: ${notificationId}`, errorMessage);
            // Non-critical, don't throw
        }
    }

    async markAsRead(notificationId: string): Promise<void> {
        try {
            const key = `${this.NOTIFICATION_KEY_PREFIX}${notificationId}`;
            const data = await this.redisService.get(key);

            if (data) {
                const notification = JSON.parse(data) as Notification;
                notification.status = NotificationStatus.READ;
                notification.readAt = Date.now();

                await this.redisService.set(key, JSON.stringify(notification), 86400);
                this.logger.debug(`Notification marked as read: ${notificationId}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to mark notification as read: ${notificationId}`, errorMessage);
            // Non-critical, don't throw
        }
    }

    async getNotificationHistory(
        userId: string,
        _limit: number = 20,
        _offset: number = 0,
    ): Promise<Notification[]> {
        try {
            // In a production system, this would query a database
            // For now, we can return from Redis cache if available
            this.logger.debug(`Retrieving notification history for user: ${userId}`);
            return [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to get notification history for user: ${userId}`, errorMessage);
            return [];
        }
    }
}
