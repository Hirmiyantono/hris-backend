import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRateRepository } from './exchange-rate.repository';

/**
 * ExchangeRateRepository Unit Tests
 *
 * Tests repository methods for exchange rate data access
 */
describe('ExchangeRateRepository', () => {
  let repository: ExchangeRateRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<ExchangeRate>>;

  beforeEach(async () => {
    // Create mock TypeORM repository
    mockTypeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateRepository,
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<ExchangeRateRepository>(ExchangeRateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find exchange rate by id', async () => {
      const mockExchangeRate: ExchangeRate = {
        id: '123',
        sourceCurrencyCode: 'USD',
        targetCurrencyCode: 'IDR',
        rate: 15000,
        effectiveDate: new Date('2024-01-01'),
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTypeOrmRepository.findOne.mockResolvedValue(mockExchangeRate);

      const result = await repository.findById('123');

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toEqual(mockExchangeRate);
    });
  });

  describe('findByPairAndDate', () => {
    it('should find exchange rate by currency pair and effective date', async () => {
      const effectiveDate = new Date('2024-01-01');
      const mockExchangeRate: ExchangeRate = {
        id: '123',
        sourceCurrencyCode: 'USD',
        targetCurrencyCode: 'IDR',
        rate: 15000,
        effectiveDate,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTypeOrmRepository.findOne.mockResolvedValue(mockExchangeRate);

      const result = await repository.findByPairAndDate('USD', 'IDR', effectiveDate);

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: {
          sourceCurrencyCode: 'USD',
          targetCurrencyCode: 'IDR',
          effectiveDate,
        },
      });
      expect(result).toEqual(mockExchangeRate);
    });
  });

  describe('findByCurrencyPair', () => {
    it('should find all exchange rates for a currency pair ordered by date', async () => {
      const mockExchangeRates: ExchangeRate[] = [
        {
          id: '123',
          sourceCurrencyCode: 'USD',
          targetCurrencyCode: 'IDR',
          rate: 15500,
          effectiveDate: new Date('2024-02-01'),
          createdBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '124',
          sourceCurrencyCode: 'USD',
          targetCurrencyCode: 'IDR',
          rate: 15000,
          effectiveDate: new Date('2024-01-01'),
          createdBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTypeOrmRepository.find.mockResolvedValue(mockExchangeRates);

      const result = await repository.findByCurrencyPair('USD', 'IDR');

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          sourceCurrencyCode: 'USD',
          targetCurrencyCode: 'IDR',
        },
        order: { effectiveDate: 'DESC' },
      });
      expect(result).toEqual(mockExchangeRates);
    });
  });

  describe('findEffectiveRate', () => {
    it('should find the most recent rate not after the given date', async () => {
      const asOfDate = new Date('2024-01-15');
      const mockExchangeRate: ExchangeRate = {
        id: '123',
        sourceCurrencyCode: 'USD',
        targetCurrencyCode: 'IDR',
        rate: 15000,
        effectiveDate: new Date('2024-01-01'),
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockExchangeRate),
      };

      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findEffectiveRate('USD', 'IDR', asOfDate);

      expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('exchange_rate');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'exchange_rate.source_currency_code = :sourceCurrencyCode',
        { sourceCurrencyCode: 'USD' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exchange_rate.target_currency_code = :targetCurrencyCode',
        { targetCurrencyCode: 'IDR' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exchange_rate.effective_date <= :asOfDate',
        { asOfDate },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'exchange_rate.effective_date',
        'DESC',
      );
      expect(result).toEqual(mockExchangeRate);
    });
  });

  describe('save', () => {
    it('should save an exchange rate', async () => {
      const exchangeRate: Partial<ExchangeRate> = {
        sourceCurrencyCode: 'USD',
        targetCurrencyCode: 'IDR',
        rate: 15000,
        effectiveDate: new Date('2024-01-01'),
        createdBy: 'user-123',
      };

      const savedExchangeRate: ExchangeRate = {
        id: '123',
        ...exchangeRate,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ExchangeRate;

      mockTypeOrmRepository.save.mockResolvedValue(savedExchangeRate);

      const result = await repository.save(exchangeRate as ExchangeRate);

      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(exchangeRate);
      expect(result).toEqual(savedExchangeRate);
    });
  });

  describe('create', () => {
    it('should create an exchange rate entity without persisting', () => {
      const exchangeRateData: Partial<ExchangeRate> = {
        sourceCurrencyCode: 'USD',
        targetCurrencyCode: 'IDR',
        rate: 15000,
        effectiveDate: new Date('2024-01-01'),
      };

      const createdExchangeRate = { ...exchangeRateData } as ExchangeRate;

      mockTypeOrmRepository.create.mockReturnValue(createdExchangeRate);

      const result = repository.create(exchangeRateData);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(exchangeRateData);
      expect(result).toEqual(createdExchangeRate);
    });
  });

  describe('getRepository', () => {
    it('should return the underlying TypeORM repository', () => {
      const result = repository.getRepository();
      expect(result).toBe(mockTypeOrmRepository);
    });
  });
});
