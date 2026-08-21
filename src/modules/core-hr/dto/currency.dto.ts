import { Currency } from '../entities/currency.entity';

/**
 * Currency Response DTO
 * Returned by GET /currencies and GET /currencies/:code
 */
export class CurrencyDto {
  /**
   * ISO 4217 currency code (3 uppercase letters)
   * @example "USD"
   */
  code!: string;

  /**
   * Full currency name
   * @example "US Dollar"
   */
  name!: string;

  /**
   * Currency display symbol
   * @example "$"
   */
  symbol!: string;

  /**
   * Number of decimal places (0-4)
   * @example 2
   */
  decimalPrecision!: number;

  constructor(currency: Currency) {
    this.code = currency.currencyCode;
    this.name = currency.name;
    this.symbol = currency.symbol;
    this.decimalPrecision = currency.decimalPrecision;
  }
}
