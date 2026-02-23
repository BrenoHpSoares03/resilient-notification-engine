import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

/**
 * Unit tests for JWT Authentication Guard
 */
describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = {
            getAllAndOverride: jest.fn(),
        } as unknown as Reflector;

        guard = new JwtAuthGuard(reflector);

        // Mock parent's canActivate to avoid HTTP context issues in tests
        jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockImplementation(() => false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('canActivate', () => {
        it('should allow public routes without authentication', () => {
            const mockContext = {
                getHandler: jest.fn(),
                getClass: jest.fn(),
            } as unknown as ExecutionContext;

            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('should check for @Public() decorator on handler', () => {
            const handler = () => { };
            const controller = class { };
            const mockContext = {
                getHandler: jest.fn().mockReturnValue(handler),
                getClass: jest.fn().mockReturnValue(controller),
            } as unknown as ExecutionContext;

            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

            guard.canActivate(mockContext);

            expect(reflector.getAllAndOverride).toHaveBeenCalledWith(expect.any(String), [
                handler,
                controller,
            ]);
        });

        it('should defer to parent for protected routes', () => {
            const mockContext = {
                getHandler: jest.fn(),
                getClass: jest.fn(),
            } as unknown as ExecutionContext;

            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

            // The guard should call parent's canActivate for non-public routes
            const result = guard.canActivate(mockContext);

            // Parent's mocked canActivate returns false
            expect(result).toBe(false);
        });
    });

    describe('Public vs Protected routes', () => {
        it('should allow unauthenticated access when @Public() is applied', () => {
            // When @Public() decorator is found, guard returns true immediately
            const mockContext = {
                getHandler: jest.fn(),
                getClass: jest.fn(),
            } as unknown as ExecutionContext;

            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('should require authentication when @Public() is not applied', () => {
            // When @Public() decorator is not found, guard defers to parent
            const mockContext = {
                getHandler: jest.fn(),
                getClass: jest.fn(),
            } as unknown as ExecutionContext;

            (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

            const result = guard.canActivate(mockContext);

            // Parent returns false (not authenticated)
            expect(result).toBe(false);
            expect(reflector.getAllAndOverride).toHaveBeenCalled();
        });
    });
});
