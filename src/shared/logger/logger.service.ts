import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Centralized logging service using Winston
 * Provides structured logging with multiple transports
 */
@Injectable()
export class LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json(),
            ),
            defaultMeta: { service: 'notification-engine' },
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ],
        });

        // Add console transport in development
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...meta }) => {
                            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                        }),
                    ),
                }),
            );
        }
    }

    /**
     * Log information level message
     */
    info(message: string, meta?: Record<string, any>) {
        this.logger.info(message, meta);
    }

    /**
     * Log error level message
     */
    error(message: string, error?: Error | string, meta?: Record<string, any>) {
        this.logger.error(message, { error, ...meta });
    }

    /**
     * Log warning level message
     */
    warn(message: string, meta?: Record<string, any>) {
        this.logger.warn(message, meta);
    }

    /**
     * Log debug level message
     */
    debug(message: string, meta?: Record<string, any>) {
        this.logger.debug(message, meta);
    }
}
