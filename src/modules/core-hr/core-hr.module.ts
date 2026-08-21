import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyRepository } from './repositories/currency.repository';
import { CurrencyService } from './services/currency.service';
import { CurrencyController } from './controllers/currency.controller';

/**
 * Core HR Module
 * Handles Company, Branch, Department, Position, Employee, and Currency management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  controllers: [CurrencyController],
  providers: [CurrencyRepository, CurrencyService],
  exports: [CurrencyRepository, CurrencyService],
})
export class CoreHrModule {}
