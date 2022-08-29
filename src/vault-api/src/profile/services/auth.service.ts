import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';

import { JwtPayload } from '../interfaces/jwt-payload';
import { AuthMessage } from '../schemas';
import { ProfileService } from './profile.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtTokenService: JwtService,
    private profileService: ProfileService,
  ) {}

  async signIn(walletAddress: string, signature: string): Promise<any> {
    const user = await this.profileService.get(walletAddress);

    if (
      user &&
      user.lastAuthMessage &&
      !user.lastAuthMessage.used &&
      this.verifySignature(
        walletAddress,
        user.lastAuthMessage.message,
        signature,
      )
    ) {
      const payload: JwtPayload = { walletAddress: user.walletAddress };
      user.lastAuthMessage.used = true;
      await user.save();

      return {
        access_token: this.jwtTokenService.sign(payload),
      };
    }

    throw new UnauthorizedException();
  }

  async verifyJwt(token: string): Promise<boolean> {
    let isValid = false;
    try {
      const payload = await this.jwtTokenService.verifyAsync(token);
      const { walletAddress } = payload;

      const profile = await this.profileService.get(walletAddress);
      if (profile) {
        isValid = true;
      }
    } catch (error) {
      throw new UnauthorizedException();
    }

    return isValid;
  }

  async generateMessage(walletAddress: string): Promise<string> {
    const profile = await this.profileService.get(walletAddress);
    if (!profile) {
      throw new UnauthorizedException();
    }
    const session = new AuthMessage();
    session.message = uuidv4();
    session.used = false;
    profile.lastAuthMessage = session;
    await profile.save();

    return session.message;
  }

  private verifySignature(
    walletAddress: string,
    msg: string,
    signature: string,
  ): boolean {
    const signBytes = Buffer.from(signature, 'hex').subarray(0, 64);
    const publicKey = new PublicKey(walletAddress).toBytes();
    const msgBytes = Buffer.from(msg, 'utf-8');

    return nacl.sign.detached.verify(msgBytes, signBytes, publicKey);
  }
}
