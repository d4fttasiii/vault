import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { CoreModule } from '../core/core.module';
import { JwtConfig } from '../core/models/config';
import { PROFILE_SCHEMA } from './constants/profile-constants';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { ProfileSchema } from './schemas';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { JwtStrategy } from './strategies/jwt-strategy';

@Module({
    imports: [
        CoreModule,
        HttpModule,
        PassportModule.register({
            defaultStrategy: 'jwt',
            property: 'user',
            session: false,
        }),
        JwtModule.registerAsync({
            useFactory: (cfgService: ConfigService) => {
                const cfg = cfgService.get<JwtConfig>('jwt');
                return {
                    secret: cfg.secretKey,
                    signOptions: { expiresIn: cfg.expiration },
                };
            },
            inject: [ConfigService]
        }),
        MongooseModule.forFeature([{ name: PROFILE_SCHEMA, schema: ProfileSchema }]),
    ],
    providers: [
        ProfileService,
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
    ],
    exports: [
        ProfileService,
        AuthService,
        JwtAuthGuard,
    ]
})
export class ProfileModule { }
