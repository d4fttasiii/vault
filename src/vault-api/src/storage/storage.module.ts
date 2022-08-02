import { CoreModule } from '@core/core.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PROFILE_SCHEMA } from '@profile/constants/profile-constants';
import { ProfileDocumentSchema, ProfileSchema } from '@profile/schemas';

import { PROFILE_DOCUMENT_SCHEMA } from './constants/storage';
import { StorageService } from './services/storage.service';

@Module({
    imports: [
        CoreModule,
        MongooseModule.forFeature([{
            name: PROFILE_DOCUMENT_SCHEMA, schema: ProfileDocumentSchema
        }, {
            name: PROFILE_SCHEMA, schema: ProfileSchema,
        }])
    ],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }