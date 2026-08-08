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

  return validatedConfig;
}
