import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from '@storage/services/storage.service';

import { JwtAuthGuard } from '../../profile/guards/jwt-auth-guard';

@ApiTags('Document')
@Controller({ version: '1', path: 'document' })
export class DocumentController {

    constructor(private storageService: StorageService) { }

    @UseGuards(JwtAuthGuard)
    @Get('list/:walletAddress')
    @ApiParam({ name: 'walletAddress', description: 'Should be a valid Solana address belonging to a user.' })
    @ApiOperation({ summary: 'List of documents will be returned' })
    @ApiResponse({ status: 200, description: 'UUID message.' })
    async getLoginMessage(@Param('walletAddress') walletAddress: string) {
        // return await this.storageService.listDocuments()
    }
}
