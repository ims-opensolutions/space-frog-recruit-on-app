import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

async function bootstrap() {

  const httpsOptions = {
    key: fs.readFileSync('./secrets/localhost-key.pem'),
    cert: fs.readFileSync('./secrets/localhost-cert.pem'),
  };

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule, { httpsOptions }
  );

  app.useStaticAssets(join(__dirname, '/../', 'logo'));
  app.useStaticAssets(join(__dirname, '/../', 'js'));
  app.useStaticAssets(join(__dirname, '..', 'views/css'));
  app.useStaticAssets(join(__dirname, '/../', 'views/js'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
