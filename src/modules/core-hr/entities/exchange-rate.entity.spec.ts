import { ExchangeRate } from './exchange-rate.entity';

/**
 * ExchangeRate Entity Unit Tests
 *
 * Tests ExchangeRate entity structure and validation
 */
describe('ExchangeRate Entity', () => {
  it('should create an exchange rate instance', () => {
    const exchangeRate = new ExchangeRate();
    exchangeRate.id = '123e4567-e89b-12d3-a456-426614174000';
    exchangeRate.sourceCurrencyCode = 'USD';
    exchangeRate.targetCurrencyCode = 'IDR';
    exchangeRate.rate = 15000;
    exchangeRate.effectiveDate = new Date('2024-01-01');
    exchangeRate.createdBy = 'user-123';

    expect(exchangeRate.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(exchangeRate.sourceCurrencyCode).toBe('USD');
    expect(exchangeRate.targetCurrencyCode).toBe('IDR');
    expect(exchangeRate.rate).toBe(15000);
    expect(exchangeRate.effectiveDate).toEqual(new Date('2024-01-01'));
    expect(exchangeRate.createdBy).toBe('user-123');
  });

  it('should allow nullable createdBy', () => {
    const exchangeRate = new ExchangeRate();
    exchangeRate.id = '123e4567-e89b-12d3-a456-426614174000';
    exchangeRate.sourceCurrencyCode = 'USD';
    exchangeRate.targetCurrencyCode = 'IDR';
    exchangeRate.rate = 15000;
    exchangeRate.effectiveDate = new Date('2024-01-01');
    exchangeRate.createdBy = null;

    expect(exchangeRate.createdBy).toBeNull();
  });

  it('should handle decimal rate values', () => {
    const exchangeRate = new ExchangeRate();
    exchangeRate.rate = 15000.123456;

    expect(exchangeRate.rate).toBe(15000.123456);
  });
});
