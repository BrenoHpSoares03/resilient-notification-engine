import { Notification } from './notification.interface';

export interface NotificationQueueItem {
    id: string;
    recipientId: string;
    payload: Notification;
    attemptCount: number;
    maxAttempts: number;
    nextRetryAt: number;
}
