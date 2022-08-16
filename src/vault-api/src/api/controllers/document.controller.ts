import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from '@storage/services/storage.service';

import { JwtAuthGuard } from '../../profile/guards/jwt-auth-guard';

@ApiTags('Document')
@Controller({ version: '1', path: 'document' })
export class DocumentController {
  constructor(private storageService: StorageService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  @ApiOperation({ summary: 'List of documents will be returned' })
  @ApiResponse({ status: 200, description: 'List of documents' })
  async getDocuments(@Request() req) {
    const walletAddress = req.user.walletAddress;
    return await this.storageService.listDocuments(walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const walletAddress = req.user.walletAddress;
    await this.storageService.upload(
      walletAddress,
      file.originalname,
      file.buffer,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':walletAddress/:index')
  @ApiOperation({ summary: 'Download document' })
  @ApiResponse({ status: 200, description: 'Content of document' })
  async downloadDocument(
    @Request() req,
    @Param('walletAddress') walletAddress: string,
    @Param('index') index: string,
  ) {
    const downloaderWalletAddress = req.user.walletAddress;
    return this.storageService.download(
      walletAddress,
      parseInt(index, 10),
      downloaderWalletAddress,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':walletAddress/:index')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document was deleted' })
  async deleteDocument(
    @Request() req,
    @Param('walletAddress') walletAddress: string,
    @Param('index') index: string,
  ) {
    const callerAddress = req.user.walletAddress;
    return this.storageService.delete(
      walletAddress,
      parseInt(index, 10),
      callerAddress,
    );
  }
}
