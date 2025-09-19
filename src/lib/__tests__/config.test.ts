/**
 * @jest-environment node
 */

import {
  config,
  validateEnvironment,
  isLocal,
  isDevelopmentEnv,
  isStaging,
  isProduction,
  isDevelopment,
  isProductive,
} from '../config';

// Store original environment
const originalEnv = process.env;

describe('config', () => {
  beforeEach(() => {
    // Reset environment to original state before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    it('should use default values when environment variables are not set', () => {
      // Clear specific env vars
      delete (process.env as any).NODE_ENV;
      delete process.env.APP_ENV;
      delete process.env.APP_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.EMAIL_FROM;

      // Re-import to get fresh config
      const { config: freshConfig } = require('../config');

      expect(freshConfig.NODE_ENV).toBe('development');
      expect(freshConfig.APP_ENV).toBe('local');
      expect(freshConfig.APP_URL).toBe('http://localhost:3000');
      expect(freshConfig.email.from).toBe('noreply@datekeeper.app');
    });

    it('should use provided environment variables', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.APP_ENV = 'staging';
      process.env.APP_URL = 'https://staging.datekeeper.app';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'https://staging.datekeeper.app';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.DATABASE_URL = 'postgresql://test@localhost/test';
      process.env.EMAIL_FROM = 'test@example.com';

      // Re-import to get fresh config
      const { config: freshConfig } = require('../config');

      expect(freshConfig.NODE_ENV).toBe('production');
      expect(freshConfig.APP_ENV).toBe('staging');
      expect(freshConfig.APP_URL).toBe('https://staging.datekeeper.app');
      expect(freshConfig.auth.secret).toBe('test-secret');
      expect(freshConfig.auth.url).toBe('https://staging.datekeeper.app');
      expect(freshConfig.auth.google.clientId).toBe('test-client-id');
      expect(freshConfig.auth.google.clientSecret).toBe('test-client-secret');
      expect(freshConfig.database.url).toBe('postgresql://test@localhost/test');
      expect(freshConfig.email.from).toBe('test@example.com');
    });

    it('should prefer APP_URL over NEXTAUTH_URL when both are set', () => {
      process.env.APP_URL = 'https://app.example.com';
      process.env.NEXTAUTH_URL = 'https://auth.example.com';

      const { config: freshConfig } = require('../config');

      expect(freshConfig.APP_URL).toBe('https://app.example.com');
    });

    it('should use NEXTAUTH_URL as fallback for APP_URL', () => {
      delete process.env.APP_URL;
      process.env.NEXTAUTH_URL = 'https://auth.example.com';

      const { config: freshConfig } = require('../config');

      expect(freshConfig.APP_URL).toBe('https://auth.example.com');
    });
  });

  describe('Feature Flags', () => {
    it('should enable analytics only in production', () => {
      // Test production
      process.env.APP_ENV = 'production';
      let { config: freshConfig } = require('../config');
      expect(freshConfig.features.enableAnalytics).toBe(true);

      // Reset modules and test non-production
      jest.resetModules();
      process.env.APP_ENV = 'staging';
      freshConfig = require('../config').config;
      expect(freshConfig.features.enableAnalytics).toBe(false);

      jest.resetModules();
      process.env.APP_ENV = 'local';
      freshConfig = require('../config').config;
      expect(freshConfig.features.enableAnalytics).toBe(false);
    });

    it('should enable Sentry in non-local environments', () => {
      // Test local (should be disabled)
      process.env.APP_ENV = 'local';
      let { config: freshConfig } = require('../config');
      expect(freshConfig.features.enableSentry).toBe(false);

      // Test non-local environments (should be enabled)
      const nonLocalEnvs = ['development', 'staging', 'production'];

      for (const env of nonLocalEnvs) {
        jest.resetModules();
        process.env.APP_ENV = env;
        freshConfig = require('../config').config;
        expect(freshConfig.features.enableSentry).toBe(true);
      }
    });

    it('should enable debug mode in development environments', () => {
      // Test NODE_ENV development
      (process.env as any).NODE_ENV = 'development';
      process.env.APP_ENV = 'production'; // Should still enable debug due to NODE_ENV
      let { config: freshConfig } = require('../config');
      expect(freshConfig.features.debugMode).toBe(true);

      // Test APP_ENV development
      jest.resetModules();
      (process.env as any).NODE_ENV = 'production';
      process.env.APP_ENV = 'development';
      freshConfig = require('../config').config;
      expect(freshConfig.features.debugMode).toBe(true);

      // Test non-development (should be disabled)
      jest.resetModules();
      (process.env as any).NODE_ENV = 'production';
      process.env.APP_ENV = 'production';
      freshConfig = require('../config').config;
      expect(freshConfig.features.debugMode).toBe(false);
    });

    it('should enable test notifications in non-production environments', () => {
      // Test production (should be disabled)
      process.env.APP_ENV = 'production';
      let { config: freshConfig } = require('../config');
      expect(freshConfig.features.enableTestNotifications).toBe(false);

      // Test non-production environments (should be enabled)
      const nonProductionEnvs = ['local', 'development', 'staging'];

      for (const env of nonProductionEnvs) {
        jest.resetModules();
        process.env.APP_ENV = env;
        freshConfig = require('../config').config;
        expect(freshConfig.features.enableTestNotifications).toBe(true);
      }
    });
  });

  describe('Optional Configuration', () => {
    it('should handle optional email configuration', () => {
      delete process.env.RESEND_API_KEY;

      const { config: freshConfig } = require('../config');

      expect(freshConfig.email.resendApiKey).toBeUndefined();
    });

    it('should handle optional analytics configuration', () => {
      delete process.env.GOOGLE_ANALYTICS_ID;

      const { config: freshConfig } = require('../config');

      expect(freshConfig.analytics.googleAnalyticsId).toBeUndefined();
    });

    it('should handle optional sentry configuration', () => {
      delete process.env.SENTRY_DSN;

      const { config: freshConfig } = require('../config');

      expect(freshConfig.sentry.dsn).toBeUndefined();
    });

    it('should include optional configuration when provided', () => {
      process.env.RESEND_API_KEY = 'test-resend-key';
      process.env.GOOGLE_ANALYTICS_ID = 'GA-123456789';
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const { config: freshConfig } = require('../config');

      expect(freshConfig.email.resendApiKey).toBe('test-resend-key');
      expect(freshConfig.analytics.googleAnalyticsId).toBe('GA-123456789');
      expect(freshConfig.sentry.dsn).toBe('https://test@sentry.io/123');
    });
  });
});

