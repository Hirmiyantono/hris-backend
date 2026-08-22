import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * Migration: Create Exchange Rates Table
 *
 * Creates the exchange_rates table with:
 * - id (UUID primary key)
 * - source_currency_code (foreign key to currencies.currency_code)
 * - target_currency_code (foreign key to currencies.currency_code)
 * - rate (decimal exchange rate value)
 * - effective_date (date from which rate is valid)
 * - created_by (user who created the rate, nullable)
 * - created_at, updated_at (timestamps)
 * - Composite unique index on (source_currency_code, target_currency_code, effective_date)
 *
 * Requirements: 4.11, 4.12, 4.13, 4.14
 * Task: 1.8.1
 */
export class CreateExchangeRatesTable1723680400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create exchange_rates table
    await queryRunner.createTable(
      new Table({
        name: 'exchange_rates',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'source_currency_code',
            type: 'varchar',
            length: '3',
            isNullable: false,
            comment: 'Source currency ISO 4217 code (e.g., USD)',
          },
          {
            name: 'target_currency_code',
            type: 'varchar',
            length: '3',
            isNullable: false,
            comment: 'Target currency ISO 4217 code (e.g., IDR)',
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 20,
            scale: 6,
            isNullable: false,
            comment: 'Exchange rate value (e.g., 15000 for 1 USD = 15000 IDR)',
          },
          {
            name: 'effective_date',
            type: 'date',
            isNullable: false,
            comment: 'Date from which this rate becomes valid',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'User ID who created this rate',
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

    // Create composite unique index on (source_currency_code, target_currency_code, effective_date)
    // This ensures no duplicate rates for the same currency pair on the same date
    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATE_COMPOSITE_UNIQUE',
        columnNames: [
          'source_currency_code',
          'target_currency_code',
          'effective_date',
        ],
        isUnique: true,
      }),
    );

    // Create index on source_currency_code for faster lookups
    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATE_SOURCE_CURRENCY',
        columnNames: ['source_currency_code'],
      }),
    );

    // Create index on target_currency_code for faster lookups
    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATE_TARGET_CURRENCY',
        columnNames: ['target_currency_code'],
      }),
    );

    // Create index on effective_date for date-based queries
    await queryRunner.createIndex(
      'exchange_rates',
      new TableIndex({
        name: 'IDX_EXCHANGE_RATE_EFFECTIVE_DATE',
        columnNames: ['effective_date'],
      }),
    );

    // Create foreign key from source_currency_code to currencies.currency_code
    await queryRunner.createForeignKey(
      'exchange_rates',
      new TableForeignKey({
        name: 'FK_EXCHANGE_RATE_SOURCE_CURRENCY',
        columnNames: ['source_currency_code'],
        referencedTableName: 'currencies',
        referencedColumnNames: ['currency_code'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Create foreign key from target_currency_code to currencies.currency_code
    await queryRunner.createForeignKey(
      'exchange_rates',
      new TableForeignKey({
        name: 'FK_EXCHANGE_RATE_TARGET_CURRENCY',
        columnNames: ['target_currency_code'],
        referencedTableName: 'currencies',
        referencedColumnNames: ['currency_code'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey(
      'exchange_rates',
      'FK_EXCHANGE_RATE_TARGET_CURRENCY',
    );
    await queryRunner.dropForeignKey(
      'exchange_rates',
      'FK_EXCHANGE_RATE_SOURCE_CURRENCY',
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'exchange_rates',
      'IDX_EXCHANGE_RATE_EFFECTIVE_DATE',
    );
    await queryRunner.dropIndex(
      'exchange_rates',
      'IDX_EXCHANGE_RATE_TARGET_CURRENCY',
    );
    await queryRunner.dropIndex(
      'exchange_rates',
      'IDX_EXCHANGE_RATE_SOURCE_CURRENCY',
    );
    await queryRunner.dropIndex(
      'exchange_rates',
      'IDX_EXCHANGE_RATE_COMPOSITE_UNIQUE',
    );

    // Drop table
    await queryRunner.dropTable('exchange_rates');
  }
}
