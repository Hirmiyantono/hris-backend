import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Currency Entity
 *
 * Represents a currency with ISO 4217 currency code, name, and symbol.
 * Used for multi-currency support in payroll and salary management.
 *
 * Requirements: 4.1, 4.2
 */
@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ISO 4217 currency code (e.g., USD, EUR, IDR)
   * Must be exactly 3 uppercase letters
   * Unique constraint enforced at database level
   */
  @Column({
    name: 'currency_code',
    type: 'varchar',
    length: 3,
    unique: true,
  })
  currencyCode!: string;

  /**
   * Full currency name (e.g., "US Dollar", "Euro", "Indonesian Rupiah")
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 100,
  })
  name!: string;

  /**
   * Currency symbol (e.g., "$", "€", "Rp")
   */
  @Column({
    name: 'symbol',
    type: 'varchar',
    length: 10,
  })
  symbol!: string;

  /**
   * Number of decimal places (0-4)
   * E.g., 2 for USD (cents), 0 for IDR (no decimal)
   */
  @Column({
    name: 'decimal_precision',
    type: 'tinyint',
    default: 2,
  })
  decimalPrecision!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
