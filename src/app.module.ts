import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { FileManagerModule } from './file-manager/file-manager.module';
import { FileManagerService } from './file-manager/file-manager.service';
import { CookieManagerMiddleware } from './file-manager/middleware/cookie.manager.middleware';
import { EncryptionManagerMiddleware } from './file-manager/middleware/encryption.manager.middleware';

@Module({
  imports: [FileManagerModule],
  providers: [FileManagerService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(EncryptionManagerMiddleware)
      .forRoutes(
        '/file-manager/generate', 
        '/file-manager/map/*', 
        '/file-manager/render'
      ).apply(CookieManagerMiddleware)
      .forRoutes(
        { path: 'file-manager/generate', method: RequestMethod.GET },
        '/file-manager/map/*'
      );
  }
}
