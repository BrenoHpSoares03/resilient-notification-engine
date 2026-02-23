import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@/shared/logger/logger.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private logger: LoggerService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        try {
            const client = context.switchToWs().getClient();
            const token = this.extractToken(client);

            if (!token) {
                this.logger.error('WebSocket connection rejected: No token provided');
                throw new UnauthorizedException('Missing JWT token');
            }

            const payload = this.jwtService.verify(token);
            client.data = { user: payload };

            this.logger.debug(`WebSocket authenticated for user: ${payload.userId}`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('WebSocket JWT validation failed', errorMessage);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractToken(client: any): string | null {
        if (client.handshake?.query?.token) {
            return client.handshake.query.token;
        }

        const authHeader = client.handshake?.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.slice(7);
        }

        return null;
    }
}
