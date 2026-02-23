import { NotificationsGateway } from '../src/notifications/notifications.gateway';
import { NotificationsService } from '../src/notifications/notifications.service';
import { LoggerService } from '../src/shared/logger/logger.service';
import { NotificationStatus } from '../src/shared/types/notification/enum/notification-status.enum';
import { NotificationType } from '../src/shared/types/notification/enum/notification-type.enum';

/**
 * Unit tests for Notifications WebSocket Gateway
 * Note: Tests gateway methods directly without NestJS module system
 * to avoid dependency resolution issues with guards
 */
describe('NotificationsGateway', () => {
    let gateway: NotificationsGateway;
    let service: Partial<NotificationsService>;
    let logger: Partial<LoggerService>;
    let mockServer: any;
    let mockSocket: any;

    beforeEach(() => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn().mockReturnThis(),
        };

        mockSocket = {
            id: 'socket-123',
            data: {
                user: {
                    userId: 'user-123',
                    email: 'user@test.com',
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600,
                },
            },
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            disconnect: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
        };

        // Create mock implementations directly
        service = {
            registerUserSocket: jest.fn().mockResolvedValue(undefined),
            unregisterUserSocket: jest.fn().mockResolvedValue(undefined),
            getPendingNotifications: jest.fn().mockResolvedValue([]),
            clearPendingNotifications: jest.fn().mockResolvedValue(undefined),
            markAsDelivered: jest.fn().mockResolvedValue(undefined),
            markAsRead: jest.fn().mockResolvedValue(undefined),
            getNotificationHistory: jest.fn().mockResolvedValue([]),
        };

        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        // Create gateway instance directly
        gateway = new NotificationsGateway(
            service as NotificationsService,
            logger as LoggerService,
        );
        gateway.server = mockServer;
    });

    describe('afterInit', () => {
        it('should initialize gateway', () => {
            gateway.afterInit();

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('WebSocket Gateway initialized'),
            );
        });

        it('should log initialization message without errors', () => {
            expect(() => gateway.afterInit()).not.toThrow();
            expect(logger.info).toHaveBeenCalled();
        });
    });

    describe('handleConnection', () => {
        it('should handle socket connection', async () => {
            await gateway.handleConnection(mockSocket);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('User connected'),
            );
        });

        it('should register user socket on connection', async () => {
            await gateway.handleConnection(mockSocket);

            expect(service.registerUserSocket).toHaveBeenCalledWith('user-123', 'socket-123');
        });

        it('should emit connected event', async () => {
            await gateway.handleConnection(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith(
                'connected',
                expect.objectContaining({
                    socketId: 'socket-123',
                    userId: 'user-123',
                }),
            );
        });

        it('should handle missing user data gracefully', async () => {
            const invalidSocket = {
                ...mockSocket,
                data: { user: null },
                disconnect: jest.fn(),
            };

            await gateway.handleConnection(invalidSocket);

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid user data'),
            );
            expect(invalidSocket.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should handle socket disconnection', async () => {
            await gateway.handleDisconnect(mockSocket);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('User disconnected'),
            );
        });

        it('should unregister user socket on disconnect', async () => {
            await gateway.handleDisconnect(mockSocket);

            expect(service.unregisterUserSocket).toHaveBeenCalledWith('user-123');
        });

        it('should handle disconnect errors gracefully', async () => {
            (service.unregisterUserSocket as jest.Mock).mockRejectedValue(
                new Error('Unregister failed'),
            );

            await gateway.handleDisconnect(mockSocket);

            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('broadcastToUser', () => {
        it('should broadcast notification to single user', async () => {
            mockServer.to.mockReturnValue(mockServer);

            const notification = {
                id: 'notif-123',
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
                status: NotificationStatus.PENDING,
                createdAt: Date.now(),
            };

            await gateway.broadcastToUser('user-123', notification);

            expect(mockServer.to).toHaveBeenCalledWith('user-123');
            expect(mockServer.emit).toHaveBeenCalled();
        });

        it('should mark notification as delivered', async () => {
            mockServer.to.mockReturnValue(mockServer);

            const notification = {
                id: 'notif-123',
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
                status: NotificationStatus.PENDING,
                createdAt: Date.now(),
            };

            await gateway.broadcastToUser('user-123', notification);

            expect(service.markAsDelivered).toHaveBeenCalledWith('notif-123');
        });
    });

    describe('broadcastToUsers', () => {
        it('should broadcast notification to multiple users', async () => {
            mockServer.to.mockReturnValue(mockServer);

            const notification = {
                id: 'notif-123',
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
                status: NotificationStatus.PENDING,
                createdAt: Date.now(),
            };

            await gateway.broadcastToUsers(['user1', 'user2', 'user3'], notification);

            expect(mockServer.to).toHaveBeenCalledTimes(3);
        });

        it('should handle broadcast errors', async () => {
            (service.markAsDelivered as jest.Mock).mockRejectedValue(
                new Error('Broadcast failed'),
            );
            mockServer.to.mockReturnValue(mockServer);

            const notification = {
                id: 'notif-123',
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.INFO,
                status: NotificationStatus.PENDING,
                createdAt: Date.now(),
            };

            await expect(gateway.broadcastToUsers(['user123'], notification)).rejects.toThrow();

            expect(logger.error).toHaveBeenCalled();
        });

        it('should emit notification event for each user', async () => {
            mockServer.to.mockReturnValue(mockServer);

            const notification = {
                id: 'notif-123',
                recipientId: 'user-123',
                title: 'Test',
                message: 'Test message',
                type: NotificationType.WARNING,
                status: NotificationStatus.PENDING,
                createdAt: Date.now(),
            };

            await gateway.broadcastToUsers(['user1', 'user2'], notification);

            expect(mockServer.emit).toHaveBeenCalled();
        });
    });

    describe('WebSocket Gateway integration', () => {
        it('should have handler methods defined', () => {
            expect(gateway.handleConnection).toBeDefined();
            expect(gateway.handleDisconnect).toBeDefined();
            expect(gateway.broadcastToUser).toBeDefined();
            expect(gateway.broadcastToUsers).toBeDefined();
        });

        it('should have server property', () => {
            expect(gateway.server).toBeDefined();
        });

        it('should initialize afterInit without errors', () => {
            expect(() => gateway.afterInit()).not.toThrow();
        });
    });
});
