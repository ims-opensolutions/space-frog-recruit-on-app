import { Module } from '@nestjs/common';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';

@Module({
    controllers: [FileManagerController],
    providers: [FileManagerService]
})
export class FileManagerModule {}
