import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountInfo,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as bip39 from 'bip39';

import { SolanaConfig } from '../models/config';

@Injectable()
export class SolanaService {
  constructor(private configService: ConfigService) {}

  public async findProgramAddress(
    programAddress: string,
    buffers: (Buffer | Uint8Array)[],
  ): Promise<PublicKey> {
    const [pda, _] = await PublicKey.findProgramAddress(
      buffers,
      new PublicKey(programAddress),
    );

    return pda;
  }

  public async accountExists(address: string): Promise<boolean> {
    this.ensureValidAddress(address);
    const client = this.getClient();
    const account = await client.getAccountInfo(new PublicKey(address));

    return !!account;
  }

  public async getAccountForMnemonic(
    mnemonic: string,
  ): Promise<AccountInfo<Buffer>> {
    const seed = (await bip39.mnemonicToSeed(mnemonic)).subarray(0, 32);
    const faucetKeypair = Keypair.fromSeed(seed);
    const client = this.getClient();
    const account = await client.getAccountInfo(
      faucetKeypair.publicKey,
      'confirmed',
    );

    return account;
  }

  public async getAccountForAddress(
    address: string,
  ): Promise<AccountInfo<Buffer>> {
    const client = this.getClient();
    const account = await client.getAccountInfo(
      new PublicKey(address),
      'confirmed',
    );

    return account;
  }

  public async sendPayment(
    fromMnemonic: string,
    toAddress: string,
    amount: number,
  ): Promise<string> {
    this.ensureValidAddress(toAddress);

    const seed = (await bip39.mnemonicToSeed(fromMnemonic)).subarray(0, 32);
    const fromKeypair = Keypair.fromSeed(seed);

    this.ensureSufficientBalance(fromKeypair.publicKey.toBase58(), amount);

    const toPubk = new PublicKey(toAddress);
    const client = this.getClient();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPubk,
        lamports: amount,
      }),
    );
    const signature = await sendAndConfirmTransaction(client, tx, [
      fromKeypair,
    ]);

    return signature;
  }

  public ensureValidAddress(address: string) {
    try {
      new PublicKey(address);
    } catch {
      throw new BadRequestException(address, 'Invalid Solana Address');
    }
  }

  public async ensureSufficientBalance(address: string, amount: number) {
    const client = this.getClient();
    const account = await client.getAccountInfo(new PublicKey(address));

    if (account && account.lamports > amount) {
      return;
    }

    throw new BadRequestException(
      address,
      `Insufficient balance: ${account?.lamports || 0}`,
    );
  }

  private getClient(): Connection {
    const cfg = this.configService.get<SolanaConfig>('solana');
    return new Connection(cfg.cluster, 'confirmed');
  }
}
