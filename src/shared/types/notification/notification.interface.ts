import { NotificationStatus } from './enum/notification-status.enum';
import { NotificationType } from './enum/notification-type.enum';

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
