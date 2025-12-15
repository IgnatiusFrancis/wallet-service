import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { setupSwagger } from './shared';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  // setupSwagger(app);

  const logger = new Logger('bootstrap');

  //const port = configService.get('PORT') || 3000;
  const port = 3000;
  await app.listen(port);
  logger.log(`🚀 Application running on port ${port}`);
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap().catch((e) => {
  Logger.error(`❌  Error starting server, ${e}`, '', 'Bootstrap', false);
  throw e;
});
