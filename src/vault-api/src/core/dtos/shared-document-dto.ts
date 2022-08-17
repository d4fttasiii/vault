export interface SharedDocument {
  _id: string;
  index: number;
  ownerAddress: string;
  updatedAt: Date;
  createdAt: Date;
  validUntil: Date;
  sharePda: string;
  filename: string;
  extension: string;
  size: number;
}
