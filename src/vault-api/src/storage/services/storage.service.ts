import { SolanaConfig } from '@core/models/config';
import { EncryptionService, S3Service, SolanaService } from '@core/services';
import { Injectable, StreamableFile, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PROFILE_SCHEMA } from '@profile/constants/profile-constants';
import { ProfileDoc } from '@profile/schemas';
import { ProfileDocumentDoc } from '@profile/schemas/document';
import { AnchorProvider, Idl, Program, utils, Wallet } from '@project-serum/anchor';
import { ConfirmOptions, Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    PROFILE_DOCUMENT_PDA_SEED,
    PROFILE_DOCUMENT_SCHEMA,
    PROFILE_DOCUMENT_SHARE_PDA_SEED,
    PROFILE_PDA_SEED,
} from '@storage/constants/storage';
import { Model } from 'mongoose';

import * as VAULT_IDL from '../solana/idl/vault.json';
import { Vault } from '../solana/types/vault';

@Injectable()
export class StorageService {
  private readonly storageBasePath = 'documents';

  constructor(
    private s3: S3Service,
    private configService: ConfigService,
    private encrypt: EncryptionService,
    private solanaService: SolanaService,
    @InjectModel(PROFILE_SCHEMA) private profileModel: Model<ProfileDoc>,
    @InjectModel(PROFILE_DOCUMENT_SCHEMA)
    private profileDocumentModel: Model<ProfileDocumentDoc>,
  ) {}

  async listDocuments(walletAddress: string): Promise<ProfileDocumentDoc[]> {
    const docs = await this.profileDocumentModel
      .find({
        profileWalletAddress: walletAddress,
      })
      .sort({
        createdAt: 'desc',
      })
      .exec();

    return docs;
  }

  async upload(
    walletAddress: string,
    name: string,
    content: Buffer,
  ): Promise<string> {
    const profile = await this.profileModel.findOne({
      walletAddress: walletAddress,
    });
    const objectName = `${this.storageBasePath}/${profile.walletAddress}/${name}`;
    await this.s3.upload(objectName, content);
    const profileDoc = new this.profileDocumentModel({
      objectName: objectName,
      profileId: profile.id,
      profileWalletAddress: walletAddress,
      index: await this.getDocumentCount(walletAddress),
      metadata: {
        name: name,
        encryptedSize: content.byteLength,
        originalSize: content.byteLength,
        extension: this.getExtension(name),
      },
    });
    await profileDoc.save();

    return objectName;
  }

  async download(
    ownerWalletAddress: string,
    index: number,
    downloaderWalletAddress: string,
  ): Promise<StreamableFile> {
    if (ownerWalletAddress !== downloaderWalletAddress) {
      this.ensureCanAccessDocuments(
        ownerWalletAddress,
        index,
        downloaderWalletAddress,
      );
    }

    const document = await this.getDocument(ownerWalletAddress, index);
    const content = await this.s3.download(document.objectName);

    return new StreamableFile(content);
  }

  async canAccessDocuments(
    ownerWalletAddress: string,
    index: number,
    downloaderWalletAddress: string,
  ): Promise<boolean> {
    const provider = this.getProvider();
    const program = new Program(
      VAULT_IDL as Idl,
      new PublicKey(VAULT_IDL.metadata.address),
      provider,
    ) as Program<Vault>;
    const document = await this.getDocument(ownerWalletAddress, index);
    const documentPda = await this.getProfileDocumentPda(
      document.profileWalletAddress,
      document.index,
    );
    const documentSharePda = await this.getProfileDocumentSharePda(
      documentPda,
      new PublicKey(downloaderWalletAddress),
    );

    const account = await provider.connection.getAccountInfo(
      documentSharePda,
      'confirmed',
    );
    if (!account) {
      return false;
    }

    const share = await program.account.documentShareData.fetch(
      documentSharePda,
    );
    const isActive = share.isActive;
    const approvedAt = share.updated.toNumber();
    const validUntil = (approvedAt + 3600 * share.validUntil) * 1000;
    const now = Date.now();

    return isActive && now <= validUntil;
  }

  async ensureCanAccessDocuments(
    ownerWalletAddress: string,
    index: number,
    downloaderWalletAddress: string,
  ): Promise<void> {
    if (
      await this.canAccessDocuments(
        ownerWalletAddress,
        index,
        downloaderWalletAddress,
      )
    ) {
      return;
    }

    throw new UnauthorizedException();
  }

  private async getDocument(
    walletAddress: string,
    index: number,
  ): Promise<ProfileDocumentDoc> {
    return await this.profileDocumentModel.findOne({
      profileWalletAddress: walletAddress,
      index: index,
    });
  }

  private async getDocumentCount(walletAddress: string): Promise<number> {
    return await this.profileDocumentModel.count({
      profileWalletAddress: walletAddress,
    });
  }

  // private async getCurrentDocumentCount(walletAddress: string): Promise<number> {
  //     const pda = await this.getProfilePda(walletAddress);
  //     const provider = this.getProvider();
  //     const program = new Program(VAULT_IDL as Idl, new PublicKey(VAULT_IDL.metadata.address), provider) as Program<Vault>;
  //     const profile = await program.account.profileData.fetch(pda);

  //     return profile.documentCount;
  // }

  private getProvider(): AnchorProvider {
    const network = this.configService.get<SolanaConfig>('solana').cluster;
    const wallet = new Wallet(Keypair.generate());
    const connection = new Connection(network, 'confirmed');
    const opts: ConfirmOptions = {
      preflightCommitment: 'confirmed',
    };
    const provider = new AnchorProvider(connection, wallet, opts);

    return provider;
  }

  private getExtension(name: string) {
    const parts = name.split('.');
    return parts[parts.length - 1];
  }

  private async getProfilePda(address: string): Promise<PublicKey> {
    return await this.solanaService.findProgramAddress(
      VAULT_IDL.metadata.address,
      [
        utils.bytes.utf8.encode(PROFILE_PDA_SEED),
        new PublicKey(address).toBuffer(),
      ],
    );
  }

  private async getProfileDocumentPda(
    address: string,
    docIndex: number,
  ): Promise<PublicKey> {
    return await this.solanaService.findProgramAddress(
      VAULT_IDL.metadata.address,
      [
        utils.bytes.utf8.encode(PROFILE_DOCUMENT_PDA_SEED),
        new PublicKey(address).toBuffer(),
        utils.bytes.utf8.encode(docIndex.toString()),
      ],
    );
  }

  private async getProfileDocumentSharePda(
    documentPda: PublicKey,
    invitee: PublicKey,
  ): Promise<PublicKey> {
    return await this.solanaService.findProgramAddress(
      VAULT_IDL.metadata.address,
      [
        documentPda.toBuffer(),
        utils.bytes.utf8.encode(PROFILE_DOCUMENT_SHARE_PDA_SEED),
        invitee.toBuffer(),
      ],
    );
  }
}
