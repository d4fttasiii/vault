import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApiModule } from './api/api.module';
import { VaultConfig } from './core/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [VaultConfig],
      isGlobal: true,
      // envFilePath: './env/debug.env',
    }),
    ApiModule],
})
export class AppModule { }
