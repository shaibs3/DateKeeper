/**
 * @jest-environment node
 */

describe('Cron Job Tests', () => {
  // Mock dependencies before imports
  const mockPrismaFindMany = jest.fn();
  const mockEmailSend = jest.fn();

  beforeAll(() => {
    // Mock prisma
    jest.doMock('@/lib/prisma', () => ({
      prisma: {
        user: {
          findMany: mockPrismaFindMany,
        },
      },
    }));

    // Mock resend
    jest.doMock('resend', () => ({
      Resend: jest.fn().mockImplementation(() => ({
        emails: {
          send: mockEmailSend,
        },
      })),
    }));
  });

  beforeEach(() => {
    // Set up environment
    process.env.CRON_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 'test-api-key';

    // Clear mocks
    mockPrismaFindMany.mockClear();
    mockEmailSend.mockClear();
  });

  describe('Basic functionality', () => {
    it('should reject unauthorized requests', async () => {
      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: () => null, // No auth header
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should accept authorized requests and process notifications', async () => {
      // Mock empty user list
      mockPrismaFindMany.mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toBe('Notifications processed');
      expect(body.processedReminderTypes).toEqual(['1_DAY', '3_DAYS', '1_WEEK', '2_WEEKS', '1_MONTH']);
      expect(mockPrismaFindMany).toHaveBeenCalledTimes(5);
    });

    it('should handle email sending for valid users', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: 'Test notes',
          },
        ],
      };

      // Mock successful email sending
      mockEmailSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      // Return user for first call, empty for others
      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalNotificationsSent).toBe(1);
      expect(body.totalFailures).toBe(0);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'DateKeeper <noreply@resend.dev>',
          to: 'test@example.com',
          subject: expect.stringContaining('tomorrow'),
          html: expect.stringContaining('Test Event'),
        })
      );
    });

    it('should handle email failures with retry logic', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: null,
          },
        ],
      };

      // Mock email sending failure
      mockEmailSend.mockRejectedValue(new Error('Network error'));

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalNotificationsSent).toBe(0);
      expect(body.totalFailures).toBe(1);
      expect(body.failureDetails).toHaveLength(1);
      expect(body.failureDetails[0].error).toBe('Network error');
      expect(body.failureDetails[0].attempts).toBe(3);

      // Should retry 3 times
      expect(mockEmailSend).toHaveBeenCalledTimes(3);
    });

    it('should handle Resend API error responses', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: 'Test notes',
          },
        ],
      };

      // Mock Resend API error response
      mockEmailSend.mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid email address format',
          statusCode: 422,
        },
      });

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalNotificationsSent).toBe(0);
      expect(body.totalFailures).toBe(1);
      expect(body.failureDetails[0].error).toContain('Invalid email address format');
    });

    it('should skip users without email address', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: null,
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: 'Test notes',
          },
        ],
      };

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalNotificationsSent).toBe(0);
      expect(body.totalFailures).toBe(1);
      expect(body.failureDetails[0].error).toBe('No email or events');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should skip users without events', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [],
      };

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalNotificationsSent).toBe(0);
      expect(body.totalFailures).toBe(1);
      expect(body.failureDetails[0].error).toBe('No email or events');
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaFindMany.mockRejectedValueOnce(new Error('Database connection failed'));

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('should handle unknown error types in email sending', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: null,
          },
        ],
      };

      // Mock non-Error object being thrown
      mockEmailSend.mockRejectedValue('String error message');

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalFailures).toBe(1);
      expect(body.failureDetails[0].error).toBe('Unknown error');
    });

    it('should not include failureDetails when no failures occur', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        dateEvents: [
          {
            id: 'event1',
            name: 'Test Event',
            date: new Date(),
            category: 'Birthday',
            notes: 'Test notes',
          },
        ],
      };

      // Mock successful email sending
      mockEmailSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      mockPrismaFindMany
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const { POST } = require('../route');

      const mockRequest = {
        headers: {
          get: (key: string) => key === 'authorization' ? 'Bearer test-secret' : null,
        },
      };

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalFailures).toBe(0);
      expect(body.failureDetails).toBeUndefined();
    });
  });
});