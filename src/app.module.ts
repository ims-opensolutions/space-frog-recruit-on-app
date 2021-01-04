import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FileManagerModule } from './file-manager/file-manager.module';
import { FileManagerMiddleware } from './file-manager/middleware/file-manager.middleware';

@Module({
  imports: [FileManagerModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FileManagerMiddleware)
      .forRoutes(
        '/file-manager/generate', 
        '/file-manager/map/*', 
        '/file-manager/render'
      );
  }
}
