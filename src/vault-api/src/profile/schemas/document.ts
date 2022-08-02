import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as S } from 'mongoose';

export type ProfileDocumentDoc = ProfileDocument & Document;

@Schema({
    timestamps: {
        createdAt: true,
        updatedAt: true
    },
})
export class ProfileDocument extends Document {
    @Prop({ type: S.Types.ObjectId, ref: 'Profile' })
    profileId: string;

    @Prop({ type: String, index: true, })
    profileWalletAddress: string;

    @Prop({ type: Number, index: true, })
    index: number;

    @Prop({ type: String, })
    objectName: string;

    @Prop({
        type: {
            size: Number,
            name: String,
            extension: String,
        }
    })
    metadata: {
        originalSize: number;
        encryptedSize: number;
        name: string;
        extension: string;
    };

    updatedAt: Date;
    createdAt: Date;
}

export const ProfileDocumentSchema = SchemaFactory.createForClass(ProfileDocument);