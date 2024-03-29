import { DocumentData, DocumentMetadata, SharedDocument } from '@core/dtos';
import { CreateDocumentShareDto } from '@core/dtos/create-document-share-dto';
import { ToggleDocumentEncryption } from '@core/dtos/toggle-document-encryption-dto';
import { SolanaConfig } from '@core/models/config';
import { EncryptionService, S3Service, SolanaService } from '@core/services';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PROFILE_SCHEMA } from '@profile/constants/profile-constants';
import { ProfileDoc, ProfileDocumentShareDoc } from '@profile/schemas';
import { ProfileDocumentDoc } from '@profile/schemas/document';
import {
  AnchorProvider,
  Idl,
  Program,
  utils,
  Wallet,
} from '@project-serum/anchor';
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import {
  PROFILE_DOCUMENT_PDA_SEED,
  PROFILE_DOCUMENT_SCHEMA,
  PROFILE_DOCUMENT_SHARE_PDA_SEED,
  PROFILE_DOCUMENT_SHARE_SCHEMA,
  PROFILE_PDA_SEED,
} from '@storage/constants/storage';
import { Model } from 'mongoose';

import * as VAULT_IDL from '../../core/solana/idl/vault.json';
import { Vault } from '../../core/solana/types/vault';

@Injectable()
export class StorageService {
  private readonly storageBasePath = 'documents';

  constructor(
    private s3: S3Service,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private solanaService: SolanaService,
    @InjectModel(PROFILE_SCHEMA)
    private profileModel: Model<ProfileDoc>,
    @InjectModel(PROFILE_DOCUMENT_SCHEMA)
    private profileDocumentModel: Model<ProfileDocumentDoc>,
    @InjectModel(PROFILE_DOCUMENT_SHARE_SCHEMA)
    private profileDocumentShareModel: Model<ProfileDocumentShareDoc>,
  ) {}

  async listDocuments(walletAddress: string): Promise<DocumentData[]> {
    const docs = await this.profileDocumentModel
      .find({
        profileWalletAddress: walletAddress,
      })
      .sort({
        createdAt: 'desc',
      })
      .exec();
    const shares = await this.profileDocumentShareModel.find({
      $and: [
        {
          ownerAddress: walletAddress,
        },
        {
          documentId: { $in: docs.map((d) => d._id) },
        },
      ],
    });

    return docs.map((d) => {
      const docShares = shares.filter((s) => s.documentId == d.id);
      return {
        _id: d._id,
        metadata: d.metadata as DocumentMetadata,
        index: d.index,
        profileAddress: d.profileWalletAddress,
        documentPda: d.documentPda,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        shares: docShares.map((ds) => {
          return {
            inviteeAddress: ds.inviteeAddress,
            updatedAt: ds.updatedAt,
            validUntil: ds.validUntil,
            sharePda: ds.sharePda,
          };
        }),
        isEncrypted: d.isEncrypted,
      };
    });
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
        size: content.byteLength,
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
    const document = await this.getDocument(ownerWalletAddress, index);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.profileWalletAddress !== downloaderWalletAddress) {
      await this.ensureCanAccessDocuments(
        ownerWalletAddress,
        index,
        downloaderWalletAddress,
      );
    }
    const content = await this.s3.download(document.objectName);

