import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { LoggerService } from '@/shared/logger/logger.service';

@Catch()
export class AllExceptionsWebSocketFilter extends BaseWsExceptionFilter {
    constructor(private logger: LoggerService) {
        super();
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        const message = host.switchToWs().getData();

        const error = exception instanceof Error ? exception : new Error(String(exception));

        this.logger.error(
            `WebSocket Exception: ${error.message}`,
            error,
            { userId: client.data?.user?.userId, message },
        );

        client.emit('error', {
            type: 'error',
            message: error.message || 'Internal server error',
            timestamp: new Date().toISOString(),
        });
    }
}

@Catch()
export class AllExceptionsFilter {
    constructor(private logger: LoggerService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        this.logger.error(
            `HTTP Exception: ${message}`,
            exception instanceof Error ? exception : new Error(String(exception)),
            { path: request.url, method: request.method },
        );

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
