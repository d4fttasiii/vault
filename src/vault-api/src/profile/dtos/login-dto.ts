import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ type: 'string' })
    walletAddress: string;
    @ApiProperty({ type: 'string' })
    signature: string;
}