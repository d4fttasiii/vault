import { ApiProperty } from "@nestjs/swagger";

export class RequestPatientDocumentAccessDto {
    @ApiProperty({ type: 'string' })
    encryptionKey: string;
    @ApiProperty({ type: 'number' })
    accessibleForHours: number;
}
