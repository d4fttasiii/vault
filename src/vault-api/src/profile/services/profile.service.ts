import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { utils } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { PROFILE_PDA_SEED } from '@storage/constants/storage';
import { Model } from 'mongoose';

import { SolanaService } from '../../core/services/solana.service';
import * as VAULT_IDL from '../../core/solana/idl/vault.json';
import { PROFILE_SCHEMA } from '../constants/profile-constants';
import { RegisterDto } from '../../core/dtos';
import { ProfileDoc } from '../schemas';

@Injectable()
export class ProfileService {
  constructor(
    private solanaService: SolanaService,
    @InjectModel(PROFILE_SCHEMA) private profileModel: Model<ProfileDoc>,
  ) {}

  async create(registration: RegisterDto): Promise<string> {
    this.solanaService.ensureValidAddress(registration.walletAddress);
    const pda = await this.solanaService.findProgramAddress(
      VAULT_IDL.metadata.address,
      [
        utils.bytes.utf8.encode(PROFILE_PDA_SEED),
        new PublicKey(registration.walletAddress).toBuffer(),
      ],
    );
    if (pda.toBase58() !== registration.profileAddress) {
      throw new BadRequestException();
    }

    const user = await this.profileModel.findOne({
      walletAddress: registration.walletAddress,
    });
    if (user) {
      throw new BadRequestException(
        registration.walletAddress,
        'Profile already exists.',
      );
    }
    const createdUser = new this.profileModel({
      walletAddress: registration.walletAddress,
      profilePda: registration.profileAddress,
    });
    const { id } = await createdUser.save();
    return id;
  }

  async get(walletAddress: string): Promise<ProfileDoc> {
    return await this.profileModel.findOne({ walletAddress: walletAddress });
  }
}
