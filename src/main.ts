import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggerService } from './shared/logger/logger.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(LoggerService);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.useGlobalFilters(new AllExceptionsFilter(logger));

    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Resilient Notification Engine API')
        .setDescription('Real-time resilient notification engine using NestJS, WebSockets, and Redis')
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token for authentication',
            },
            'bearer',
        )
        .addTag('Health', 'Health check endpoints')
        .addTag('Notifications', 'Notification management endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayOperationId: true,
        },
    });

    const port = parseInt(process.env.PORT || '3000', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';

    await app.listen(port);

    logger.info(`🚀 Application is running on http://localhost:${port}`, { nodeEnv });
    logger.info('📡 WebSocket namespace available at /notifications');
    logger.info(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
});
