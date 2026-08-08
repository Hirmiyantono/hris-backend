import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`Application is running on: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
  // eslint-disable-next-line no-console
  console.log(`Database health: http://localhost:${port}/api/v1/health/database`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    // eslint-disable-next-line no-console
    console.log('SIGTERM signal received: closing HTTP server');
    await app.close();
  });

  process.on('SIGINT', async () => {
    // eslint-disable-next-line no-console
    console.log('SIGINT signal received: closing HTTP server');
    await app.close();
  });
}

void bootstrap();
