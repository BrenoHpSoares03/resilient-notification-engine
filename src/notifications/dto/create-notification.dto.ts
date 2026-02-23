import { IsString, IsOptional, IsEnum, IsObject, MinLength, MaxLength } from 'class-validator';
import { NotificationType } from '@/shared/types/notification/enum/notification-type.enum';

/**
 * DTO for creating a notification
 * Validates input data and enforces business rules
 */
export class CreateNotificationDto {
    /**
     * ID of the user receiving the notification
     */
    @IsString()
    @MinLength(1)
    recipientId!: string;

    /**
     * Title of the notification
     */
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title!: string;

    /**
     * Notification message body
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
     * Additional data payload (must be serializable)
     */
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;

    /**
     * Time in seconds before notification expires (default: 7 days)
     */
    @IsOptional()
    expiresIn?: number;
}
