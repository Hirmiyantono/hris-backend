import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CurrencyService } from '../services/currency.service';
import { CurrencyDto } from '../dto/currency.dto';

/**
 * Currency Controller
 *
 * REST API endpoints for currency operations.
 * Provides read-only access to currency master data.
 *
 * Requirements: 4.1, 4.2
 */
@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * Get all currencies
   * @returns Array of currency DTOs ordered by code
   */
  @Get()
  async findAll(): Promise<CurrencyDto[]> {
    const currencies = await this.currencyService.findAll();
    return currencies.map((currency) => new CurrencyDto(currency));
  }

  /**
   * Get currency by code
   * @param code - ISO 4217 currency code (case-insensitive)
   * @returns Currency DTO
   * @throws NotFoundException if currency not found
   */
  @Get(':code')
  async findByCode(@Param('code') code: string): Promise<CurrencyDto> {
    const currency = await this.currencyService.findByCode(code);

    if (!currency) {
      throw new NotFoundException(`Currency with code "${code}" not found`);
    }

    return new CurrencyDto(currency);
  }
}
