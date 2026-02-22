import { IsString, IsOptional, IsEnum, IsObject, MinLength, MaxLength, IsArray } from 'class-validator';
import { NotificationType } from '@/shared/types';

/**
 * DTO for sending notification to one or multiple recipients
 * Supports batch operations
 */
export class SendNotificationDto {
    /**
     * Single recipient ID
     */
    @IsOptional()
    @IsString()
    recipientId?: string;

    /**
     * Multiple recipient IDs for batch operations
     */
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recipientIds?: string[];

    /**
     * Notification title
     */
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title!: string;

    /**
     * Notification message
     */
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    message!: string;

    /**
     * Type of notification
     */
    @IsEnum(NotificationType)
    type!: NotificationType;

    /**
     * Optional sender ID
     */
    @IsOptional()
    @IsString()
    senderId?: string;

    /**
     * Additional metadata
     */
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    /**
     * Expiration time in seconds
     */
    @IsOptional()
    expiresIn?: number;
}
