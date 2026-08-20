import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyRepository } from './repositories/currency.repository';

/**
 * Core HR Module
 * Handles Company, Branch, Department, Position, Employee, and Currency management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  controllers: [],
  providers: [CurrencyRepository],
  exports: [CurrencyRepository],
})
export class CoreHrModule {}
