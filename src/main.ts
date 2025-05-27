import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để cho phép truy cập từ bên ngoài
  app.enableCors({
    origin: ['http://localhost:4000', 'http://localhost:3000'], // Cho phép cả port 3000 và 4000
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  const port = process.env.PORT || 9090;
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors) => {
        return new UnprocessableEntityException(
          validationErrors.map((err) => ({
            field: err.property,
            error: Object.values(err.constraints || {}).join(', '),
          })),
        );
      },
    }),
  );
  app.use(express.json());
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on Port: ${port}`);
  });
}
bootstrap();
