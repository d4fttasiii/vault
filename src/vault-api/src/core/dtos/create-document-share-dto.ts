import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentShareDto {
  @ApiProperty({ type: 'string' })
  walletAddress: string;
  @ApiProperty({ type: 'number' })
  index: number;
  @ApiProperty({ type: 'string' })
  inviteeAddress: string;
  @ApiProperty({ type: 'string' })
  sharePda: string;
}
