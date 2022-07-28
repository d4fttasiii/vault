import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { VaultConfig } from './config/configuration';
import { S3Service } from './services/s3.service';
import { SolanaService } from './services/solana.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [VaultConfig],
            isGlobal: false,
        })
    ],
    providers: [SolanaService, S3Service],
    exports: [SolanaService, S3Service]
})
export class CoreModule { }
