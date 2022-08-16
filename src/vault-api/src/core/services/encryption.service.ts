import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  encrypt(content: Buffer, key: string): Buffer {
    const encrypted = this.encryptString(content.toString('hex'), key);
    return Buffer.from(encrypted);
  }

  decrypt(cypher: Buffer, key: string): Buffer {
    const decrypted = this.decryptString(cypher.toString(), key);
    return Buffer.from(decrypted, 'hex');
  }

  encryptString(content: string, key: string): string {
    const encrypted = CryptoJS.AES.encrypt(content, key, {
      format: new JsonFormatter(),
    });
    return encrypted.toString();
  }

  decryptString(cypher: string, key: string): string {
    return CryptoJS.AES.decrypt(cypher, key, {
      format: new JsonFormatter(),
    }).toString(CryptoJS.enc.Utf8);
  }
}

class JsonFormatter {
  stringify(cipherParams) {
    // create json object with ciphertext
    var jsonObj: any = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    };

    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }

    // stringify json object
    return JSON.stringify(jsonObj);
  }

  parse(jsonStr) {
    // parse json string
    var jsonObj = JSON.parse(jsonStr);

    // extract ciphertext from json object, and create cipher params object
    var cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct),
    });

    // optionally extract iv or salt

    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }

    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }

    return cipherParams;
  }
}
