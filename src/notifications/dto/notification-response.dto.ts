/**
 * DTO for notification response in API endpoints
 * Represents a notification visible to clients
 */
export class NotificationResponseDto {
    /**
     * Unique notification identifier
     */
    id!: string;

    /**
     * Recipient user ID
     */
    recipientId!: string;

    /**
     * Sender user ID (optional)
     */
    senderId?: string;

    /**
     * Notification title
     */
    title!: string;

    /**
     * Notification message body
     */
    message!: string;

    /**
     * Type of notification
     */
    type!: string;

    /**
     * Current status
     */
    status!: string;

    /**
     * Additional data
     */
    data?: Record<string, any>;

    /**
     * Creation timestamp (ISO 8601)
     */
    createdAt!: string;

    /**
     * Delivery timestamp (ISO 8601)
     */
    deliveredAt?: string;

    /**
     * Read timestamp (ISO 8601)
     */
    readAt?: string;
}

/**
 * DTO for batch response
 */
export class BatchNotificationResponseDto {
    /**
     * Total notifications sent/queued
     */
    total!: number;

    /**
     * Successfully delivered count
     */
    delivered!: number;

    /**
     * Queued for later delivery
     */
    queued!: number;

    /**
     * Failed count
     */
    failed!: number;

    /**
     * Operation timestamp
     */
    timestamp!: string;
}
