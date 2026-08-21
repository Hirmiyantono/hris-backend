import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from '../services/currency.service';
import { Currency } from '../entities/currency.entity';
import { CurrencyDto } from '../dto/currency.dto';

describe('CurrencyController', () => {
  let controller: CurrencyController;
  let mockService: {
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
    mockService = {
      findAll: jest.fn(),
      findByCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [
        {
          provide: CurrencyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CurrencyController>(CurrencyController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /currencies', () => {
    it('should return all currencies as DTOs', async () => {
      mockService.findAll.mockResolvedValue(mockCurrencies);

      const result = await controller.findAll();

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(CurrencyDto);
      expect(result[0].code).toBe('EUR');
      expect(result[0].name).toBe('Euro');
      expect(result[0].symbol).toBe('€');
      expect(result[0].decimalPrecision).toBe(2);
      expect(mockService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no currencies', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(mockService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should map entity fields to DTO fields correctly', async () => {
      mockService.findAll.mockResolvedValue([mockCurrencies[1]]); // IDR

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('IDR'); // currencyCode → code
      expect(result[0].name).toBe('Indonesian Rupiah');
      expect(result[0].symbol).toBe('Rp');
      expect(result[0].decimalPrecision).toBe(0);
      // Ensure internal fields are not exposed
      expect(result[0]).not.toHaveProperty('id');
      expect(result[0]).not.toHaveProperty('currencyCode');
      expect(result[0]).not.toHaveProperty('createdAt');
      expect(result[0]).not.toHaveProperty('updatedAt');
    });

    it('should include decimalPrecision for all currencies', async () => {
      mockService.findAll.mockResolvedValue(mockCurrencies);

      const result = await controller.findAll();

      result.forEach((dto) => {
        expect(dto).toHaveProperty('decimalPrecision');
        expect(typeof dto.decimalPrecision).toBe('number');
      });
    });
  });

  describe('GET /currencies/:code', () => {
    it('should return currency DTO when found', async () => {
      const usdCurrency = mockCurrencies[2];
      mockService.findByCode.mockResolvedValue(usdCurrency);

      const result = await controller.findByCode('USD');

      expect(result).toBeInstanceOf(CurrencyDto);
      expect(result.code).toBe('USD');
      expect(result.name).toBe('US Dollar');
      expect(result.symbol).toBe('$');
      expect(result.decimalPrecision).toBe(2);
      expect(mockService.findByCode).toHaveBeenCalledWith('USD');
    });

    it('should throw NotFoundException when currency not found', async () => {
      mockService.findByCode.mockResolvedValue(null);

      await expect(controller.findByCode('XXX')).rejects.toThrow(NotFoundException);
      await expect(controller.findByCode('XXX')).rejects.toThrow(
        'Currency with code "XXX" not found',
      );
      expect(mockService.findByCode).toHaveBeenCalledWith('XXX');
    });

    it('should include symbol in response', async () => {
      const eurCurrency = mockCurrencies[0];
      mockService.findByCode.mockResolvedValue(eurCurrency);

      const result = await controller.findByCode('EUR');

      expect(result.symbol).toBe('€');
      expect(result).toHaveProperty('symbol');
    });

    it('should include decimalPrecision in response', async () => {
      const idrCurrency = mockCurrencies[1];
      mockService.findByCode.mockResolvedValue(idrCurrency);

      const result = await controller.findByCode('IDR');

      expect(result.decimalPrecision).toBe(0);
      expect(result).toHaveProperty('decimalPrecision');
    });

    it('should map currencyCode to code in DTO', async () => {
      const usdCurrency = mockCurrencies[2];
      mockService.findByCode.mockResolvedValue(usdCurrency);

      const result = await controller.findByCode('USD');

      expect(result.code).toBe('USD');
      expect(result).toHaveProperty('code');
      expect(result).not.toHaveProperty('currencyCode');
    });

    it('should not expose internal fields in response', async () => {
      const usdCurrency = mockCurrencies[2];
      mockService.findByCode.mockResolvedValue(usdCurrency);

      const result = await controller.findByCode('USD');

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should handle case-insensitive lookup through service', async () => {
      const usdCurrency = mockCurrencies[2];
      mockService.findByCode.mockResolvedValue(usdCurrency);

      const result = await controller.findByCode('usd');

      expect(result.code).toBe('USD');
      expect(mockService.findByCode).toHaveBeenCalledWith('usd');
    });
  });
});
