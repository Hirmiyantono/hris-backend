import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { CurrencyRepository } from '../repositories/currency.repository';
import { Currency } from '../entities/currency.entity';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let mockRepository: {
    findAll: jest.Mock;
    findByCode: jest.Mock;
  };

  const mockCurrencies: Currency[] = [
    {
      id: '1',
      currencyCode: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimalPrecision: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      currencyCode: 'IDR',
      name: 'Indonesian Rupiah',
      symbol: 'Rp',
      decimalPrecision: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      currencyCode: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPrecision: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findByCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: CurrencyRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all currencies ordered by code', async () => {
      mockRepository.findAll.mockResolvedValue(mockCurrencies);

      const result = await service.findAll();

      expect(result).toEqual(mockCurrencies);
      expect(result).toHaveLength(3);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no currencies exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByCode', () => {
    it('should return currency when code exists', async () => {
      const usdCurrency = mockCurrencies.find((c) => c.currencyCode === 'USD')!;
      mockRepository.findByCode.mockResolvedValue(usdCurrency);

      const result = await service.findByCode('USD');

      expect(result).toEqual(usdCurrency);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should return null when currency not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      const result = await service.findByCode('XXX');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).toHaveBeenCalledWith('XXX');
    });

    it('should normalize code to uppercase', async () => {
      const usdCurrency = mockCurrencies.find((c) => c.currencyCode === 'USD')!;
      mockRepository.findByCode.mockResolvedValue(usdCurrency);

      const result = await service.findByCode('usd');

      expect(result).toEqual(usdCurrency);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should handle mixed case', async () => {
      const usdCurrency = mockCurrencies.find((c) => c.currencyCode === 'USD')!;
      mockRepository.findByCode.mockResolvedValue(usdCurrency);

      const result = await service.findByCode('UsD');

      expect(result).toEqual(usdCurrency);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should trim whitespace from code', async () => {
      const usdCurrency = mockCurrencies.find((c) => c.currencyCode === 'USD')!;
      mockRepository.findByCode.mockResolvedValue(usdCurrency);

      const result = await service.findByCode(' USD ');

      expect(result).toEqual(usdCurrency);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should return null for invalid code format - too short', async () => {
      const result = await service.findByCode('US');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).not.toHaveBeenCalled();
    });

    it('should return null for invalid code format - too long', async () => {
      const result = await service.findByCode('USDT');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).not.toHaveBeenCalled();
    });

    it('should return null for invalid code format - empty string', async () => {
      const result = await service.findByCode('');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).not.toHaveBeenCalled();
    });

    it('should return null for invalid code format - numbers', async () => {
      const result = await service.findByCode('123');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).not.toHaveBeenCalled();
    });

    it('should return null for invalid code format - special characters', async () => {
      const result = await service.findByCode('US$');

      expect(result).toBeNull();
      expect(mockRepository.findByCode).not.toHaveBeenCalled();
    });
  });
});
