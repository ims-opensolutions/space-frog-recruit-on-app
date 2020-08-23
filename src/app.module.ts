import { Module } from '@nestjs/common';
import { FileManagerModule } from './file-manager/file-manager.module';

@Module({
  imports: [FileManagerModule],
})
export class AppModule {}
