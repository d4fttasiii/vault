import { ApiProperty } from "@nestjs/swagger";

export class CreatePatientDocumentDto {
    @ApiProperty({ type: 'string' })
    accountAddress: string;
    @ApiProperty({ type: 'string' })
    encryptionKey: string;
}
