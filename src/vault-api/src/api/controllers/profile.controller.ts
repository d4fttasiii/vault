import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LoginDto, RegisterDto } from '../../profile/dtos';
import { JwtAuthGuard } from '../../profile/guards/jwt-auth-guard';
import { AuthService } from '../../profile/services/auth.service';
import { ProfileService } from '../../profile/services/profile.service';

@ApiTags('Profile')
@Controller({ version: '1', path: 'profile' })
export class ProfileController {
  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
  ) {}

  @Post()
  @ApiBody({ type: RegisterDto })
  async register(@Body() createDto: RegisterDto) {
    return await this.profileService.create(createDto);
  }

  @Get(':walletAddress/login-message')
  @ApiParam({
    name: 'walletAddress',
    description: 'Should be a valid Solana address belonging to a user.',
  })
  @ApiOperation({
    summary:
      'Message will be returned which needs be signed for logging in on the connecting device.',
  })
  @ApiResponse({ status: 200, description: 'UUID message.' })
  async getLoginMessage(@Param('walletAddress') walletAddress: string) {
    return await this.authService.generateMessage(walletAddress);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOperation({
    summary:
      'Verifies signature with public key calculated from the users address.',
  })
  @ApiResponse({ status: 200, description: 'JWT Token' })
  async login(@Body() login: LoginDto) {
    return await this.authService.signIn(login.walletAddress, login.signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Testing JWT Token' })
  getUserInfo(@Request() req) {
    return req.user;
  }
}
