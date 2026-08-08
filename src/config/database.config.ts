import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false, // NEVER true - use migrations
    logging:
      configService.get<string>('NODE_ENV') === 'development'
        ? ['error', 'warn', 'migration']
        : ['error'],
    ssl: configService.get<boolean>('DB_SSL') ? { rejectUnauthorized: false } : false,
    extra: {
      connectionLimit: configService.get<number>('DB_POOL_SIZE') || 10,
      waitForConnections: true,
      queueLimit: 0,
      connectTimeout: 10000,
      acquireTimeout: 10000,
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };
};
