import { DocAccessStatus } from 'doctive-core';

export class DocumentAccessRequestDto {
    programAccountAddress: string;
    accessStatus: DocAccessStatus;
    practitionerAddress: string;
    patientAddress: string;
    createdAt: Date;
    ttl: number;
    canAccess?: boolean;
}
