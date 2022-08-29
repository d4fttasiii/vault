import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as S } from 'mongoose';

export type ProfileDocumentDoc = ProfileDocument & Document;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: true,
  },
})
export class ProfileDocument extends Document {
  @Prop({ type: S.Types.ObjectId, ref: 'Profile' })
  profileId: string;

  @Prop({ type: String, length: 44, nullable: false, index: true })
  profileWalletAddress: string;

  @Prop({ type: String })
  documentPda: string;

  @Prop({ type: Number, index: true })
  index: number;

  @Prop({ type: String })
  objectName: string;

  @Prop({
    type: {
      size: Number,
      name: String,
      extension: String,
    },
  })
  metadata: {
    size: number;
    name: string;
    extension: string;
  };

  @Prop({ type: Boolean })
  isEncrypted: boolean;

  updatedAt: Date;
  createdAt: Date;
}

export const ProfileDocumentSchema =
  SchemaFactory.createForClass(ProfileDocument);
