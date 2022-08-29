import { Injectable } from '@nestjs/common';
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-ctr';

  encrypt(content: Buffer, key: string): Buffer {
    const iv = randomBytes(16);
    const keyHash = createHash('sha256')
      .update(key)
      .digest('base64')
      .substr(0, 32);
    const cipher = createCipheriv(this.algorithm, keyHash, iv);
    return Buffer.concat([iv, cipher.update(content), cipher.final()]);
  }

  decrypt(encrypted: Buffer, key: string): Buffer {
    const iv = encrypted.slice(0, 16);
    encrypted = encrypted.slice(16);
    const keyHash = createHash('sha256')
      .update(key)
      .digest('base64')
      .substr(0, 32);
    const decipher = createDecipheriv(this.algorithm, keyHash, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
