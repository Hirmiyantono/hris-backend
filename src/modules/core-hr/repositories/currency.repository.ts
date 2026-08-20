import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';

/**
 * Currency Repository
 *
 * Data access layer for Currency entity.
 * Provides infrastructure for currency persistence and retrieval.
 *
 * Note: Business logic belongs in service layer (Task 1.7.3+)
 */
@Injectable()
export class CurrencyRepository {
  constructor(
    @InjectRepository(Currency)
    private readonly repository: Repository<Currency>,
  ) {}

  /**
   * Get the underlying TypeORM repository for advanced operations
   */
  getRepository(): Repository<Currency> {
    return this.repository;
  }

  /**
   * Find currency by ID
   */
  async findById(id: string): Promise<Currency | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find currency by currency code
   */
  async findByCode(currencyCode: string): Promise<Currency | null> {
    return this.repository.findOne({ where: { currencyCode } });
  }

  /**
   * Find all currencies
   */
  async findAll(): Promise<Currency[]> {
    return this.repository.find({ order: { currencyCode: 'ASC' } });
  }

  /**
   * Save currency entity
   */
  async save(currency: Currency): Promise<Currency> {
    return this.repository.save(currency);
  }

  /**
   * Create currency entity (without persisting)
   */
  create(currencyData: Partial<Currency>): Currency {
    return this.repository.create(currencyData);
  }
}
