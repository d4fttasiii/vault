import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { StorageService } from '../services/storage.service';

@Injectable()
export class DocumentAccessGuard implements CanActivate {

  constructor(private storageService: StorageService) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const patientAddress = params.patientAddress;
    const practitionerAddress = params.practitionerAddress;

    return await this.storageService.canAccessDocuments(patientAddress, practitionerAddress);
  }
}
