import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CurrencyRepository } from './repositories/currency.repository';
import { ExchangeRateRepository } from './repositories/exchange-rate.repository';
import { CurrencyService } from './services/currency.service';
import { CurrencyController } from './controllers/currency.controller';

/**
 * Core HR Module
 * Handles Company, Branch, Department, Position, Employee, Currency, and ExchangeRate management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Currency, ExchangeRate])],
  controllers: [CurrencyController],
  providers: [CurrencyRepository, ExchangeRateRepository, CurrencyService],
  exports: [CurrencyRepository, ExchangeRateRepository, CurrencyService],
})
export class CoreHrModule {}
