import { Module } from '@nestjs/common';
import { ProfileModule } from '@profile/profile.module';
import { StorageModule } from '@storage/storage.module';

import { DocumentController } from './controllers/document.controller';
import { ProfileController } from './controllers/profile.controller';
import { ShareController } from './controllers/share.controller';

@Module({
  imports: [ProfileModule, StorageModule],
  controllers: [DocumentController, ProfileController, ShareController],
})
export class ApiModule {}
