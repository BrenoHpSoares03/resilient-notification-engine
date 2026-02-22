import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * E2E tests for Notification Engine
 * 
 * Test scenarios:
 * 1. Send notification to online user
 * 2. Send notification to offline user (queued)
 * 3. Catch-up delivery on reconnection
 * 4. Error handling
 */
describe('NotificationEngine (e2e)', () => {
    let app: INestApplication;
    let jwtToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Mock JWT token for testing
        jwtToken = 'Bearer test-token-123';
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Health Check', () => {
        it('should return health status', () => {
            return request(app.getHttpServer())
                .get('/notifications/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('status', 'ok');
                    expect(res.body).toHaveProperty('timestamp');
                });
        });
    });

    describe('Send Notification', () => {
        it('should send notification to single user', () => {
            return request(app.getHttpServer())
                .post('/notifications/send')
                .set('Authorization', jwtToken)
                .send({
                    recipientId: 'user-123',
                    title: 'Test Notification',
                    message: 'This is a test',
                    type: 'INFO',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('delivered');
                    expect(res.body).toHaveProperty('queued');
                    expect(res.body).toHaveProperty('failed');
                });
        });

        it('should validate required fields', () => {
            return request(app.getHttpServer())
                .post('/notifications/send')
                .set('Authorization', jwtToken)
                .send({
                    // Missing required fields
                    recipientId: 'user-123',
                })
                .expect(400);
        });

        it('should reject request without JWT', () => {
            return request(app.getHttpServer())
                .post('/notifications/send')
                .send({
                    recipientId: 'user-123',
                    title: 'Test',
                    message: 'Test',
                    type: 'INFO',
                })
                .expect(401);
        });
    });

    describe('Batch Send', () => {
        it('should send notifications to multiple users', () => {
            return request(app.getHttpServer())
                .post('/notifications/send/batch')
                .set('Authorization', jwtToken)
                .send({
                    recipientIds: ['user-1', 'user-2', 'user-3'],
                    title: 'Batch Notification',
                    message: 'Sent to multiple users',
                    type: 'SYSTEM',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.total).toBe(3);
                });
        });
    });

    describe('Get Pending Notifications', () => {
        it('should return pending notifications for user', () => {
            return request(app.getHttpServer())
                .get('/notifications/pending')
                .set('Authorization', jwtToken)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('count');
                    expect(res.body).toHaveProperty('notifications');
                    expect(Array.isArray(res.body.notifications)).toBe(true);
                });
        });
    });

    describe('Get History', () => {
        it('should return notification history with pagination', () => {
            return request(app.getHttpServer())
                .get('/notifications/history?limit=10&offset=0')
                .set('Authorization', jwtToken)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('data');
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('limit');
                    expect(res.body).toHaveProperty('offset');
                });
        });

        it('should enforce maximum limit', () => {
            return request(app.getHttpServer())
                .get('/notifications/history?limit=500')
                .set('Authorization', jwtToken)
                .expect(200)
                .expect((res) => {
                    expect(res.body.limit).toBeLessThanOrEqual(100);
                });
        });
    });
});
