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

  // Queue concurrency configuration (Task 1.5)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  QUEUE_PAYROLL_CONCURRENCY?: number = 2;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  QUEUE_NOTIFICATION_CONCURRENCY?: number = 10;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  QUEUE_REPORT_CONCURRENCY?: number = 3;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  QUEUE_MAINTENANCE_CONCURRENCY?: number = 1;
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
  if (typeof config.QUEUE_PAYROLL_CONCURRENCY === 'string') {
    validatedConfig.QUEUE_PAYROLL_CONCURRENCY = parseInt(config.QUEUE_PAYROLL_CONCURRENCY, 10);
  }
  if (typeof config.QUEUE_NOTIFICATION_CONCURRENCY === 'string') {
    validatedConfig.QUEUE_NOTIFICATION_CONCURRENCY = parseInt(
      config.QUEUE_NOTIFICATION_CONCURRENCY,
      10,
    );
  }
  if (typeof config.QUEUE_REPORT_CONCURRENCY === 'string') {
    validatedConfig.QUEUE_REPORT_CONCURRENCY = parseInt(config.QUEUE_REPORT_CONCURRENCY, 10);
  }
  if (typeof config.QUEUE_MAINTENANCE_CONCURRENCY === 'string') {
    validatedConfig.QUEUE_MAINTENANCE_CONCURRENCY = parseInt(
      config.QUEUE_MAINTENANCE_CONCURRENCY,
      10,
    );
  }

  return validatedConfig;
}
