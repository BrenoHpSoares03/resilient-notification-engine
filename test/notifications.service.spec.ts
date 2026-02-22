import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RedisService } from '../src/config/redis.service';
import { LoggerService } from '../src/shared/logger/logger.service';
import { NotificationType } from '../src/shared/types';

/**
 * Unit tests for NotificationsService
 */
describe('NotificationsService', () => {
    let service: NotificationsService;
    let redisService: RedisService;
    let logger: LoggerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: RedisService,
                    useValue: {
                        set: jest.fn(),
                        get: jest.fn(),
                        delete: jest.fn(),
                        lpush: jest.fn(),
                        rpop: jest.fn(),
                        lrange: jest.fn(),
                        hset: jest.fn(),
                        hget: jest.fn(),
                        getClient: jest.fn().mockReturnValue({
                            expire: jest.fn().mockResolvedValue(1),
                        }),
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

        service = module.get<NotificationsService>(NotificationsService);
        redisService = module.get<RedisService>(RedisService);
        logger = module.get<LoggerService>(LoggerService);
    });

    describe('createNotification', () => {
        it('should create a notification with valid data', async () => {
            const dto = {
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
            };

            const notification = await service.createNotification(dto);

            expect(notification).toBeDefined();
            expect(notification.id).toBeDefined();
            expect(notification.recipientId).toBe('user-123');
            expect(notification.title).toBe('Test');
            expect(notification.status).toBe('PENDING');
        });

        it('should set expiration time if provided', async () => {
            const dto = {
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
                expiresIn: 3600, // 1 hour
            };

            const notification = await service.createNotification(dto);

            expect(notification.expiresAt).toBeDefined();
            expect(notification.expiresAt! > Date.now()).toBe(true);
        });
    });

    describe('registerUserSocket', () => {
        it('should register user socket connection', async () => {
            const userId = 'user-123';
            const socketId = 'socket-456';

            await service.registerUserSocket(userId, socketId);

            expect(redisService.set).toHaveBeenCalled();
        });
    });

    describe('getUserSocketId', () => {
        it('should return socket ID if user is online', async () => {
            const userId = 'user-123';
            const socketId = 'socket-456';
            const connection = { userId, socketId, isActive: true };

            (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(connection));

            const result = await service.getUserSocketId(userId);

            expect(result).toBe(socketId);
        });

        it('should return null if user is offline', async () => {
            (redisService.get as jest.Mock).mockResolvedValue(null);

            const result = await service.getUserSocketId('offline-user');

            expect(result).toBeNull();
        });
    });

    describe('getPendingNotifications', () => {
        it('should retrieve pending notifications for user', async () => {
            const userId = 'user-123';
            const notifications = [
                {
                    id: 'notif-1',
                    recipientId: userId,
                    title: 'Test',
                    message: 'Test',
                    type: 'INFO',
                    status: 'PENDING',
                    createdAt: Date.now(),
                },
            ];

            (redisService.lrange as jest.Mock).mockResolvedValue([
                JSON.stringify(notifications[0]),
            ]);

            const result = await service.getPendingNotifications(userId);

            expect(result).toEqual(notifications);
            expect(redisService.lrange).toHaveBeenCalled();
        });

        it('should return empty array if no pending notifications', async () => {
            (redisService.lrange as jest.Mock).mockResolvedValue([]);

            const result = await service.getPendingNotifications('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('sendNotification', () => {
        it('should fail if no recipient specified', async () => {
            const dto = {
                title: 'Test',
                message: 'Test',
                type: NotificationType.INFO,
            };

            await expect(service.sendNotification(dto as any)).rejects.toThrow();
        });

        it('should mark online user as delivered', async () => {
            const dto = {
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test',
                type: NotificationType.INFO,
            };

            (redisService.get as jest.Mock).mockResolvedValue(
                JSON.stringify({ socketId: 'socket-456', isActive: true }),
            );

            const result = await service.sendNotification(dto);

            expect(result.delivered).toContain('user-123');
            expect(result.queued.length).toBe(0);
        });

        it('should queue offline user notification', async () => {
            const dto = {
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test',
                type: NotificationType.INFO,
            };

            (redisService.get as jest.Mock).mockResolvedValue(null);

            const result = await service.sendNotification(dto);

            expect(result.queued).toContain('user-123');
            expect(redisService.lpush).toHaveBeenCalled();
        });
    });
});
