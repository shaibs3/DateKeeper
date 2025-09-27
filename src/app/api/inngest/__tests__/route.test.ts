/**
 * @jest-environment node
 */

// Mock external dependencies first
jest.mock('inngest/next', () => ({
  serve: jest.fn(),
}));

jest.mock('@/inngest/client', () => ({
  inngest: {
    id: 'datekeeper-app',
    eventKey: 'mock-event-key',
  },
}));

jest.mock('@/inngest/functions', () => ({
  sendEventReminders: {
    id: 'send-event-reminders',
    retries: 3,
  },
}));

// Mock process.env
const originalEnv = process.env;

// Import after mocks
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { sendEventReminders } from '@/inngest/functions';

// Cast mocked functions for TypeScript
const mockServe = serve as jest.MockedFunction<typeof serve>;

describe('/api/inngest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env to original state
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Route Configuration', () => {
    it('should call serve with correct configuration', async () => {
      process.env.INNGEST_SIGNING_KEY = 'test-signing-key';

      // Mock serve to return the expected handlers
      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Require the route module to trigger the serve call
      await import('../route');

      expect(mockServe).toHaveBeenCalledWith({
        client: inngest,
        functions: [sendEventReminders],
        signingKey: 'test-signing-key',
      });
    });

    it('should call serve with undefined signingKey when environment variable is missing', async () => {
      delete process.env.INNGEST_SIGNING_KEY;

      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Clear module cache to force re-evaluation
      jest.resetModules();

      // Re-mock the dependencies
      jest.doMock('inngest/next', () => ({
        serve: mockServe,
      }));

      jest.doMock('@/inngest/client', () => ({
        inngest: {
          id: 'datekeeper-app',
          eventKey: 'mock-event-key',
        },
      }));

      jest.doMock('@/inngest/functions', () => ({
        sendEventReminders: {
          id: 'send-event-reminders',
          retries: 3,
        },
      }));

      await import('../route');

      expect(mockServe).toHaveBeenCalledWith({
        client: inngest,
        functions: [sendEventReminders],
        signingKey: undefined,
      });
    });

    it('should export GET, POST, PUT handlers from serve result', async () => {
      process.env.INNGEST_SIGNING_KEY = 'test-signing-key';

      const mockHandlers = {
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      };

      mockServe.mockReturnValue(mockHandlers);

      // Clear module cache and re-import
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      const routeModule = await import('../route');

      expect(routeModule.GET).toBe(mockHandlers.GET);
      expect(routeModule.POST).toBe(mockHandlers.POST);
      expect(routeModule.PUT).toBe(mockHandlers.PUT);
    });

    it('should handle serve function throwing an error', async () => {
      process.env.INNGEST_SIGNING_KEY = 'test-signing-key';

      const mockError = new Error('Serve configuration failed');
      mockServe.mockImplementation(() => {
        throw mockError;
      });

      // Clear module cache
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      await expect(import('../route')).rejects.toThrow('Serve configuration failed');
    });

    it('should pass the correct client configuration', async () => {
      process.env.INNGEST_SIGNING_KEY = 'test-signing-key';

      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Clear module cache
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      await import('../route');

      const serveCall = mockServe.mock.calls[0][0];
      expect(serveCall.client).toEqual(inngest);
      expect(serveCall.functions).toContain(sendEventReminders);
      expect(serveCall.signingKey).toBe('test-signing-key');
    });

    it('should include all required functions in configuration', async () => {
      process.env.INNGEST_SIGNING_KEY = 'test-signing-key';

      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Clear module cache
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      await import('../route');

      const serveCall = mockServe.mock.calls[0][0];
      expect(serveCall.functions).toHaveLength(1);
      expect(serveCall.functions[0]).toBe(sendEventReminders);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle empty string signing key', async () => {
      process.env.INNGEST_SIGNING_KEY = '';

      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Clear module cache
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      await import('../route');

      expect(mockServe).toHaveBeenCalledWith({
        client: inngest,
        functions: [sendEventReminders],
        signingKey: '',
      });
    });

    it('should handle signing key with special characters', async () => {
      process.env.INNGEST_SIGNING_KEY = 'sk_test_!@#$%^&*()_+-=[]{}|;:,.<>?';

      mockServe.mockReturnValue({
        GET: jest.fn(),
        POST: jest.fn(),
        PUT: jest.fn(),
      });

      // Clear module cache
      jest.resetModules();
      jest.doMock('inngest/next', () => ({ serve: mockServe }));
      jest.doMock('@/inngest/client', () => ({ inngest }));
      jest.doMock('@/inngest/functions', () => ({ sendEventReminders }));

      await import('../route');

      expect(mockServe).toHaveBeenCalledWith({
        client: inngest,
        functions: [sendEventReminders],
        signingKey: 'sk_test_!@#$%^&*()_+-=[]{}|;:,.<>?',
      });
    });
  });
});
