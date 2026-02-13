export interface DatabaseConfig {
  uri: string;
  options: {
    maxPoolSize: number;
    minPoolSize: number;
    connectTimeoutMS: number;
    socketTimeoutMS: number;
  };
}

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiration: string;
  refreshTokenExpiration: string;
}

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number; // in milliseconds
  domain?: string;
  path: string;
}

export interface SecurityConfig {
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  csrf: {
    enabled: boolean;
    secret?: string;
  };
  cookies: {
    accessToken: CookieConfig;
    refreshToken: CookieConfig;
  };
}

export interface EmailConfig {
  from: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      password: string;
    };
  };
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  credentialsPath?: string;
  storageBucket?: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface DiskStorageConfig {
  uploadPath: string;
  baseUrl: string;
}

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface StorageConfig {
  provider: 'disk' | 's3';
  disk?: DiskStorageConfig;
  s3?: S3StorageConfig;
}

export interface AppConfig {
  port: number;
  env: string;
  apiVersion: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  security: SecurityConfig;
  email: EmailConfig;
  firebase?: FirebaseConfig;
  adminUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  redis: RedisConfig;
  storage: StorageConfig;
}
