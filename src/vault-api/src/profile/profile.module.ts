import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { CoreModule } from '../core/core.module';
import { JwtConfig, MongoDbConfig } from '../core/models/config';
import { PROFILE_SCHEMA } from './constants/profile-constants';
import { ProfileSchema } from './schemas';

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
        MongooseModule.forRootAsync({
            useFactory: (cfgService: ConfigService) => {
                const cfg = cfgService.get<MongoDbConfig>('mongoDb');

                return {
                    uri: cfg.endpoint,
                    useNewUrlParser: true,
                    autoCreate: true,
                    ssl: cfg.ssl,
                    dbName: 'vault',
                };
            },
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([{ name: PROFILE_SCHEMA, schema: ProfileSchema }]),
    ]
})
export class ProfileModule { }
