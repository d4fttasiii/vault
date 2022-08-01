import { CoreModule } from '@core/core.module';
import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PROFILE_SCHEMA } from '@profile/constants/profile-constants';
import { ProfileSchema } from '@profile/schemas';

import { PROFILE_DOCUMENT_SCHEMA } from './constants/storage';
import { DocumentAccessGuard } from './guards/document-access.guard';
import { ProfileDocumentSchema } from './schemas/document';
import { StorageService } from './services/storage.service';

@Module({})
export class StorageModule {

    static forRoot(): DynamicModule {
        return {
            imports: [
                CoreModule,
                MongooseModule.forFeature([{
                    name: PROFILE_DOCUMENT_SCHEMA, schema: ProfileDocumentSchema
                }, {
                    name: PROFILE_SCHEMA, schema: ProfileSchema,
                }])
            ],
            module: StorageModule,
            providers: [StorageService, DocumentAccessGuard],
            exports: [StorageService, DocumentAccessGuard],
        };
    }
}