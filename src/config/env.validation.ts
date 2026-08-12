import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE!: string;

  @IsBoolean()
  @IsOptional()
  DB_SSL?: boolean = false;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  DB_POOL_SIZE?: number = 10;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB?: number = 0;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = new EnvironmentVariables();
  Object.assign(validatedConfig, config);

  // Transform string to number for numeric fields
  if (typeof config.DB_PORT === 'string') {
    validatedConfig.DB_PORT = parseInt(config.DB_PORT, 10);
  }
  if (typeof config.DB_POOL_SIZE === 'string') {
    validatedConfig.DB_POOL_SIZE = parseInt(config.DB_POOL_SIZE, 10);
  }
  if (typeof config.DB_SSL === 'string') {
    validatedConfig.DB_SSL = config.DB_SSL === 'true';
  }
  if (typeof config.REDIS_PORT === 'string') {
    validatedConfig.REDIS_PORT = parseInt(config.REDIS_PORT, 10);
  }
  if (typeof config.REDIS_DB === 'string') {
    validatedConfig.REDIS_DB = parseInt(config.REDIS_DB, 10);
  }

  return validatedConfig;
}
