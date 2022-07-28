export interface Config {
    app: AppConfig;
    solana: SolanaConfig;
    ipfs: IPFSConfig;
    redis: RedisConfig;
    jwt?: JwtConfig;
    mongoDb: MongoDbConfig;
    network?: NetworkConfig;
}

export interface AppConfig {
    port: number;
}

export interface SolanaConfig {
    cluster: string;
}

export interface IPFSConfig {
    bucket: string;
    endpoint: string;
    port: number;
    useSsl: boolean;
    accessKey: string;
    secretKey: string;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

export interface JwtConfig {
    secretKey: string;
    expiration: string;
}

export interface MongoDbConfig {
    endpoint: string;
    user?: string;
    pass?: string;
    ssl: boolean;
}

export interface NetworkConfig {
    storageApiUrl: string;
    storageApiKey: string;
}