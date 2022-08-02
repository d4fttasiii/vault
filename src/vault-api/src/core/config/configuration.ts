import { Config } from '../models/config';

export const VaultConfig = (): Config => ({
    app: {
        port: process.env.VAULT_APP_PORT ? parseInt(process.env.VAULT_APP_PORT, 10) : 3000,
    },
    solana: {
        cluster: process.env.VAULT_SOLANA_CLUSTER || 'https://api.devnet.solana.com',
    },
    mongoDb: {
        endpoint: process.env.VAULT_MONGODB_ENDPOINT || 'mongodb://mongo:mongo@localhost:27017',
        ssl: process.env.VAULT_MONGODB_SSL == 'true',
        dbName: process.env.VAULT_MONGODB_DB_NAME || 'vault'
    },
    ipfs: {
        bucket: process.env.VAULT_S3_BUCKET || 'ipfs',
        endpoint: process.env.VAULT_S3_ENDPOINT || 'localhost',
        port: process.env.VAULT_S3_PORT ? parseInt(process.env.VAULT_S3_PORT, 10) : 9000,
        useSsl: process.env.VAULT_S3_SSL == 'true',
        accessKey: process.env.VAULT_S3_ACCESSKEY || 'root',
        secretKey: process.env.VAULT_S3_SECRETKEY || 'Seecr3tK3Y',
    },
    redis: {
        host: process.env.VAULT_REDIS_URL || 'localhost',
        port: process.env.VAULT_REDIS_PORT ?
            parseInt(process.env.VAULT_REDIS_PORT, 10) :
            6379,
        password: process.env.VAULT_REDIS_PASSWORD,
    },
    jwt: {
        secretKey: process.env.VAULT_JWT_SECRET || 'S3cr3t',
        expiration: process.env.VAULT_JWT_EXPIRATION || '3600s',
    },
});