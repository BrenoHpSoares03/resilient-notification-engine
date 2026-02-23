import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

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

    info(message: string, meta?: Record<string, any>) {
        this.logger.info(message, meta);
    }

    error(message: string, error?: Error | string, meta?: Record<string, any>) {
        this.logger.error(message, { error, ...meta });
    }

    warn(message: string, meta?: Record<string, any>) {
        this.logger.warn(message, meta);
    }

    debug(message: string, meta?: Record<string, any>) {
        this.logger.debug(message, meta);
    }
}
