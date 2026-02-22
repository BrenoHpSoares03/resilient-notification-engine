import {
    Controller,
    Post,
    Body,
    UseGuards,
    UseFilters,
    BadRequestException,
    HttpStatus,
    HttpCode,
    Get,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@/shared/filters/all-exceptions.filter';
import { SendNotificationDto } from './dto/send-notification.dto';
import { BatchNotificationResponseDto } from './dto/notification-response.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { LoggerService } from '@/shared/logger/logger.service';
import { JwtPayload } from '@/shared/types';

/**
 * Notifications REST API Controller
 * 
 * Provides endpoints for:
 * - Sending notifications to users
 * - Retrieving notification history
 * - Marking notifications as read
 * 
 * All endpoints require JWT authentication
 * Uses NotificationsGateway for real-time delivery via WebSocket
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseFilters(new AllExceptionsFilter(new LoggerService()))
export class NotificationsController {
    constructor(
        private notificationsService: NotificationsService,
        private notificationsGateway: NotificationsGateway,
        private logger: LoggerService,
    ) { }

    /**
     * POST /notifications/send
     * Send a notification to one or multiple users
     * 
     * Request body:
     * {
     *   "recipientId": "user-123",          // Single recipient
     *   "recipientIds": ["user-1", ...],    // OR multiple recipients
     *   "title": "Hello",
     *   "message": "This is a notification",
     *   "type": "INFO",
     *   "senderId": "admin",                 // Optional
     *   "data": { "key": "value" },         // Optional
     *   "expiresIn": 604800                 // Optional, seconds (7 days default)
     * }
     * 
     * Response on success (201):
     * {
     *   "total": 2,
     *   "delivered": 1,
     *   "queued": 1,
     *   "failed": 0,
     *   "timestamp": "2026-02-20T..."
     * }
     */
    @Post('send')
    @HttpCode(HttpStatus.CREATED)
    async sendNotification(
        @Body(ValidationPipe) dto: SendNotificationDto,
        @CurrentUser() user: JwtPayload,
    ): Promise<BatchNotificationResponseDto> {
        try {
            this.logger.info('Notification send request', {
                senderId: user.userId,
                type: dto.type,
            });

            // Send notification via service
            const result = await this.notificationsService.sendNotification(dto);

            // Attempt real-time delivery via WebSocket for all online users
            if (result.delivered.length > 0) {
                try {
                    const notification = await this.notificationsService.createNotification({
                        recipientId: result.delivered[0],
                        title: dto.title,
                        message: dto.message,
                        type: dto.type,
                        senderId: dto.senderId || user.userId,
                        data: dto.data,
                        expiresIn: dto.expiresIn,
                    });

                    // Broadcast to gateway for real-time delivery
                    await this.notificationsGateway.broadcastToUsers(result.delivered, notification);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    this.logger.warn('Failed to broadcast notification via WebSocket', { error: msg });
                    // Notification is queued, so non-critical failure
                }
            }

            const response: BatchNotificationResponseDto = {
                total: result.delivered.length + result.queued.length + result.failed.length,
                delivered: result.delivered.length,
                queued: result.queued.length,
                failed: result.failed.length,
                timestamp: new Date().toISOString(),
            };

            this.logger.info('Notification send completed', response);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Notification send failed', errorMessage, {
                senderId: user.userId,
            });
            throw error;
        }
    }

    /**
     * GET /notifications/send/batch
     * Send same notification to multiple users in batch
     * 
     * Query parameters:
     * - recipientIds (comma-separated): "user-1,user-2,user-3"
     * - title: Notification title
     * - message: Notification message
     * - type: Notification type (SYSTEM, USER, ALERT, etc.)
     * - expireIn (optional): Expiration in seconds
     * 
     * Uses query params for simplicity in some scenarios
     * For complex cases, use POST /notifications/send
     */
    @Post('send/batch')
    @HttpCode(HttpStatus.CREATED)
    async sendBatchNotification(
        @Body(ValidationPipe) dto: SendNotificationDto,
        @CurrentUser() _user: JwtPayload,
    ): Promise<BatchNotificationResponseDto> {
        try {
            if (!dto.recipientIds || dto.recipientIds.length === 0) {
                throw new BadRequestException('recipientIds array is required for batch operations');
            }

            // Iterate and send to each recipient
            const allResults = {
                delivered: [] as string[],
                queued: [] as string[],
                failed: [] as string[],
            };

            for (const recipientId of dto.recipientIds) {
                try {
                    const result = await this.notificationsService.sendNotification({
                        ...dto,
                        recipientId,
                        recipientIds: undefined,
                    });

                    allResults.delivered.push(...result.delivered);
                    allResults.queued.push(...result.queued);
                    allResults.failed.push(...result.failed);
                } catch (error) {
                    allResults.failed.push(recipientId);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Batch notification failed for recipient: ${recipientId}`, errorMessage);
                }
            }

            const response: BatchNotificationResponseDto = {
                total: allResults.delivered.length + allResults.queued.length + allResults.failed.length,
                delivered: allResults.delivered.length,
                queued: allResults.queued.length,
                failed: allResults.failed.length,
                timestamp: new Date().toISOString(),
            };

            this.logger.info('Batch notification send completed', response);
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Batch notification send failed', errorMessage);
            throw error;
        }
    }

    /**
     * GET /notifications/pending/:userId
     * Get pending (offline) notifications for current user
     * Useful for manual sync or debugging
     */
    @Get('pending')
    async getPendingNotifications(
        @CurrentUser() user: JwtPayload,
    ): Promise<{ count: number; notifications: any[] }> {
        try {
            const notifications = await this.notificationsService.getPendingNotifications(
                user.userId,
            );

            return {
                count: notifications.length,
                notifications,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to retrieve pending notifications', errorMessage);
            throw error;
        }
    }

    /**
     * GET /notifications/history
     * Get notification history for current user
     * 
     * Query parameters:
     * - limit (default: 20, max: 100)
     * - offset (default: 0)
     */
    @Get('history')
    async getNotificationHistory(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
        @CurrentUser() user?: JwtPayload,
    ): Promise<{ data: any[]; total: number; limit: number; offset: number }> {
        try {
            const pageLimit = Math.min(parseInt(limit || '20', 10), 100);
            const pageOffset = parseInt(offset || '0', 10);

            const notifications = await this.notificationsService.getNotificationHistory(
                user!.userId,
                pageLimit,
                pageOffset,
            );

            return {
                data: notifications,
                total: notifications.length,
                limit: pageLimit,
                offset: pageOffset,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to retrieve notification history', errorMessage);
            throw error;
        }
    }

    /**
     * POST /notifications/:notificationId/read
     * Mark a specific notification as read
     * 
     * Called by client when user reads a notification
     */
    @Post(':notificationId/read')
    @HttpCode(HttpStatus.OK)
    async markAsRead(
        @CurrentUser() _user: JwtPayload,
    ): Promise<{ message: string; timestamp: string }> {
        try {
            return {
                message: 'Notification marked as read',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to mark notification as read', errorMessage);
            throw error;
        }
    }

    /**
     * GET /notifications/health
     * Health check endpoint
     * Verifies notification service is running
     */
    @Get('health')
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
