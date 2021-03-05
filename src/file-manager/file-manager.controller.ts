import { Controller, Get, Render, Post, UseInterceptors, UploadedFile, Body, Query, Param, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Filter } from './entities/filter';
import { FileManagerService } from './file-manager.service';


@Controller('file-manager')
export class FileManagerController {

    constructor(private fileManagerService: FileManagerService) {}

    @Get()
    @Render('greeting')
    getGreetingPage(): void {}

    @Get('upload')
    @Render('upload')
    async getUploadForm(@Query() name: string) {
        const exist = await this.fileManagerService.isThereAnyRecordInDatabase();
        return exist ? { name: name, visible: 'visible' } : { name: name };
    }

    @Get('map/:id')
    @Render('map')
    getMap(@Param('id') id) {}

    @Post('generate')
    @Render('results')
    @UseInterceptors(FileInterceptor('excel-file'))
    async generateResults(@UploadedFile() file, @Body('mode') mode?: string) {
        console.log(`MODE ${mode}`);
        return await this.fileManagerService.generateResults(file, mode);
    }

    @Post('render')
    async renderResults(@Body() filters: Filter) { 
        return await this.fileManagerService.renderResults(filters);
    }

    @Get('generate')
    async getCandidatesData(@Req() request: Request, @Res() res: Response) {
        return await this.fileManagerService.getCandidatesData(request, res);
    }
  
}
