export interface DocumentData {
  _id: string;
  profileAddress: string;
  index: number;
  documentPda: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: DocumentMetadata;
  shares?: DocumentShareData[];
  isEncrypted: boolean;
}

export interface DocumentMetadata {
  name: string;
  size: number;
  extension: string;
}

export interface DocumentShareData {
  inviteeAddress: string;
  updatedAt: Date;
  validUntil: Date;
  sharePda: string;
}
