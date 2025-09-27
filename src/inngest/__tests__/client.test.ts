/**
 * @jest-environment node
 */

// Mock process.env
const originalClientEnv = process.env;

describe('Inngest Client', () => {
  beforeEach(() => {
    // Reset env to original state
    process.env = { ...originalClientEnv };
  });

  afterAll(() => {
    process.env = originalClientEnv;
  });

  describe('Client Configuration', () => {
    it('should create Inngest client with correct configuration when environment variables are set', () => {
      process.env.INNGEST_EVENT_KEY = 'test-event-key';

      // Mock Inngest constructor
      const MockInngest = jest.fn().mockImplementation(config => ({
        ...config,
        createFunction: jest.fn(),
        send: jest.fn(),
      }));

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      // Clear module cache and import
      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: 'test-event-key',
      });
    });

    it('should create Inngest client with undefined eventKey when environment variable is missing', () => {
      delete process.env.INNGEST_EVENT_KEY;

      const MockInngest = jest.fn().mockImplementation(config => ({
        ...config,
        createFunction: jest.fn(),
        send: jest.fn(),
      }));

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: undefined,
      });
    });

    it('should create Inngest client with empty string eventKey', () => {
      process.env.INNGEST_EVENT_KEY = '';

      const MockInngest = jest.fn().mockImplementation(config => ({
        ...config,
        createFunction: jest.fn(),
        send: jest.fn(),
      }));

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: '',
      });
    });

    it('should use consistent client id', () => {
      process.env.INNGEST_EVENT_KEY = 'test-key';

      const MockInngest = jest.fn().mockImplementation(config => ({
        ...config,
        createFunction: jest.fn(),
        send: jest.fn(),
      }));

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      const call = MockInngest.mock.calls[0][0];
      expect(call.id).toBe('datekeeper-app');
    });
  });

  describe('Client Export', () => {
    it('should export inngest client instance', () => {
      process.env.INNGEST_EVENT_KEY = 'test-event-key';

      const mockInstance = {
        id: 'datekeeper-app',
        eventKey: 'test-event-key',
        createFunction: jest.fn(),
        send: jest.fn(),
      };

      const MockInngest = jest.fn().mockImplementation(() => mockInstance);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      const { inngest } = require('../client');

      expect(inngest).toBe(mockInstance);
    });

    it('should export the same instance on multiple imports', () => {
      process.env.INNGEST_EVENT_KEY = 'test-event-key';

      const mockInstance = {
        id: 'datekeeper-app',
        eventKey: 'test-event-key',
        createFunction: jest.fn(),
        send: jest.fn(),
      };

      const MockInngest = jest.fn().mockImplementation(() => mockInstance);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      const { inngest: inngest1 } = require('../client');
      const { inngest: inngest2 } = require('../client');

      expect(inngest1).toBe(inngest2);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle constructor throwing error', () => {
      process.env.INNGEST_EVENT_KEY = 'test-event-key';

      const MockInngest = jest.fn().mockImplementation(() => {
        throw new Error('Invalid configuration');
      });

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();

      expect(() => require('../client')).toThrow('Invalid configuration');
    });

    it('should pass through all configuration options', () => {
      process.env.INNGEST_EVENT_KEY = 'test-event-key-123';

      const MockInngest = jest.fn().mockImplementation(config => config);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: 'test-event-key-123',
      });
    });

    it('should maintain proper client configuration structure', () => {
      process.env.INNGEST_EVENT_KEY = 'valid-key';

      const MockInngest = jest.fn().mockImplementation(config => config);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      const config = MockInngest.mock.calls[0][0];
      expect(config).toEqual({
        id: 'datekeeper-app',
        eventKey: 'valid-key',
      });
      expect(Object.keys(config)).toHaveLength(2);
    });
  });

  describe('Environment Edge Cases', () => {
    it('should handle numeric eventKey values', () => {
      process.env.INNGEST_EVENT_KEY = '12345';

      const MockInngest = jest.fn().mockImplementation(config => config);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: '12345',
      });
    });

    it('should handle eventKey with whitespace', () => {
      process.env.INNGEST_EVENT_KEY = '  test-key-with-spaces  ';

      const MockInngest = jest.fn().mockImplementation(config => config);

      jest.doMock('inngest', () => ({
        Inngest: MockInngest,
      }));

      jest.resetModules();
      require('../client');

      expect(MockInngest).toHaveBeenCalledWith({
        id: 'datekeeper-app',
        eventKey: '  test-key-with-spaces  ',
      });
    });
  });
});
