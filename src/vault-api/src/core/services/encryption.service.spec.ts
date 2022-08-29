import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt file input', () => {
    const input = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
    const key = 'MySuperSecretKey';

    const encrypted = service.encrypt(input, key);
    const decrypted = service.decrypt(encrypted, key);

    expect(Buffer.compare(encrypted, input)).not.toBe(0);
    expect(Buffer.compare(decrypted, input)).toBe(0);
  });
});
