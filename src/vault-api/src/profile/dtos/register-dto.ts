import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ type: 'string' })
  walletAddress: string;
  @ApiProperty({ type: 'string' })
  profileAddress: string;
}
