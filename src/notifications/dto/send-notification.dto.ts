import { IsString, IsOptional, IsEnum, IsObject, MinLength, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@/shared/types/notification/enum/notification-type.enum';

export class SendNotificationDto {
    @ApiPropertyOptional({
        type: String,
        description: 'Single recipient ID',
        example: 'user123',
    })
    @IsOptional()
    @IsString()
    recipientId?: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'Multiple recipient IDs for batch operations',
        example: ['user1', 'user2', 'user3'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recipientIds?: string[];

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

    @ApiProperty({
        enum: NotificationType,
        description: 'Type of notification (in-app, email, sms, push)',
        example: 'in-app',
    })
    @IsEnum(NotificationType)
    type!: NotificationType;

    @ApiPropertyOptional({
        type: String,
        description: 'Optional sender ID',
        example: 'admin-system',
    })
    @IsOptional()
    @IsString()
    senderId?: string;

    @ApiPropertyOptional({
        type: Object,
        description: 'Additional metadata as key-value pairs',
        example: { orderId: '12345', amount: 99.99, currency: 'USD' },
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    @ApiPropertyOptional({
        type: Number,
        description: 'Expiration time in seconds (default: 604800 = 7 days)',
        example: 604800,
    })
    @IsOptional()
    expiresIn?: number;
}
