/**
 * @jest-environment node
 */

// Mock external dependencies first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      count: jest.fn(),
    },
    dateEvent: {
      count: jest.fn(),
    },
  },
}));

// Mock process.env
const originalEnv = process.env;

// Import after mocks
import { GET } from '../route';
import { prisma } from '@/lib/prisma';

// Cast mocked functions for TypeScript
const mockConnect = prisma.$connect as any;
const mockDisconnect = prisma.$disconnect as any;
const mockUserCount = prisma.user.count as any;
const mockEventCount = prisma.dateEvent.count as any;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env to original state
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/health', () => {
    it('should return basic health check when DATABASE_URL is not configured', async () => {
      delete process.env.DATABASE_URL;
      process.env.APP_ENV = 'test';
      process.env.npm_package_version = '1.0.0';

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'test',
        version: '1.0.0',
        database: {
          connected: false,
          note: 'DATABASE_URL not configured - basic health check only',
        },
      });
      expect(data.timestamp).toBeDefined();

      // Should not attempt database operations
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUserCount).not.toHaveBeenCalled();
      expect(mockEventCount).not.toHaveBeenCalled();
    });

    it('should return successful health check with database stats when connected', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.APP_ENV = 'production';
      process.env.npm_package_version = '2.1.0';

      mockConnect.mockResolvedValue(undefined);
      mockDisconnect.mockResolvedValue(undefined);
      mockUserCount.mockResolvedValue(42);
      mockEventCount.mockResolvedValue(158);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'production',
        version: '2.1.0',
        database: {
          connected: true,
          users: 42,
          events: 158,
        },
      });
      expect(data.timestamp).toBeDefined();

      // Should perform database operations
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockUserCount).toHaveBeenCalledTimes(1);
      expect(mockEventCount).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should return degraded status when database connection fails', async () => {
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@localhost:5432/invalid';
      process.env.APP_ENV = 'staging';

      const connectionError = new Error('Connection refused');
      mockConnect.mockRejectedValue(connectionError);
      mockDisconnect.mockResolvedValue(undefined);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        status: 'degraded',
        environment: 'staging',
        database: {
          connected: false,
          error: 'Connection refused',
        },
      });
      expect(data.timestamp).toBeDefined();

      // Should attempt connection but fail before stats
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockUserCount).not.toHaveBeenCalled();
      expect(mockEventCount).not.toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should return degraded status when database stats query fails', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      mockConnect.mockResolvedValue(undefined);
      mockDisconnect.mockResolvedValue(undefined);
      mockUserCount.mockRejectedValue(new Error('Table does not exist'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({
        status: 'degraded',
        database: {
          connected: false,
          error: 'Table does not exist',
        },
      });

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockUserCount).toHaveBeenCalledTimes(1);
      expect(mockEventCount).not.toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should use default values for missing environment variables', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.APP_ENV;
      delete process.env.npm_package_version;

      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBe('local');
      expect(data.version).toBe('unknown');
    });

    it('should handle non-Error exceptions gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      mockConnect.mockRejectedValue('String error instead of Error object');
      mockDisconnect.mockResolvedValue(undefined);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.database.error).toBe('Unknown error');
    });

    it('should ensure database disconnect is called even on success', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      mockConnect.mockResolvedValue(undefined);
      mockUserCount.mockResolvedValue(5);
      mockEventCount.mockResolvedValue(10);
      mockDisconnect.mockResolvedValue(undefined);

      await GET();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should ensure database disconnect is called even on error', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      mockConnect.mockRejectedValue(new Error('Connection failed'));
      mockDisconnect.mockResolvedValue(undefined);

      await GET();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});