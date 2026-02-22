import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@/shared/types';

/**
 * Custom decorator to extract user from JWT payload in HTTP requests
 * Usage: constructor(private user: @CurrentUser() JwtPayload)
 */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

/**
 * Custom decorator to extract user from WebSocket client
 * Usage: @CurrentUser() user: JwtPayload
 */
export const CurrentWsUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload => {
        const socket = ctx.switchToWs().getClient();
        return socket.data?.user;
    },
);
