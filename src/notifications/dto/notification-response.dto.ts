import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for notification response in API endpoints
 * Represents a notification visible to clients
 */
export class NotificationResponseDto {
    /**
     * Unique notification identifier
     */
    @ApiProperty({
        type: String,
        description: 'Unique notification identifier (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id!: string;

    /**
     * Recipient user ID
     */
    @ApiProperty({
        type: String,
        description: 'Recipient user ID',
        example: 'user123',
    })
    recipientId!: string;

    /**
     * Sender user ID (optional)
     */
    @ApiPropertyOptional({
        type: String,
        description: 'Sender user ID (optional)',
        example: 'admin-system',
    })
    senderId?: string;

    /**
     * Notification title
     */
    @ApiProperty({
        type: String,
        description: 'Notification title',
        example: 'Order Confirmation',
    })
    title!: string;

    /**
     * Notification message body
     */
    @ApiProperty({
        type: String,
        description: 'Notification message content',
        example: 'Your order has been confirmed and will be delivered soon.',
    })
    message!: string;

    /**
     * Type of notification
     */
    @ApiProperty({
        type: String,
        enum: ['in-app', 'email', 'sms', 'push'],
        description: 'Type of notification',
        example: 'in-app',
    })
    type!: string;

    /**
     * Current status
     */
    @ApiProperty({
        type: String,
        enum: ['pending', 'delivered', 'read', 'failed'],
        description: 'Current notification status',
        example: 'delivered',
    })
    status!: string;

    /**
     * Additional data
     */
    @ApiPropertyOptional({
        type: Object,
        description: 'Additional metadata',
        example: { orderId: '12345', amount: 99.99 },
    })
    data?: Record<string, any>;

    /**
     * Creation timestamp (ISO 8601)
     */
    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'When the notification was created (ISO 8601)',
        example: '2026-02-22T10:30:00.000Z',
    })
    createdAt!: string;

    /**
     * Delivery timestamp (ISO 8601)
     */
    @ApiPropertyOptional({
        type: String,
        format: 'date-time',
        description: 'When the notification was delivered (ISO 8601)',
        example: '2026-02-22T10:31:00.000Z',
    })
    deliveredAt?: string;

    /**
     * Read timestamp (ISO 8601)
     */
    @ApiPropertyOptional({
        type: String,
        format: 'date-time',
        description: 'When the notification was read (ISO 8601)',
        example: '2026-02-22T10:32:00.000Z',
    })
    readAt?: string;
}

/**
 * DTO for batch response
 */
export class BatchNotificationResponseDto {
    /**
     * Total notifications sent/queued
     */
    @ApiProperty({
        type: Number,
        description: 'Total notifications sent/queued',
        example: 3,
    })
    total!: number;

    /**
     * Successfully delivered count
     */
    @ApiProperty({
        type: Number,
        description: 'Number of notifications successfully delivered',
        example: 1,
    })
    delivered!: number;

    /**
     * Queued for later delivery
     */
    @ApiProperty({
        type: Number,
        description: 'Number of notifications queued for later delivery',
        example: 2,
    })
    queued!: number;

    /**
     * Failed count
     */
    @ApiProperty({
        type: Number,
        description: 'Number of notifications that failed',
        example: 0,
    })
    failed!: number;

    /**
     * Operation timestamp
     */
    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'When the operation was performed (ISO 8601)',
        example: '2026-02-22T10:30:00.000Z',
    })
    timestamp!: string;
}