    return new StreamableFile(content);
  }

  async toggleDocumentEncryption(
    walletAddress: string,
    index: number,
    data: ToggleDocumentEncryption,
  ) {
    const document = await this.getDocument(walletAddress, index);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    const content = await this.s3.download(document.objectName);
    if (document.isEncrypted) {
      const decryptedContent = this.encryptionService.decrypt(
        content,
        data.key,
      );
      await this.s3.delete(document.objectName);
      await this.s3.upload(document.objectName, decryptedContent);
    } else {
      const encryptedContent = this.encryptionService.encrypt(
        content,
        data.key,
      );
      await this.s3.delete(document.objectName);
      await this.s3.upload(document.objectName, encryptedContent);
    }
    document.isEncrypted = !document.isEncrypted;
    await document.save();
  }

  async delete(
    ownerWalletAddress: string,
    index: number,
    callerAddress: string,
  ) {
    const document = await this.getDocument(ownerWalletAddress, index);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.profileWalletAddress !== callerAddress) {
      throw new UnauthorizedException();
    }
    const documentPda = await this.getProfileDocumentPda(
      document.profileWalletAddress,
      document.index,
    );
    const provider = this.getProvider();
    const program = new Program(
      VAULT_IDL as Idl,
      new PublicKey(VAULT_IDL.metadata.address),
      provider,
    ) as Program<Vault>;
    const profileDocAccount = await program.account.documentData.fetch(
      documentPda,
    );
    if (!profileDocAccount.deleted) {
      throw new BadRequestException(
        `Document has not been market as deleted yet`,
      );
    }
    await this.s3.delete(document.objectName);
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

  async listSharedDocuments(walletAddress: string): Promise<SharedDocument[]> {
    const shares = await this.profileDocumentShareModel
      .find({
        inviteeAddress: walletAddress,
      })
      .exec();
    const docs = await this.profileDocumentModel.find({
      _id: { $in: shares.map((s) => s.documentId) },
    });

    return docs.map((d) => {
      const share = shares.find((s) => s.documentId == d.id);
      return {
        _id: share._id,
        index: d.index,
        ownerAddress: d.profileWalletAddress,
        updatedAt: share?.updatedAt,
        createdAt: share?.createdAt,
        validUntil: share?.validUntil,
        sharePda: share?.sharePda,
        filename: d.metadata.name,
        extension: d.metadata.extension,
        size: d.metadata.size,
      };
    });
  }

  async shareDocument(data: CreateDocumentShareDto, callerAddress: string) {
    const document = await this.getDocument(data.walletAddress, data.index);
    if (document.profileWalletAddress !== callerAddress) {
      throw new UnauthorizedException();
    }
    const shareValidUntil = await this.getDocumentShareValidUntil(
      document,
      data.inviteeAddress,
    );

    const existingShare = await this.profileDocumentShareModel.findOne({
      inviteeAddress: data.inviteeAddress,
      documentId: document._id,
    });
    if (!existingShare) {
      const share = new this.profileDocumentShareModel({
        documentId: document.id,
        inviteeAddress: data.inviteeAddress,
        ownerAddress: document.profileWalletAddress,
        sharePda: data.sharePda,
        validUntil: shareValidUntil,
      });

      await share.save();
      return;
    }

    existingShare.validUntil = shareValidUntil;
    await existingShare.save();
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

  private async getDocumentShareValidUntil(
    document: ProfileDocumentDoc,
    inviteeAddress: string,
  ): Promise<Date> {
    const provider = this.getProvider();
    const program = new Program(
      VAULT_IDL as Idl,
      new PublicKey(VAULT_IDL.metadata.address),
      provider,
    ) as Program<Vault>;
    const documentPda = await this.getProfileDocumentPda(
      document.profileWalletAddress,
      document.index,
    );
    const documentSharePda = await this.getProfileDocumentSharePda(
      documentPda,
      new PublicKey(inviteeAddress),
    );

    const share = await program.account.documentShareData.fetch(
      documentSharePda,
    );
    const approvedAt = share.updated.toNumber();
    const validUntil = (approvedAt + 3600 * share.validUntil) * 1000;

    return new Date(validUntil);
  }

  private async getDocument(
    walletAddress: string,
    index: number,
  ): Promise<ProfileDocumentDoc> {
    const doc = await this.profileDocumentModel.findOne({
      profileWalletAddress: walletAddress,
      index: index,
    });
    if (!doc) {
      throw new NotFoundException();
    }

    return doc;
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
