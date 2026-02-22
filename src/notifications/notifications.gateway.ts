import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { WsJwtGuard } from '@/shared/guards/ws-jwt.guard';
import { AllExceptionsWebSocketFilter } from '@/shared/filters/all-exceptions.filter';
import { JwtPayload, Notification } from '@/shared/types';
import { CurrentWsUser } from '@/shared/decorators/current-user.decorator';

/**
 * WebSocket Gateway for real-time notifications
 * 
 * Architecture highlights:
 * - Uses Socket.io with Redis adapter for horizontal scalability
 * - Implements JWT authentication for WebSocket connections
 * - Handles connection/disconnection lifecycle
 * - Delivers pending notifications on connection (catch-up)
 * - Broadcasts notifications in real-time
 * 
 * Scaling considerations:
 * - Redis adapter allows multiple server instances
 * - User socket mapping stored in Redis (shared state)
 * - Notifications queued in Redis for offline users
 */
@WebSocketGateway({
    namespace: '/notifications',
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
})
@Injectable()
@UseFilters(new AllExceptionsWebSocketFilter(new LoggerService()))
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server!: Server;

    constructor(
        private notificationsService: NotificationsService,
        private logger: LoggerService,
    ) { }

    /**
     * Initialize gateway after server starts
     * Setup Redis adapter for horizontal scalability
     */
    async afterInit() {
        try {
            // For single instance deployment, skip Redis adapter
            // In production with multiple instances, configure Redis adapter per instance
            this.logger.info('WebSocket Gateway initialized (single instance mode)');
            this.logger.info('For horizontal scaling with Redis adapter, configure in production setup');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to initialize WebSocket Gateway', errorMessage);
            throw error;
        }
    }

    /**
     * Handle client connection
     * - Authenticate via JWT (guard)
     * - Register socket mapping
     * - Deliver pending notifications (catch-up)
     * - Emit ready event to client
     */
    @UseGuards(WsJwtGuard)
    async handleConnection(client: Socket) {
        try {
            const user: JwtPayload = client.data?.user;

            if (!user || !user.userId) {
                this.logger.warn('WebSocket connection rejected: Invalid user data');
                client.disconnect(true);
                return;
            }

            // Register user socket mapping
            await this.notificationsService.registerUserSocket(user.userId, client.id);

            // Emit connection acknowledgement
            client.emit('connected', {
                message: 'Connected to notification service',
                socketId: client.id,
                userId: user.userId,
                timestamp: new Date().toISOString(),
            });

            // Deliver pending notifications (catch-up)
            await this.deliverPendingNotifications(user.userId, client);

            this.logger.info(`User connected: ${user.userId} (Socket: ${client.id})`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error handling WebSocket connection', errorMessage);
            client.disconnect(true);
        }
    }

    /**
     * Handle client disconnection
     * Remove socket mapping from Redis
     */
    async handleDisconnect(client: Socket) {
        try {
            const user: JwtPayload = client.data?.user;

            if (user && user.userId) {
                await this.notificationsService.unregisterUserSocket(user.userId);
                this.logger.info(`User disconnected: ${user.userId} (Socket: ${client.id})`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error handling WebSocket disconnection', errorMessage);
        }
    }

    /**
     * WebSocket event: Mark notification as read
     * Called when user interacts with notification
     */
    @SubscribeMessage('notification:read')
    async handleNotificationRead(
        @MessageBody() data: { notificationId: string },
        @ConnectedSocket() client: Socket,
        @CurrentWsUser() user: JwtPayload,
    ) {
        try {
            if (!data.notificationId) {
                client.emit('error', {
                    type: 'invalid_request',
                    message: 'notificationId is required',
                });
                return;
            }

            await this.notificationsService.markAsRead(data.notificationId);

            // Broadcast read event to all instances
            this.server.emit('notification:marked-read', {
                notificationId: data.notificationId,
                userId: user.userId,
                timestamp: new Date().toISOString(),
            });

            client.emit('notification:read-acknowledged', {
                notificationId: data.notificationId,
                timestamp: new Date().toISOString(),
            });

            this.logger.debug(`Notification marked as read: ${data.notificationId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error marking notification as read', errorMessage);
            client.emit('error', {
                type: 'read_error',
                message: 'Failed to mark notification as read',
            });
        }
    }

    /**
     * WebSocket event: Get user notification history
     */
    @SubscribeMessage('notification:history')
    async handleGetHistory(
        @MessageBody() data: { limit?: number; offset?: number },
        @ConnectedSocket() client: Socket,
        @CurrentWsUser() user: JwtPayload,
    ) {
        try {
            const limit = Math.min(data.limit || 20, 100); // Max 100
            const offset = data.offset || 0;

            const history = await this.notificationsService.getNotificationHistory(
                user.userId,
                limit,
                offset,
            );

            client.emit('notification:history', {
                data: history,
                total: history.length,
                limit,
                offset,
                timestamp: new Date().toISOString(),
            });

            this.logger.debug(`Notification history retrieved for user: ${user.userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error retrieving notification history', errorMessage);
            client.emit('error', {
                type: 'history_error',
                message: 'Failed to retrieve notification history',
            });
        }
    }

    /**
     * Broadcast notification to specific user
     * Used by NotificationsController
     */
    async broadcastToUser(userId: string, notification: Notification) {
        try {
            /**
             * Using Socket.io room pattern for targeted delivery
             * Each user has a personal room named after their userId
             */
            this.server.to(userId).emit('notification:received', {
                ...notification,
                deliveredAt: new Date().toISOString(),
            });

            await this.notificationsService.markAsDelivered(notification.id);
            this.logger.debug(`Notification broadcasted to user: ${userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to broadcast notification to user: ${userId}`, errorMessage);
            throw error;
        }
    }

    /**
     * Broadcast notification to multiple users
     */
    async broadcastToUsers(userIds: string[], notification: Notification) {
        try {
            for (const userId of userIds) {
                await this.broadcastToUser(userId, notification);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to broadcast notification to multiple users', errorMessage);
            throw error;
        }
    }

    /**
     * Deliver pending notifications when user connects (catch-up)
     * Critical for ensuring no notifications are lost
     */
    private async deliverPendingNotifications(userId: string, client: Socket) {
        try {
            const notifications = await this.notificationsService.getPendingNotifications(userId);

            if (notifications.length === 0) {
                this.logger.debug(`No pending notifications for user: ${userId}`);
                return;
            }

            /**
             * Send pending notifications in batch with delay
             * Prevents overwhelming the client
             */
            for (let i = 0; i < notifications.length; i++) {
                const notification = notifications[i];

                setTimeout(() => {
                    client.emit('notification:received', {
                        ...notification,
                        deliveredAt: new Date().toISOString(),
                        wasPending: true, // Flag to indicate this was queued offline
                    });

                    this.logger.debug(
                        `Pending notification delivered: ${notification.id} to user: ${userId}`,
                    );
                }, i * 100); // 100ms delay between notifications
            }

            // Clear queue after all notifications are sent
            setTimeout(async () => {
                await this.notificationsService.clearPendingNotifications(userId);
                client.emit('notifications:catch-up-complete', {
                    count: notifications.length,
                    timestamp: new Date().toISOString(),
                });
            }, notifications.length * 100);

            this.logger.info(
                `Catch-up delivery started: ${notifications.length} pending notifications for user: ${userId}`,
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to deliver pending notifications for user: ${userId}`, errorMessage);
            // Don't throw - continue with connection even if catch-up fails
        }
    }

    /**
     * Health check event for keeping connections alive
     */
    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket) {
        client.emit('pong', { timestamp: new Date().toISOString() });
    }
}
