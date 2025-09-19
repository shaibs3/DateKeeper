/**
 * @jest-environment node
 */

// Mock process.env and process.uptime
const originalEnv = process.env;
const originalUptime = process.uptime;

// Import after mocks
import { GET } from '../route';

describe('/api/health/basic', () => {
  beforeEach(() => {
    // Reset env to original state
    process.env = { ...originalEnv };

    // Mock process.uptime to return consistent value for testing
    process.uptime = jest.fn().mockReturnValue(123.456);
  });

  afterAll(() => {
    process.env = originalEnv;
    process.uptime = originalUptime;
  });

  describe('GET /api/health/basic', () => {
    it('should return basic health status with all environment variables', async () => {
      process.env.APP_ENV = 'production';
      process.env.npm_package_version = '1.2.3';

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'production',
        version: '1.2.3',
        uptime: 123.456,
      });
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should use default values when environment variables are missing', async () => {
      delete process.env.APP_ENV;
      delete process.env.npm_package_version;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'local',
        version: 'unknown',
        uptime: 123.456,
      });
      expect(data.timestamp).toBeDefined();
    });

    it('should handle different APP_ENV values correctly', async () => {
      const environments = ['local', 'development', 'staging', 'production', 'test'];

      for (const env of environments) {
        process.env.APP_ENV = env;

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.environment).toBe(env);
        expect(data.status).toBe('healthy');
      }
    });

    it('should return valid ISO timestamp', async () => {
      const beforeCall = new Date().toISOString();

      const response = await GET();
      const data = await response.json();

      const afterCall = new Date().toISOString();

      expect(data.timestamp).toBeDefined();
      expect(data.timestamp >= beforeCall).toBe(true);
      expect(data.timestamp <= afterCall).toBe(true);

      // Verify it's a valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('should include process uptime', async () => {
      // Mock different uptime values
      process.uptime = jest.fn().mockReturnValue(987.654);

      const response = await GET();
      const data = await response.json();

      expect(data.uptime).toBe(987.654);
      expect(typeof data.uptime).toBe('number');
    });

    it('should handle empty string environment variables', async () => {
      process.env.APP_ENV = '';
      process.env.npm_package_version = '';

      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBe('local');
      expect(data.version).toBe('unknown');
    });

    it('should always return status healthy', async () => {
      // Test multiple calls to ensure consistent behavior
      for (let i = 0; i < 5; i++) {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
      }
    });

    it('should handle very long uptime values', async () => {
      const longUptime = 86400 * 30; // 30 days in seconds
      process.uptime = jest.fn().mockReturnValue(longUptime);

      const response = await GET();
      const data = await response.json();

      expect(data.uptime).toBe(longUptime);
      expect(response.status).toBe(200);
    });
  });
});
