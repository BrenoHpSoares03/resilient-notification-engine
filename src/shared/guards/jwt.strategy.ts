import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@/shared/types';

/**
 * JWT Strategy for Passport authentication
 * Validates and extracts JWT tokens from Authorization headers
 * 
 * IMPORTANT: In production, use environment variables for secrets
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        });
    }

    /**
     * Validates and returns decorator payload
     * Called by Passport after successful JWT validation
     */
    async validate(payload: JwtPayload): Promise<JwtPayload> {
        return {
            userId: payload.userId,
            email: payload.email,
            iat: payload.iat,
            exp: payload.exp,
        };
    }
}
