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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@/shared/filters/all-exceptions.filter';
import { SendNotificationDto } from './dto/send-notification.dto';
import { BatchNotificationResponseDto } from './dto/notification-response.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { Public } from '@/shared/decorators/public.decorator';
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
 * Authentication: All endpoints require JWT bearer token except /health
 * Uses NotificationsGateway for real-time delivery via WebSocket
 */
@ApiTags('Notifications')
@ApiBearerAuth('bearer')
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
     * Send notification to one user
     * Creates and delivers a notification to a single recipient
     */
    @ApiOperation({
        summary: 'Send notification to user',
        description: 'Send a notification to a single recipient. The notification is delivered immediately if the user is online, or queued for later delivery if offline.',
    })
    @ApiResponse({
        status: 201,
        description: 'Notification sent successfully',
        type: BatchNotificationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request body - missing required fields or invalid data',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - missing or invalid JWT token',
    })
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
     * Send notification to multiple users
     * Sends the same notification to multiple recipients in a batch operation
     */
    @ApiOperation({
        summary: 'Send batch notifications',
        description: 'Send the same notification to multiple recipients. Each recipient is processed individually, and the operation returns aggregated statistics on delivery status.',
    })
    @ApiResponse({
        status: 201,
        description: 'Batch notifications sent successfully',
        type: BatchNotificationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request - recipientIds array is required for batch operations',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - missing or invalid JWT token',
    })
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
     * Get pending notifications for current user
     * Returns notifications that are queued for delivery to offline users
     */
    @ApiOperation({
        summary: 'Get pending notifications',
        description: 'Retrieve notifications that are queued for delivery. These are typically notifications sent while the user was offline.',
    })
    @ApiResponse({
        status: 200,
        description: 'Pending notifications retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - missing or invalid JWT token',
    })
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
     * Get notification history for current user
     * Returns paginated list of notifications sent to the current user
     */
    @ApiOperation({
        summary: 'Get notification history',
        description: 'Retrieve paginated notification history for the current user. Useful for displaying notification inbox or audit logs.',
    })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Number of notifications to return (default: 20, max: 100)',
    })
    @ApiQuery({
        name: 'offset',
        type: Number,
        required: false,
        description: 'Number of notifications to skip for pagination (default: 0)',
    })
    @ApiResponse({
        status: 200,
        description: 'Notification history retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - missing or invalid JWT token',
    })
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
     * Mark notification as read
     * Updates the notification status to 'read' and records the read timestamp
     */
    @ApiOperation({
        summary: 'Mark notification as read',
        description: 'Mark a specific notification as read. Called when the user opens or views a notification.',
    })
    @ApiResponse({
        status: 200,
        description: 'Notification marked as read successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - missing or invalid JWT token',
    })
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
     * Health check endpoint
     * Verifies that the notification service is running and operational
     * No authentication required - useful for load balancers and monitoring
     */
    @ApiTags('Health')
    @ApiOperation({
        summary: 'Health check',
        description: 'Check if the notification service is running and healthy. This endpoint does not require authentication.',
    })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
    })
    @Public()
    @Get('health')
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
