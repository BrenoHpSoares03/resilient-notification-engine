import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggerService } from './shared/logger/logger.service';

/**
 * Application bootstrap
 * Initializes NestJS application with global configurations
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(LoggerService);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Remove non-documented properties
            forbidNonWhitelisted: true, // Throw error on non-documented properties
            transform: true, // Automatically transform to DTO types
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(logger));

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const port = parseInt(process.env.PORT || '3000', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';

    await app.listen(port);

    logger.info(`🚀 Application is running on http://localhost:${port}`, { nodeEnv });
    logger.info('📡 WebSocket namespace available at /notifications');
}

bootstrap().catch((error) => {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
});
