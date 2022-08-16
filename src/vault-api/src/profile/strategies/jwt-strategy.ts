import { JwtConfig } from '@core/models/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ProfileService } from '@profile/services/profile.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '../interfaces/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private profileService: ProfileService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<JwtConfig>('jwt').secretKey,
    });
  }

  async validate(payload: JwtPayload) {
    const { walletAddress } = payload;
    const profile = await this.profileService.get(walletAddress);

    if (!profile) {
      throw new UnauthorizedException();
    }

    return profile;
  }
}
