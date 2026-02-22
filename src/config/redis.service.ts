import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '@/shared/logger/logger.service';

/**
 * Redis configuration and connection management
 * Handles connection pooling and error handling
 */
@Injectable()
export class RedisService {
    private client!: Redis;
    private subscriberClient!: Redis;

    constructor(private logger: LoggerService) {
        this.initializeClients();
    }

    /**
     * Initialize Redis clients with error handling
     */
    private initializeClients() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redisOptions = {
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
            enableOfflineQueue: true,
        };

        try {
            this.client = new Redis(redisUrl, redisOptions);
            this.subscriberClient = new Redis(redisUrl, redisOptions);

            this.client.on('error', (error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error('Redis client error', errorMessage);
            });

            this.client.on('connect', () => {
                this.logger.info('Redis client connected');
            });

            this.subscriberClient.on('error', (error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error('Redis subscriber error', errorMessage);
            });

            this.subscriberClient.on('connect', () => {
                this.logger.info('Redis subscriber connected');
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to initialize Redis clients', errorMessage);
            throw error;
        }
    }

    /**
     * Get the main Redis client
     */
    getClient(): Redis {
        return this.client;
    }

    /**
     * Get the subscriber Redis client
     */
    getSubscriber(): Redis {
        return this.subscriberClient;
    }

    /**
     * Set key-value pair with optional expiration
     */
    async set(key: string, value: string, expiresIn?: number): Promise<void> {
        try {
            if (expiresIn) {
                await this.client.setex(key, expiresIn, value);
            } else {
                await this.client.set(key, value);
            }
            this.logger.debug(`Redis SET: ${key}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis SET failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Get value by key
     */
    async get(key: string): Promise<string | null> {
        try {
            const value = await this.client.get(key);
            this.logger.debug(`Redis GET: ${key}`);
            return value;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis GET failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Delete one or multiple keys
     */
    async delete(...keys: string[]): Promise<number> {
        try {
            const count = await this.client.del(...keys);
            this.logger.debug(`Redis DEL: ${keys.join(', ')}`);
            return count;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis DEL failed for keys: ${keys.join(', ')}`, errorMessage);
            throw error;
        }
    }

    /**
     * Push value to list
     */
    async lpush(key: string, value: string): Promise<number> {
        try {
            const length = await this.client.lpush(key, value);
            this.logger.debug(`Redis LPUSH: ${key}`);
            return length;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis LPUSH failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Pop value from list
     */
    async rpop(key: string): Promise<string | null> {
        try {
            const value = await this.client.rpop(key);
            this.logger.debug(`Redis RPOP: ${key}`);
            return value;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis RPOP failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Get range of list
     */
    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        try {
            const values = await this.client.lrange(key, start, stop);
            this.logger.debug(`Redis LRANGE: ${key}`);
            return values;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis LRANGE failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Set hash field
     */
    async hset(key: string, field: string, value: string): Promise<number> {
        try {
            const result = await this.client.hset(key, field, value);
            this.logger.debug(`Redis HSET: ${key}:${field}`);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis HSET failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Get hash field
     */
    async hget(key: string, field: string): Promise<string | null> {
        try {
            const value = await this.client.hget(key, field);
            this.logger.debug(`Redis HGET: ${key}:${field}`);
            return value;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis HGET failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Get all hash fields
     */
    async hgetall(key: string): Promise<Record<string, string>> {
        try {
            const value = await this.client.hgetall(key);
            this.logger.debug(`Redis HGETALL: ${key}`);
            return value || {};
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis HGETALL failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Delete hash field
     */
    async hdel(key: string, field: string): Promise<number> {
        try {
            const result = await this.client.hdel(key, field);
            this.logger.debug(`Redis HDEL: ${key}:${field}`);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis HDEL failed for key: ${key}`, errorMessage);
            throw error;
        }
    }

    /**
     * Close Redis connections gracefully
     */
    async close(): Promise<void> {
        try {
            await this.client.quit();
            await this.subscriberClient.quit();
            this.logger.info('Redis connections closed');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error closing Redis connections', errorMessage);
        }
    }
}
