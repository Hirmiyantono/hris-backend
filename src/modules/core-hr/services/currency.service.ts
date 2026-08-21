import { Injectable } from '@nestjs/common';
import { CurrencyRepository } from '../repositories/currency.repository';
import { Currency } from '../entities/currency.entity';

/**
 * Currency Service
 *
 * Business logic layer for currency operations.
 * Provides methods to retrieve currency information for multi-currency support.
 *
 * Requirements: 4.1, 4.2
 */
@Injectable()
export class CurrencyService {
  constructor(private readonly currencyRepository: CurrencyRepository) {}

  /**
   * Get all currencies ordered by code
   * @returns Array of all currencies
   */
  async findAll(): Promise<Currency[]> {
    return this.currencyRepository.findAll();
  }

  /**
   * Get currency by ISO 4217 code
   * Case-insensitive lookup (USD, usd, UsD all work)
   *
   * @param code - ISO 4217 currency code
   * @returns Currency entity or null if not found
   */
  async findByCode(code: string): Promise<Currency | null> {
    // Normalize to uppercase for case-insensitive lookup
    const normalizedCode = code.toUpperCase().trim();

    // Validate format: exactly 3 letters
    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      return null;
    }

    return this.currencyRepository.findByCode(normalizedCode);
  }
}