describe('validateEnvironment', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should skip validation in test environment', () => {
    (process.env as any).NODE_ENV = 'test';
    // Clear required vars
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.DATABASE_URL;

    const { validateEnvironment } = require('../config');

    // Should not throw
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should skip validation in CI environment', () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.CI = 'true';
    // Clear required vars
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;

    const { validateEnvironment } = require('../config');

    // Should not throw
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should pass validation when all required variables are present', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.CI;

    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXTAUTH_URL = 'https://app.example.com';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.DATABASE_URL = 'postgresql://test@localhost/test';

    const { validateEnvironment } = require('../config');

    // Should not throw
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should throw error when required variables are missing', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.CI;

    // Clear some required vars
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.NEXTAUTH_URL = 'https://app.example.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.DATABASE_URL = 'postgresql://test@localhost/test';

    const { validateEnvironment } = require('../config');

    expect(() => validateEnvironment()).toThrow(
      'Missing required environment variables: NEXTAUTH_SECRET, GOOGLE_CLIENT_ID'
    );
  });

  it('should include all missing variables in error message', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.CI;

    // Clear all required vars
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.DATABASE_URL;

    const { validateEnvironment } = require('../config');

    expect(() => validateEnvironment()).toThrow(
      'Missing required environment variables: NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL'
    );
  });
});

