import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Seed Currency Master Data
 *
 * Seeds the currencies table with initial ISO 4217 currencies:
 * - IDR (Indonesian Rupiah) - Default for Indonesian operations
 * - USD (US Dollar)
 * - SGD (Singapore Dollar)
 * - MYR (Malaysian Ringgit)
 * - EUR (Euro)
 * - JPY (Japanese Yen)
 *
 * Idempotent: Uses INSERT IGNORE to prevent duplicate entries on re-run.
 *
 * Requirements: 4.1, 4.2
 * Task: 1.7.2
 */
export class SeedCurrencyMaster1723680100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert currencies using INSERT IGNORE to ensure idempotency
    // If a currency with the same currency_code exists, it will be skipped
    await queryRunner.query(`
      INSERT IGNORE INTO currencies (id, currency_code, name, symbol, created_at, updated_at)
      VALUES
        (UUID(), 'IDR', 'Indonesian Rupiah', 'Rp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (UUID(), 'USD', 'US Dollar', '$', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (UUID(), 'SGD', 'Singapore Dollar', 'S$', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (UUID(), 'MYR', 'Malaysian Ringgit', 'RM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (UUID(), 'EUR', 'Euro', '€', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (UUID(), 'JPY', 'Japanese Yen', '¥', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded currencies
    await queryRunner.query(`
      DELETE FROM currencies
      WHERE currency_code IN ('IDR', 'USD', 'SGD', 'MYR', 'EUR', 'JPY')
    `);
  }
}
