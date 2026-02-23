import { IsString, IsOptional, IsEnum, IsObject, MinLength, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@/shared/types';

/**
 * DTO for sending notification to one or multiple recipients
 * Supports batch operations
 */
export class SendNotificationDto {
    /**
     * Single recipient ID
     */
    @ApiPropertyOptional({
        type: String,
        description: 'Single recipient ID',
        example: 'user123',
    })
    @IsOptional()
    @IsString()
    recipientId?: string;

    /**
     * Multiple recipient IDs for batch operations
     */
    @ApiPropertyOptional({
        type: [String],
        description: 'Multiple recipient IDs for batch operations',
        example: ['user1', 'user2', 'user3'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recipientIds?: string[];

    /**
     * Notification title
     */
    @ApiProperty({
        type: String,
        minLength: 1,
        maxLength: 200,
        description: 'Notification title',
        example: 'Order Confirmation',
    })
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title!: string;

    /**
     * Notification message
     */
    @ApiProperty({
        type: String,
        minLength: 1,
        maxLength: 1000,
        description: 'Notification message content',
        example: 'Your order #12345 has been confirmed. Estimated delivery: 3-5 business days.',
    })
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    message!: string;

    /**
     * Type of notification
     */
    @ApiProperty({
        enum: NotificationType,
        description: 'Type of notification (in-app, email, sms, push)',
        example: 'in-app',
    })
    @IsEnum(NotificationType)
    type!: NotificationType;

    /**
     * Optional sender ID
     */
    @ApiPropertyOptional({
        type: String,
        description: 'Optional sender ID',
        example: 'admin-system',
    })
    @IsOptional()
    @IsString()
    senderId?: string;

    /**
     * Additional metadata
     */
    @ApiPropertyOptional({
        type: Object,
        description: 'Additional metadata as key-value pairs',
        example: { orderId: '12345', amount: 99.99, currency: 'USD' },
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    /**
     * Expiration time in seconds
     */
    @ApiPropertyOptional({
        type: Number,
        description: 'Expiration time in seconds (default: 604800 = 7 days)',
        example: 604800,
    })
    @IsOptional()
    expiresIn?: number;
}
