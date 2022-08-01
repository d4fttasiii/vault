import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { VaultConfig } from './core/config/configuration';
import { ProfileModule } from './profile/profile.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './document/document.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [VaultConfig],
      isGlobal: true,
      // envFilePath: './env/debug.env',
    }),
    ProfileModule,
    StorageModule,
    AuthModule,
    DocumentModule,
    ApiModule],
})
export class AppModule { }
