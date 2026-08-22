import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';

/**
 * ExchangeRate Repository
 *
 * Data access layer for ExchangeRate entity.
 * Provides infrastructure for exchange rate persistence and retrieval.
 *
 * Note: Business logic belongs in service layer (Task 1.8.3+)
 */
@Injectable()
export class ExchangeRateRepository {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly repository: Repository<ExchangeRate>,
  ) {}

  /**
   * Get the underlying TypeORM repository for advanced operations
   */
  getRepository(): Repository<ExchangeRate> {
    return this.repository;
  }

  /**
   * Find exchange rate by ID
   */
  async findById(id: string): Promise<ExchangeRate | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find exchange rate by currency pair and effective date
   */
  async findByPairAndDate(
    sourceCurrencyCode: string,
    targetCurrencyCode: string,
    effectiveDate: Date,
  ): Promise<ExchangeRate | null> {
    return this.repository.findOne({
      where: {
        sourceCurrencyCode,
        targetCurrencyCode,
        effectiveDate,
      },
    });
  }

  /**
   * Find all exchange rates for a specific currency pair
   * Ordered by effective date descending (most recent first)
   */
  async findByCurrencyPair(
    sourceCurrencyCode: string,
    targetCurrencyCode: string,
  ): Promise<ExchangeRate[]> {
    return this.repository.find({
      where: {
        sourceCurrencyCode,
        targetCurrencyCode,
      },
      order: { effectiveDate: 'DESC' },
    });
  }

  /**
   * Find the most recent exchange rate for a currency pair
   * that is not after the given date (effective rate for a specific date)
   */
  async findEffectiveRate(
    sourceCurrencyCode: string,
    targetCurrencyCode: string,
    asOfDate: Date,
  ): Promise<ExchangeRate | null> {
    return this.repository
      .createQueryBuilder('exchange_rate')
      .where('exchange_rate.source_currency_code = :sourceCurrencyCode', {
        sourceCurrencyCode,
      })
      .andWhere('exchange_rate.target_currency_code = :targetCurrencyCode', {
        targetCurrencyCode,
      })
      .andWhere('exchange_rate.effective_date <= :asOfDate', { asOfDate })
      .orderBy('exchange_rate.effective_date', 'DESC')
      .getOne();
  }

  /**
   * Find all exchange rates
   */
  async findAll(): Promise<ExchangeRate[]> {
    return this.repository.find({
      order: {
        sourceCurrencyCode: 'ASC',
        targetCurrencyCode: 'ASC',
        effectiveDate: 'DESC',
      },
    });
  }

  /**
   * Save exchange rate entity
   */
  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    return this.repository.save(exchangeRate);
  }

  /**
   * Create exchange rate entity (without persisting)
   */
  create(exchangeRateData: Partial<ExchangeRate>): ExchangeRate {
    return this.repository.create(exchangeRateData);
  }
}
