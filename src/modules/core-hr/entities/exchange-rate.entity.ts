import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * ExchangeRate Entity
 *
 * Represents currency exchange rates with effective dates.
 * Used for multi-currency support in payroll and salary management.
 * Supports multiple rates for same currency pair with different effective dates.
 *
 * Requirements: 4.11, 4.12, 4.13, 4.14
 */
@Entity('exchange_rates')
@Index('IDX_EXCHANGE_RATE_COMPOSITE_UNIQUE', ['sourceCurrencyCode', 'targetCurrencyCode', 'effectiveDate'], { unique: true })
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Source currency code (ISO 4217)
   * E.g., "USD" in the conversion USD -> IDR
   * Foreign key to Currency.code
   */
  @Column({
    name: 'source_currency_code',
    type: 'varchar',
    length: 3,
  })
  sourceCurrencyCode!: string;

  /**
   * Target currency code (ISO 4217)
   * E.g., "IDR" in the conversion USD -> IDR
   * Foreign key to Currency.code
   */
  @Column({
    name: 'target_currency_code',
    type: 'varchar',
    length: 3,
  })
  targetCurrencyCode!: string;

  /**
   * Exchange rate value as positive decimal
   * E.g., 15000 means 1 USD = 15000 IDR
   * Must be positive (validated in service layer)
   */
  @Column({
    name: 'rate',
    type: 'decimal',
    precision: 20,
    scale: 6,
  })
  rate!: number;

  /**
   * Date from which this rate becomes valid
   * Used to select appropriate rate for calculations
   */
  @Column({
    name: 'effective_date',
    type: 'date',
  })
  effectiveDate!: Date;

  /**
   * User who created this exchange rate record
   * Nullable for system-generated or migration data
   */
  @Column({
    name: 'created_by',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
