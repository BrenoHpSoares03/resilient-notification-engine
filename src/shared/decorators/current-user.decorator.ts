import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@/shared/types/auth/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

export const CurrentWsUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload => {
        const socket = ctx.switchToWs().getClient();
        return socket.data?.user;
    },
);
