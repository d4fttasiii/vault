import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDocument = Profile & Document;

export class Session {
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
        type: Session,
    })
    session: Session;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
