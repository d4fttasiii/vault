import { SolanaConfig } from '@core/models/config';
import { EncryptionService, S3Service, SolanaService } from '@core/services';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PROFILE_SCHEMA } from '@profile/constants/profile-constants';
import { ProfileDoc } from '@profile/schemas';
import { AnchorProvider, Idl, Program, utils, Wallet } from '@project-serum/anchor';
import { ConfirmOptions, Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    PROFILE_DOCUMENT_PDA_SEED,
    PROFILE_DOCUMENT_SCHEMA,
    PROFILE_DOCUMENT_SHARE_PDA_SEED,
    PROFILE_PDA_SEED,
} from '@storage/constants/storage';
import { ProfileDocumentDoc } from '@storage/schemas/document';
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
        @InjectModel(PROFILE_DOCUMENT_SCHEMA) private profileDocumentModel: Model<ProfileDocumentDoc>) { }

    async listDocuments(profileId: string): Promise<ProfileDocumentDoc[]> {
        const docs = await this.profileDocumentModel.find({
            profileId: profileId
        }).sort({
            createdAt: 'desc',
        }).exec();

        return docs;
    }

    async upload(profileId: string, pda: string, name: string, content: Buffer, encryptionKey: string): Promise<string> {
        const profile = await this.profileModel.findOne({ id: profileId });
        const objectName = this.getObjectName(profile.walletAddress, name);
        const encryptedContent = this.encrypt.encrypt(content, encryptionKey);
        await this.s3.upload(objectName, encryptedContent);

        const profileDoc = new this.profileDocumentModel({

            objectName: objectName,
            profileId: profile.id,
            metadata: {
                name: name,
                encryptedSize: encryptedContent.byteLength,
                originalSize: content.byteLength,
                extension: this.getExtension(name),
                pda: pda
            }
        });
        await profileDoc.save();

        return objectName;
    }

    async download(objectName: string): Promise<Buffer> {
        return await this.s3.download(objectName);
    }

    async canAccessDocuments(profileDocumentId: string, inviteeAddress: string): Promise<boolean> {
        const provider = this.getProvider();
        const program = new Program(VAULT_IDL as Idl, new PublicKey(VAULT_IDL.metadata.address), provider) as Program<Vault>;
        const document = await this.profileDocumentModel.findOne({ id: profileDocumentId }).exec();
        const documentPda = await this.getProfileDocumentPda(document.profileWalletAddress, document.index);
        const documentSharePda = await this.getProfileDocumentSharePda(documentPda, new PublicKey(inviteeAddress));

        const account = await provider.connection.getAccountInfo(documentSharePda, 'confirmed');
        if (!account) {
            return false;
        }

        const share = await program.account.documentShareData.fetch(documentSharePda);
        const isActive = share.isActive;
        const approvedAt = share.updated.toNumber();
        const validUntil = (approvedAt + (3600 * share.validUntil)) * 1000;
        const now = Date.now();

        return isActive && now <= validUntil;
    }

    async ensureCanAccessDocuments(patientAddress: string, practitionerAddress: string): Promise<void> {
        if (await this.canAccessDocuments(patientAddress, practitionerAddress)) {
            return;
        }

        throw new UnauthorizedException();
    }

    private getProvider(): AnchorProvider {
        const network = this.configService.get<SolanaConfig>('solana').cluster;
        const wallet = new Wallet(Keypair.generate());
        const connection = new Connection(network, 'confirmed');
        const opts: ConfirmOptions = {
            preflightCommitment: "confirmed"
        };
        const provider = new AnchorProvider(connection, wallet, opts);

        return provider;
    }

    private getObjectName(walletAddress: string, name: string): string {
        return `${this.storageBasePath}/${walletAddress}/${name}`;
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
            ]
        );
    }

    private async getProfileDocumentPda(address: string, docIndex: number): Promise<PublicKey> {
        return await this.solanaService.findProgramAddress(
            VAULT_IDL.metadata.address,
            [
                utils.bytes.utf8.encode(PROFILE_DOCUMENT_PDA_SEED),
                new PublicKey(address).toBuffer(),
                utils.bytes.utf8.encode(docIndex.toString()),
            ]
        );
    }

    private async getProfileDocumentSharePda(documentPda: PublicKey, invitee: PublicKey): Promise<PublicKey> {
        return await this.solanaService.findProgramAddress(
            VAULT_IDL.metadata.address,
            [
                documentPda.toBuffer(),
                utils.bytes.utf8.encode(PROFILE_DOCUMENT_SHARE_PDA_SEED),
                invitee.toBuffer(),
            ]
        );
    }
}