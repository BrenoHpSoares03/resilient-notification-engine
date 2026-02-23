import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationsGateway } from '../src/notifications/notifications.gateway';
import { LoggerService } from '../src/shared/logger/logger.service';
import { SendNotificationDto } from '../src/notifications/dto/send-notification.dto';
import { NotificationType } from '../src/shared/types/notification/enum/notification-type.enum';
import { NotificationStatus } from '../src/shared/types/notification/enum/notification-status.enum';

describe('NotificationsController', () => {
    let controller: NotificationsController;
    let service: NotificationsService;
    let gateway: NotificationsGateway;
    let logger: LoggerService;

    const mockJwtPayload = {
        userId: 'user123',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: {
                        sendNotification: jest.fn(),
                        createNotification: jest.fn(),
                        getPendingNotifications: jest.fn(),
                        getNotificationHistory: jest.fn(),
                        markAsRead: jest.fn(),
                    },
                },
                {
                    provide: NotificationsGateway,
                    useValue: {
                        broadcastToUsers: jest.fn(),
                        notifyUser: jest.fn(),
                    },
                },
                {
                    provide: LoggerService,
                    useValue: {
                        info: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<NotificationsController>(NotificationsController);
        service = module.get<NotificationsService>(NotificationsService);
        gateway = module.get<NotificationsGateway>(NotificationsGateway);
        logger = module.get<LoggerService>(LoggerService);
    });

    describe('POST /notifications/send', () => {
        it('should send notification successfully', async () => {
            const dto: SendNotificationDto = {
                recipientId: 'user123',
                title: 'Test Notification',
                message: 'This is a test notification',
                type: NotificationType.INFO,
                senderId: 'admin',
            };

            jest.spyOn(service, 'sendNotification').mockResolvedValue({
                delivered: ['user123'],
                queued: [],
                failed: [],
            });

            jest.spyOn(service, 'createNotification').mockResolvedValue({
                id: '123e4567-e89b-12d3-a456-426614174000',
                recipientId: 'user123',
                title: 'Test Notification',
                message: 'This is a test notification',
                type: NotificationType.INFO,
                status: NotificationStatus.DELIVERED,
                createdAt: Date.now(),
            });

            jest.spyOn(gateway, 'broadcastToUsers').mockResolvedValue(undefined);

            const result = await controller.sendNotification(dto, mockJwtPayload);

            expect(result.total).toBe(1);
            expect(result.delivered).toBe(1);
            expect(result.queued).toBe(0);
            expect(result.failed).toBe(0);
            expect(service.sendNotification).toHaveBeenCalledWith(dto);
        });

        it('should queue notification when user is offline', async () => {
            const dto: SendNotificationDto = {
                recipientId: 'offline-user',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
            };

            jest.spyOn(service, 'sendNotification').mockResolvedValue({
                delivered: [],
                queued: ['offline-user'],
                failed: [],
            });

            const result = await controller.sendNotification(dto, mockJwtPayload);

            expect(result.total).toBe(1);
            expect(result.delivered).toBe(0);
            expect(result.queued).toBe(1);
            expect(result.failed).toBe(0);
        });

        it('should handle send notification error', async () => {
            const dto: SendNotificationDto = {
                recipientId: 'user123',
                title: 'Test',
                message: 'Test',
                type: NotificationType.INFO,
            };

            jest.spyOn(service, 'sendNotification').mockRejectedValue(
                new Error('Database error'),
            );

            await expect(controller.sendNotification(dto, mockJwtPayload)).rejects.toThrow();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('POST /notifications/send/batch', () => {
        it('should send batch notifications to multiple users', async () => {
            const dto: SendNotificationDto = {
                recipientIds: ['user1', 'user2', 'user3'],
                title: 'Batch Notification',
                message: 'Message to multiple users',
                type: NotificationType.INFO,
            };

            jest.spyOn(service, 'sendNotification')
                .mockResolvedValueOnce({
                    delivered: ['user1'],
                    queued: [],
                    failed: [],
                })
                .mockResolvedValueOnce({
                    delivered: ['user2'],
                    queued: [],
                    failed: [],
                })
                .mockResolvedValueOnce({
                    delivered: [],
                    queued: ['user3'],
                    failed: [],
                });

            const result = await controller.sendBatchNotification(dto, mockJwtPayload);

            expect(result.total).toBe(3);
            expect(result.delivered).toBe(2);
            expect(result.queued).toBe(1);
            expect(result.failed).toBe(0);
            expect(service.sendNotification).toHaveBeenCalledTimes(3);
        });

        it('should fail without recipientIds', async () => {
            const dto: SendNotificationDto = {
                recipientIds: [],
                title: 'Test',
                message: 'Test',
                type: NotificationType.INFO,
            };

            await expect(controller.sendBatchNotification(dto, mockJwtPayload)).rejects.toThrow(
                'recipientIds array is required',
            );
        });
    });

    describe('GET /notifications/pending', () => {
        it('should return pending notifications for user', async () => {
            const mockNotifications = [
                {
                    id: '123',
                    recipientId: 'user123',
                    title: 'Pending',
                    message: 'Test',
                    type: NotificationType.INFO,
                    status: NotificationStatus.PENDING,
                    createdAt: Date.now(),
                },
            ];

            jest.spyOn(service, 'getPendingNotifications').mockResolvedValue(mockNotifications);

            const result = await controller.getPendingNotifications(mockJwtPayload);

            expect(result.count).toBe(1);
            expect(result.notifications).toEqual(mockNotifications);
            expect(service.getPendingNotifications).toHaveBeenCalledWith('user123');
        });

        it('should return empty array when no pending notifications', async () => {
            jest.spyOn(service, 'getPendingNotifications').mockResolvedValue([]);

            const result = await controller.getPendingNotifications(mockJwtPayload);

            expect(result.count).toBe(0);
            expect(result.notifications).toEqual([]);
        });
    });

    describe('GET /notifications/history', () => {
        it('should return notification history with pagination', async () => {
            const mockNotifications = [
                {
                    id: '123',
                    recipientId: 'user123',
                    title: 'Old notification',
                    message: 'Test',
                    type: NotificationType.INFO,
                    status: NotificationStatus.READ,
                    createdAt: Date.now(),
                },
            ];

            jest.spyOn(service, 'getNotificationHistory').mockResolvedValue(mockNotifications);

            const result = await controller.getNotificationHistory('10', '0', mockJwtPayload);

            expect(result.limit).toBe(10);
            expect(result.offset).toBe(0);
            expect(result.data).toEqual(mockNotifications);
            expect(service.getNotificationHistory).toHaveBeenCalledWith('user123', 10, 0);
        });

        it('should cap limit to 100', async () => {
            jest.spyOn(service, 'getNotificationHistory').mockResolvedValue([]);

            await controller.getNotificationHistory('150', '0', mockJwtPayload);

            expect(service.getNotificationHistory).toHaveBeenCalledWith('user123', 100, 0);
        });

        it('should use default values', async () => {
            jest.spyOn(service, 'getNotificationHistory').mockResolvedValue([]);

            await controller.getNotificationHistory(undefined, undefined, mockJwtPayload);

            expect(service.getNotificationHistory).toHaveBeenCalledWith('user123', 20, 0);
        });
    });

    describe('POST /notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const result = await controller.markAsRead(mockJwtPayload);

            expect(result.message).toBe('Notification marked as read');
            expect(result.timestamp).toBeDefined();
        });

        it('should return ISO timestamp format', async () => {
            const result = await controller.markAsRead(mockJwtPayload);

            expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('GET /notifications/health', () => {
        it('should return health status', async () => {
            const result = await controller.healthCheck();

            expect(result.status).toBe('ok');
            expect(result.timestamp).toBeDefined();
        });

        it('should return valid ISO timestamp', async () => {
            const result = await controller.healthCheck();

            expect(() => new Date(result.timestamp)).not.toThrow();
            expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        });
    });
});
