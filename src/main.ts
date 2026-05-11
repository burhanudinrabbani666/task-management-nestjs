import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // <-- Application Level
  app.useGlobalInterceptors(new TransformInterceptor());

  const deployPort = 3000;
  await app.listen(process.env.PORT ?? deployPort);
  logger.log(`Application listening on Port: ${deployPort}`);
}

void bootstrap();
