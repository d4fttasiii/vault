import { ApiProperty } from "@nestjs/swagger";

export class CreatePractitionerDto {
    @ApiProperty({ type: 'string' })
    erpPractitionerId: string;
    @ApiProperty({ type: 'string' })
    walletAddress: string;
}
