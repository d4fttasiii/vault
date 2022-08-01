import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { VaultConfig } from './config/configuration';
import { MongoDbConfig } from './models/config';
import { EncryptionService, S3Service, SolanaService } from './services/';

const services = [SolanaService, EncryptionService, S3Service];

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [VaultConfig],
            isGlobal: false,
        }),
        MongooseModule.forRootAsync({
            useFactory: (cfgService: ConfigService) => {
                const cfg = cfgService.get<MongoDbConfig>('mongoDb');

                return {
                    uri: cfg.endpoint,
                    useNewUrlParser: true,
                    autoCreate: true,
                    ssl: cfg.ssl,
                    dbName: cfg.dbName,
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [...services],
    exports: [...services]
})
export class CoreModule { }