describe('Environment Helper Functions', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('APP_ENV helpers', () => {
    it('should correctly identify local environment', () => {
      process.env.APP_ENV = 'local';
      const { isLocal, isDevelopmentEnv, isStaging, isProduction } = require('../config');

      expect(isLocal()).toBe(true);
      expect(isDevelopmentEnv()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(isProduction()).toBe(false);
    });

    it('should correctly identify development environment', () => {
      process.env.APP_ENV = 'development';
      const { isLocal, isDevelopmentEnv, isStaging, isProduction } = require('../config');

      expect(isLocal()).toBe(false);
      expect(isDevelopmentEnv()).toBe(true);
      expect(isStaging()).toBe(false);
      expect(isProduction()).toBe(false);
    });

    it('should correctly identify staging environment', () => {
      process.env.APP_ENV = 'staging';
      const { isLocal, isDevelopmentEnv, isStaging, isProduction } = require('../config');

      expect(isLocal()).toBe(false);
      expect(isDevelopmentEnv()).toBe(false);
      expect(isStaging()).toBe(true);
      expect(isProduction()).toBe(false);
    });

    it('should correctly identify production environment', () => {
      process.env.APP_ENV = 'production';
      const { isLocal, isDevelopmentEnv, isStaging, isProduction } = require('../config');

      expect(isLocal()).toBe(false);
      expect(isDevelopmentEnv()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(isProduction()).toBe(true);
    });
  });

  describe('NODE_ENV helpers', () => {
    it('should correctly identify NODE_ENV development', () => {
      (process.env as any).NODE_ENV = 'development';
      const { isDevelopment, isProductive } = require('../config');

      expect(isDevelopment()).toBe(true);
      expect(isProductive()).toBe(false);
    });

    it('should correctly identify NODE_ENV production', () => {
      (process.env as any).NODE_ENV = 'production';
      const { isDevelopment, isProductive } = require('../config');

      expect(isDevelopment()).toBe(false);
      expect(isProductive()).toBe(true);
    });

    it('should handle other NODE_ENV values', () => {
      (process.env as any).NODE_ENV = 'test';
      const { isDevelopment, isProductive } = require('../config');

      expect(isDevelopment()).toBe(false);
      expect(isProductive()).toBe(false);
    });
  });

  describe('Default environment values', () => {
    it('should use default values when env vars are not set', () => {
      delete process.env.APP_ENV;
      delete (process.env as any).NODE_ENV;

      const { isLocal, isDevelopment } = require('../config');

      expect(isLocal()).toBe(true); // Default APP_ENV is 'local'
      expect(isDevelopment()).toBe(true); // Default NODE_ENV is 'development'
    });
  });
});

describe('Config Immutability', () => {
  it('should be immutable (as const)', () => {
    // This test ensures the config object structure is properly typed
    expect(typeof config.NODE_ENV).toBe('string');
    expect(typeof config.APP_ENV).toBe('string');
    expect(typeof config.features.enableAnalytics).toBe('boolean');
    expect(typeof config.features.enableSentry).toBe('boolean');
    expect(typeof config.features.debugMode).toBe('boolean');
    expect(typeof config.features.enableTestNotifications).toBe('boolean');
  });

  it('should have consistent structure', () => {
    expect(config).toHaveProperty('NODE_ENV');
    expect(config).toHaveProperty('APP_ENV');
    expect(config).toHaveProperty('APP_URL');
    expect(config).toHaveProperty('auth');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('email');
    expect(config).toHaveProperty('analytics');
    expect(config).toHaveProperty('sentry');
    expect(config).toHaveProperty('features');

    expect(config.auth).toHaveProperty('secret');
    expect(config.auth).toHaveProperty('url');
    expect(config.auth).toHaveProperty('google');
    expect(config.auth.google).toHaveProperty('clientId');
    expect(config.auth.google).toHaveProperty('clientSecret');

    expect(config.database).toHaveProperty('url');
    expect(config.email).toHaveProperty('resendApiKey');
    expect(config.email).toHaveProperty('from');
    expect(config.analytics).toHaveProperty('googleAnalyticsId');
    expect(config.sentry).toHaveProperty('dsn');

    expect(config.features).toHaveProperty('enableAnalytics');
    expect(config.features).toHaveProperty('enableSentry');
    expect(config.features).toHaveProperty('debugMode');
    expect(config.features).toHaveProperty('enableTestNotifications');
  });
});
