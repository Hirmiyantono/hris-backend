import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Create Currencies Table
 *
 * Creates the currencies table with:
 * - id (UUID primary key)
 * - currency_code (ISO 4217 code, unique)
 * - name (currency name)
 * - symbol (currency symbol)
 * - created_at, updated_at (timestamps)
 *
 * Requirements: 4.1, 4.2
 * Task: 1.7.1
 */
export class CreateCurrenciesTable1723680000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create currencies table
    await queryRunner.createTable(
      new Table({
        name: 'currencies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'currency_code',
            type: 'varchar',
            length: '3',
            isNullable: false,
            comment: 'ISO 4217 currency code (e.g., USD, EUR, IDR)',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Full currency name',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '10',
            isNullable: false,
            comment: 'Currency symbol',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create unique index on currency_code
    await queryRunner.createIndex(
      'currencies',
      new TableIndex({
        name: 'IDX_CURRENCY_CODE_UNIQUE',
        columnNames: ['currency_code'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index
    await queryRunner.dropIndex('currencies', 'IDX_CURRENCY_CODE_UNIQUE');

    // Drop currencies table
    await queryRunner.dropTable('currencies');
  }
}
