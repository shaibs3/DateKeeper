/**
 * @jest-environment node
 */

// Store original environment
const originalEnv = process.env.NODE_ENV;

// Mock PrismaClient
const mockPrismaInstance = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const MockPrismaClient = jest.fn(() => mockPrismaInstance);

jest.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));

describe('Prisma Client Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Reset global prisma
    delete (global as any).prisma;

    MockPrismaClient.mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Prisma Client Initialization', () => {
    it('should create a new PrismaClient with query logging', () => {
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect(MockPrismaClient).toHaveBeenCalledWith({
        log: ['query'],
      });
      expect(prisma).toBeDefined();
    });

    it('should use existing global prisma instance if available', () => {
      const mockExistingPrisma = { existing: true };
      (global as any).prisma = mockExistingPrisma;

      const { prisma } = require('../prisma');

      expect(prisma).toBe(mockExistingPrisma);
      expect(MockPrismaClient).not.toHaveBeenCalled();
    });
  });

  describe('Global Prisma Instance Management', () => {
    it('should store prisma instance globally in development environment', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect((global as any).prisma).toBe(prisma);
    });

    it('should store prisma instance globally in test environment', () => {
      process.env.NODE_ENV = 'test';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect((global as any).prisma).toBe(prisma);
    });

    it('should not store prisma instance globally in production environment', () => {
      process.env.NODE_ENV = 'production';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect((global as any).prisma).toBeUndefined();
    });

    it('should handle undefined NODE_ENV as non-production', () => {
      delete process.env.NODE_ENV;
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect((global as any).prisma).toBe(prisma);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple requires in non-production', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma: prisma1 } = require('../prisma');
      const { prisma: prisma2 } = require('../prisma');

      expect(prisma1).toBe(prisma2);
      expect(MockPrismaClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Options', () => {
    it('should configure PrismaClient with query logging enabled', () => {
      delete (global as any).prisma;

      require('../prisma');

      expect(MockPrismaClient).toHaveBeenCalledWith({
        log: ['query'],
      });
    });

    it('should maintain consistent configuration', () => {
      delete (global as any).prisma;

      require('../prisma');

      const callArgs = MockPrismaClient.mock.calls[0][0];
      expect(callArgs).toEqual({
        log: ['query'],
      });
    });
  });

  describe('Type Safety and Exports', () => {
    it('should export prisma with correct type', () => {
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });

    it('should export prisma as named export', () => {
      delete (global as any).prisma;

      const prismaModule = require('../prisma');

      expect(prismaModule).toHaveProperty('prisma');
      expect(typeof prismaModule.prisma).toBe('object');
    });

    it('should export only prisma', () => {
      delete (global as any).prisma;

      const prismaModule = require('../prisma');
      const keys = Object.keys(prismaModule);

      expect(keys).toEqual(['prisma']);
    });
  });

  describe('Environment Edge Cases', () => {
    it('should handle empty NODE_ENV string', () => {
      process.env.NODE_ENV = '';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      // Empty string is not 'production', so should store globally
      expect((global as any).prisma).toBe(prisma);
    });

    it('should handle NODE_ENV with different casing', () => {
      process.env.NODE_ENV = 'PRODUCTION';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      // Case-sensitive comparison, so 'PRODUCTION' !== 'production'
      expect((global as any).prisma).toBe(prisma);
    });

    it('should handle whitespace in NODE_ENV', () => {
      process.env.NODE_ENV = ' production ';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      // Whitespace makes it not equal to 'production'
      expect((global as any).prisma).toBe(prisma);
    });
  });

  describe('Memory Management', () => {
    it('should not create multiple PrismaClient instances in development', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      // Import multiple times
      require('../prisma');
      require('../prisma');
      require('../prisma');

      expect(MockPrismaClient).toHaveBeenCalledTimes(1);
    });

    it('should properly manage global reference', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect((global as any).prisma).toBe(prisma);
      expect((global as any).prisma).toBeTruthy();
    });
  });

  describe('Global Object Type Casting', () => {
    it('should handle global type casting correctly', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      const globalPrisma = (global as any).prisma;
      expect(globalPrisma).toBe(prisma);
    });

    it('should handle global object extension safely', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma } = require('../prisma');

      expect(typeof (global as any).prisma).toBe('object');
      expect((global as any).prisma).toBe(prisma);
    });
  });

  describe('Production vs Non-Production Behavior', () => {
    it('should behave differently in production vs development', () => {
      // Test development
      process.env.NODE_ENV = 'development';
      delete (global as any).prisma;

      const { prisma: devPrisma } = require('../prisma');
      expect((global as any).prisma).toBe(devPrisma);

      // Reset modules for fresh import
      jest.resetModules();
      delete (global as any).prisma;

      // Test production
      process.env.NODE_ENV = 'production';
      const { prisma: prodPrisma } = require('../prisma');
      expect((global as any).prisma).toBeUndefined();
    });

    it('should handle all non-production environments consistently', () => {
      const nonProdEnvs = ['development', 'test', 'staging', '', undefined];

      for (const env of nonProdEnvs) {
        jest.resetModules();
        delete (global as any).prisma;

        if (env === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = env;
        }

        const { prisma } = require('../prisma');
        expect((global as any).prisma).toBe(prisma);
      }
    });
  });
});