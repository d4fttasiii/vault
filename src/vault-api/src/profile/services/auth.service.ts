import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';

import { JwtPayload } from '../interfaces/jwt-payload';
import { Session } from '../schemas';
import { ProfileService } from './profile.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtTokenService: JwtService,
        private userService: ProfileService) { }

    async signIn(walletAddress: string, signature: string): Promise<any> {
        const user = await this.userService.get(walletAddress);

        if (user && user.session && !user.session.used && this.verifySignature(walletAddress, user.session.message, signature)) {
            const payload: JwtPayload = { walletAddress: user.walletAddress };
            user.session.used = true;
            await user.save();

            return {
                access_token: this.jwtTokenService.sign(payload),
            };
        }

        throw new UnauthorizedException();
    }

    async verifyJwt(token: string): Promise<boolean> {
        let isValid: boolean = false;
        try {
            const payload = await this.jwtTokenService.verifyAsync(token);
            const { walletAddress } = payload;

            let user = await this.userService.get(walletAddress);
            if (user) {
                isValid = true;
            }
        } catch (error) {
            throw new UnauthorizedException();
        }

        return isValid;
    }

    async generateMessage(walletAddress: string): Promise<string> {
        const user = await this.userService.get(walletAddress);
        if (!user) {
            throw new UnauthorizedException();
        }
        const session = new Session();
        session.message = uuidv4();
        session.used = false;
        user.session = session;
        await user.save();

        return session.message;
    }

    private verifySignature(walletAddress: string, msg: string, signature: string): boolean {
        const signBytes = Buffer.from(signature, 'hex').subarray(0, 64);
        const publicKey = new PublicKey(walletAddress).toBytes();
        const msgBytes = Buffer.from(msg, 'utf-8');

        return nacl.sign.detached.verify(msgBytes, signBytes, publicKey);
    }
}
