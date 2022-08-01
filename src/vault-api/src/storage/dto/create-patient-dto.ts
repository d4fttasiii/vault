import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
    @ApiProperty({ type: 'string' })
    walletAddress: string;
    @ApiProperty({ type: 'string' })
    encryptionKey: string;
    @ApiProperty({ type: 'string' })
    recoveryKey: string;
}
