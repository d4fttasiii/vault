import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { VaultConfig } from './core/config/configuration';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [VaultConfig],
      isGlobal: true,
      // envFilePath: './env/debug.env',
    }),
    ProfileModule],
})
export class AppModule { }
