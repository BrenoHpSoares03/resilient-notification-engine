import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../src/config/redis.service';
import { LoggerService } from '../src/shared/logger/logger.service';

/**
 * Unit tests for Redis Service
 */
describe('RedisService', () => {
    let service: RedisService;
    let logger: LoggerService;
    let mockRedisClient: any;

    beforeEach(async () => {
        // Mock Redis client
        mockRedisClient = {
            set: jest.fn().mockResolvedValue('OK'),
            setex: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue('test-value'),
            del: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
            ttl: jest.fn().mockResolvedValue(3600),
            lpush: jest.fn().mockResolvedValue(1),
            rpop: jest.fn().mockResolvedValue('item'),
            lrange: jest.fn().mockResolvedValue(['item1', 'item2']),
            hset: jest.fn().mockResolvedValue(1),
            hget: jest.fn().mockResolvedValue('hash-value'),
            hgetall: jest.fn().mockResolvedValue({ field: 'value' }),
            hdel: jest.fn().mockResolvedValue(1),
            quit: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: 'REDIS_CLIENT',
                    useValue: mockRedisClient,
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
                RedisService,
            ],
        }).compile();

        service = module.get<RedisService>(RedisService);
        logger = module.get<LoggerService>(LoggerService);
        (service as any).client = mockRedisClient;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('set', () => {
        it('should set a key-value pair in Redis', async () => {
            const result = await service.set('test-key', 'test-value');

            expect(result).toBeUndefined();
            expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
        });

        it('should set with expiration time using setex', async () => {
            mockRedisClient.setex.mockResolvedValue('OK');

            await service.set('test-key', 'test-value', 3600);

            expect(mockRedisClient.setex).toHaveBeenCalledWith('test-key', 3600, 'test-value');
        });

        it('should handle set error', async () => {
            mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

            await expect(service.set('key', 'value')).rejects.toThrow();
        });
    });

    describe('get', () => {
        it('should get a value from Redis', async () => {
            const result = await service.get('test-key');

            expect(result).toBe('test-value');
            expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null for non-existent key', async () => {
            mockRedisClient.get.mockResolvedValueOnce(null);

            const result = await service.get('non-existent');

            expect(result).toBe(null);
        });

        it('should handle get error', async () => {
            mockRedisClient.get.mockRejectedValue(new Error('Connection lost'));

            await expect(service.get('key')).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('should delete a key from Redis', async () => {
            const result = await service.delete('test-key');

            expect(result).toBe(1);
            expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
        });

        it('should return 0 for non-existent key', async () => {
            mockRedisClient.del.mockResolvedValueOnce(0);

            const result = await service.delete('non-existent');

            expect(result).toBe(0);
        });
    });

    describe('hset', () => {
        it('should set hash field', async () => {
            const result = await service.hset('hash-key', 'field', 'value');

            expect(result).toBe(1);
            expect(mockRedisClient.hset).toHaveBeenCalledWith('hash-key', 'field', 'value');
        });

        it('should handle hset error', async () => {
            mockRedisClient.hset.mockRejectedValue(new Error('Redis error'));

            await expect(service.hset('key', 'field', 'value')).rejects.toThrow();
        });
    });

    describe('hget', () => {
        it('should get hash field', async () => {
            const result = await service.hget('hash-key', 'field');

            expect(result).toBe('hash-value');
            expect(mockRedisClient.hget).toHaveBeenCalledWith('hash-key', 'field');
        });

        it('should return null for non-existent field', async () => {
            mockRedisClient.hget.mockResolvedValueOnce(null);

            const result = await service.hget('hash-key', 'non-existent');

            expect(result).toBe(null);
        });
    });

    describe('hgetall', () => {
        it('should get all hash fields', async () => {
            const result = await service.hgetall('hash-key');

            expect(result).toEqual({ field: 'value' });
            expect(mockRedisClient.hgetall).toHaveBeenCalledWith('hash-key');
        });

        it('should return empty object for non-existent hash', async () => {
            mockRedisClient.hgetall.mockResolvedValueOnce({});

            const result = await service.hgetall('non-existent');

            expect(result).toEqual({});
        });
    });

    describe('hdel', () => {
        it('should delete hash field', async () => {
            const result = await service.hdel('hash-key', 'field');

            expect(result).toBe(1);
            expect(mockRedisClient.hdel).toHaveBeenCalledWith('hash-key', 'field');
        });

        it('should handle hdel error', async () => {
            mockRedisClient.hdel.mockRejectedValue(new Error('Redis error'));

            await expect(service.hdel('key', 'field')).rejects.toThrow();
        });
    });

    describe('lpush', () => {
        it('should push item to list', async () => {
            const result = await service.lpush('list-key', 'item');

            expect(result).toBe(1);
            expect(mockRedisClient.lpush).toHaveBeenCalledWith('list-key', 'item');
        });
    });

    describe('rpop', () => {
        it('should pop item from list', async () => {
            const result = await service.rpop('list-key');

            expect(result).toBe('item');
            expect(mockRedisClient.rpop).toHaveBeenCalledWith('list-key');
        });

        it('should return null for empty list', async () => {
            mockRedisClient.rpop.mockResolvedValueOnce(null);

            const result = await service.rpop('empty-list');

            expect(result).toBe(null);
        });
    });

    describe('lrange', () => {
        it('should get list range', async () => {
            const result = await service.lrange('list-key', 0, -1);

            expect(result).toEqual(['item1', 'item2']);
            expect(mockRedisClient.lrange).toHaveBeenCalledWith('list-key', 0, -1);
        });

        it('should return empty array for non-existent list', async () => {
            mockRedisClient.lrange.mockResolvedValueOnce([]);

            const result = await service.lrange('non-existent', 0, -1);

            expect(result).toEqual([]);
        });
    });

    describe('close', () => {
        it('should close Redis connection', async () => {
            mockRedisClient.quit = jest.fn().mockResolvedValue(undefined);
            (service as any).subscriberClient = {
                quit: jest.fn().mockResolvedValue(undefined),
            };

            await service.close();

            expect(mockRedisClient.quit).toHaveBeenCalled();
        });

        it('should handle close error gracefully without throwing', async () => {
            mockRedisClient.quit.mockRejectedValue(new Error('Close error'));
            (service as any).subscriberClient = {
                quit: jest.fn().mockRejectedValue(new Error('Close error')),
            };

            // Should not throw even if quit fails
            await expect(service.close()).resolves.not.toThrow();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should log errors with proper context', async () => {
            mockRedisClient.set.mockRejectedValue(new Error('Test error'));

            try {
                await service.set('key', 'value');
            } catch {
                // Error expected
            }

            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle non-Error objects as strings', async () => {
            mockRedisClient.get.mockRejectedValue('String error');

            try {
                await service.get('key');
            } catch {
                // Error expected
            }

            expect(logger.error).toHaveBeenCalled();
        });
    });
});
