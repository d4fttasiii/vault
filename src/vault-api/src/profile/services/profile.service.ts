import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SolanaService } from '../../core/services/solana.service';
import { PROFILE_SCHEMA } from '../constants/profile-constants';
import { RegisterDto } from '../dtos';
import { ProfileDocument } from '../schemas';

@Injectable()
export class ProfileService {
    constructor(
        private solanaService: SolanaService,
        @InjectModel(PROFILE_SCHEMA) private profileModel: Model<ProfileDocument>) { }

    async create(registration: RegisterDto): Promise<string> {
        this.solanaService.ensureValidAddress(registration.walletAddress);
        const user = await this.profileModel.findOne({ walletAddress: registration.walletAddress });
        if (user) {
            throw new BadRequestException(registration.walletAddress, 'Profile already exists.');
        }
        const createdUser = new this.profileModel({
            walletAddress: registration.walletAddress,
        });
        const { id } = await createdUser.save();
        return id;
    }

    async get(walletAddress: string): Promise<ProfileDocument> {
        return await this.profileModel.findOne({ walletAddress: walletAddress });
    }
}
