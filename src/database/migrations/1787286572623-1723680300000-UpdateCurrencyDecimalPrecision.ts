import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCurrencyDecimalPrecision1723680300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE currencies
      SET decimal_precision = CASE currency_code
        WHEN 'IDR' THEN 0
        WHEN 'JPY' THEN 0
        WHEN 'USD' THEN 2
        WHEN 'SGD' THEN 2
        WHEN 'MYR' THEN 2
        WHEN 'EUR' THEN 2
        ELSE 2
      END
      WHERE currency_code IN ('IDR', 'JPY', 'USD', 'SGD', 'MYR', 'EUR')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE currencies
      SET decimal_precision = 2
      WHERE currency_code IN ('IDR', 'JPY', 'USD', 'SGD', 'MYR', 'EUR')
    `);
  }
}