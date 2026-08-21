import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDecimalPrecisionToCurrency1723680200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'currencies',
      new TableColumn({
        name: 'decimal_precision',
        type: 'tinyint',
        unsigned: true,
        isNullable: false,
        default: 2,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('currencies', 'decimal_precision');
  }
}