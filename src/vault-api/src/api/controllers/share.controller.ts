import { CreateDocumentShareDto, SharedDocument } from '@core/dtos';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from '@storage/services/storage.service';

import { JwtAuthGuard } from '../../profile/guards/jwt-auth-guard';

@ApiTags('Share')
@Controller({ version: '1', path: 'share' })
export class ShareController {
  constructor(private storageService: StorageService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  @ApiOperation({ summary: 'List of shared document' })
  @ApiResponse({ status: 200, description: 'List of shared documents' })
  async getShare(@Request() req): Promise<SharedDocument[]> {
    const walletAddress = req.user.walletAddress;
    return await this.storageService.listSharedDocuments(walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('')
  @ApiOperation({ summary: 'Shared document' })
  @ApiResponse({ status: 200, description: 'Document share was upserted' })
  async createShare(@Request() req, @Body() data: CreateDocumentShareDto) {
    const walletAddress = req.user.walletAddress;
    return await this.storageService.shareDocument(data, walletAddress);
  }
}
