import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { JwtConfig } from 'doctive-core';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '../interfaces/jwt-payload';
import { User, UserDocument } from '../schemas';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel('USER') private userModel: Model<UserDocument>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<JwtConfig>('jwt').secretKey,
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { walletAddress } = payload;
        const user = await this.userModel.findOne({
            walletAddress: walletAddress,
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}