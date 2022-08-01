import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDoc = Profile & Document;

export class AuthMessage {
    message: string;
    used: boolean;
}

@Schema({
    timestamps: {
        createdAt: true,
        updatedAt: true
    },
})
export class Profile {
    @Prop({
        type: String,
        length: 44,
        unique: true,
        nullable: false,
        index: true,
    })
    walletAddress: string;

    @Prop({
        type: AuthMessage,
    })
    lastAuthMessage: AuthMessage;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
