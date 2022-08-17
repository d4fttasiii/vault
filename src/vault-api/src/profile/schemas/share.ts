import { PROFILE_DOCUMENT_SCHEMA } from './../../storage/constants/storage';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as S } from 'mongoose';

export type ProfileDocumentShareDoc = ProfileDocumentShare & Document;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: true,
  },
})
export class ProfileDocumentShare {
  @Prop({ type: S.Types.ObjectId, ref: PROFILE_DOCUMENT_SCHEMA })
  documentId: string;

  @Prop({
    type: String,
    length: 44,
    nullable: false,
    index: true,
  })
  ownerAddress: string;

  @Prop({
    type: String,
    length: 44,
    nullable: false,
    index: true,
  })
  inviteeAddress: string;

  @Prop({
    type: String,
    length: 44,
    unique: true,
    nullable: false,
    index: true,
  })
  sharePda: string;

  @Prop({ type: Date })
  validUntil: Date;

  updatedAt: Date;
  createdAt: Date;
}

export const ProfileDocumentShareSchema =
  SchemaFactory.createForClass(ProfileDocumentShare);
