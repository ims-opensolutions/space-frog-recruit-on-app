import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule
  );

  app.useStaticAssets(join(__dirname, '/../', 'logo'));
  app.useStaticAssets(join(__dirname, '/../', 'js'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
