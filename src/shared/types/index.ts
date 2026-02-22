/**
 * User authentication payload extracted from JWT token
 */
export interface JwtPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

/**
 * Represents a single user socket connection
 */
export interface UserSocketConnection {
    userId: string;
    socketId: string;
    connectedAt: number;
    isActive: boolean;
}

/**
 * Notification status enumeration
 */
export enum NotificationStatus {
    PENDING = 'PENDING',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED',
}

/**
 * Notification type enumeration
 */
export enum NotificationType {
    SYSTEM = 'SYSTEM',
    USER = 'USER',
    ALERT = 'ALERT',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

/**
 * Represents a notification in the system
 */
export interface Notification {
    id: string;
    recipientId: string;
    senderId?: string;
    title: string;
    message: string;
    type: NotificationType;
    status: NotificationStatus;
    data?: Record<string, any>;
    createdAt: number;
    deliveredAt?: number;
    readAt?: number;
    expiresAt?: number;
}

/**
 * Props for storing notification in Redis queue
 */
export interface NotificationQueueItem {
    id: string;
    recipientId: string;
    payload: Notification;
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: number;
}
