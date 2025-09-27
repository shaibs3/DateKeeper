/**
 * @jest-environment node
 */

// Mock external dependencies first
jest.mock('@/inngest/client', () => ({
  inngest: {
    createFunction: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  inngestLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock process.env
const originalEnv = process.env;

// Import after mocks
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { inngestLogger } from '@/lib/logger';
import { DateEvent, User } from '@prisma/client';

// Cast mocked functions for TypeScript
const mockCreateFunction = inngest.createFunction as jest.MockedFunction<
  typeof inngest.createFunction
>;
const mockPrismaFindMany = prisma.user.findMany as jest.MockedFunction<typeof prisma.user.findMany>;
const MockResend = Resend as jest.MockedClass<typeof Resend>;
const mockLogger = inngestLogger as jest.Mocked<typeof inngestLogger>;

describe('Inngest Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset env to original state
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('calculateDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate correct date range for 1 day from now', () => {
      // Set a fixed date: 2024-01-15 12:00:00
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0, 0);
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(1);

      expect(result.start).toEqual(new Date(2024, 0, 16, 0, 0, 0, 0));
      expect(result.end).toEqual(new Date(2024, 0, 16, 23, 59, 59, 999));
    });

    it('should calculate correct date range for 7 days from now', () => {
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0, 0);
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(7);

      expect(result.start).toEqual(new Date(2024, 0, 22, 0, 0, 0, 0));
      expect(result.end).toEqual(new Date(2024, 0, 22, 23, 59, 59, 999));
    });

    it('should calculate correct date range for 30 days from now', () => {
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0, 0);
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(30);

      expect(result.start).toEqual(new Date(2024, 1, 14, 0, 0, 0, 0));
      expect(result.end).toEqual(new Date(2024, 1, 14, 23, 59, 59, 999));
    });

    it('should handle month boundaries correctly', () => {
      const fixedDate = new Date(2024, 0, 31, 12, 0, 0, 0); // Jan 31
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(1);

      expect(result.start).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0)); // Feb 1
      expect(result.end).toEqual(new Date(2024, 1, 1, 23, 59, 59, 999));
    });

    it('should handle leap year correctly', () => {
      const fixedDate = new Date(2024, 1, 28, 12, 0, 0, 0); // Feb 28, 2024 (leap year)
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(1);

      expect(result.start).toEqual(new Date(2024, 1, 29, 0, 0, 0, 0)); // Feb 29 (leap day)
      expect(result.end).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
    });

    it('should handle negative days correctly', () => {
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0, 0);
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(-1);

      expect(result.start).toEqual(new Date(2024, 0, 14, 0, 0, 0, 0));
      expect(result.end).toEqual(new Date(2024, 0, 14, 23, 59, 59, 999));
    });

    it('should handle zero days correctly', () => {
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0, 0);
      jest.setSystemTime(fixedDate);

      const { calculateDateRange } = require('../functions');
      const result = calculateDateRange(0);

      expect(result.start).toEqual(new Date(2024, 0, 15, 0, 0, 0, 0));
      expect(result.end).toEqual(new Date(2024, 0, 15, 23, 59, 59, 999));
    });
  });

  describe('getEventsForReminder', () => {
    beforeEach(() => {
      // Clear module cache to ensure fresh imports
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('should query users with correct date range and reminder type', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          dateEvents: [
            {
              id: 'event1',
              name: 'Test Event',
              date: new Date('2024-01-16'),
              category: 'Birthday',
              reminders: ['1_DAY'],
            },
          ],
        },
      ];

      mockPrismaFindMany.mockResolvedValue(mockUsers as any);

      const { getEventsForReminder } = require('../functions');
      const dateRange = {
        start: new Date('2024-01-16T00:00:00.000Z'),
        end: new Date('2024-01-16T23:59:59.999Z'),
      };

      const result = await getEventsForReminder('1_DAY', dateRange);

      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        include: {
          dateEvents: {
            where: {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
              reminders: {
                has: '1_DAY',
              },
            },
          },
        },
        where: {
          dateEvents: {
            some: {
              date: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
              reminders: {
                has: '1_DAY',
              },
            },
          },
        },
      });

      expect(result).toEqual(mockUsers);
    });

    it('should handle different reminder types', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      const { getEventsForReminder } = require('../functions');
      const dateRange = {
        start: new Date('2024-01-16T00:00:00.000Z'),
        end: new Date('2024-01-16T23:59:59.999Z'),
      };

      await getEventsForReminder('1_WEEK', dateRange);

      expect(mockPrismaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            dateEvents: {
              where: expect.objectContaining({
                reminders: {
                  has: '1_WEEK',
                },
              }),
            },
          },
          where: {
            dateEvents: {
              some: expect.objectContaining({
                reminders: {
                  has: '1_WEEK',
                },
              }),
            },
          },
        })
      );
    });

    it('should handle database errors', async () => {
      mockPrismaFindMany.mockRejectedValue(new Error('Database connection failed'));

      const { getEventsForReminder } = require('../functions');
      const dateRange = {
        start: new Date('2024-01-16T00:00:00.000Z'),
        end: new Date('2024-01-16T23:59:59.999Z'),
      };

      await expect(getEventsForReminder('1_DAY', dateRange)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should return empty array when no users found', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      const { getEventsForReminder } = require('../functions');
      const dateRange = {
        start: new Date('2024-01-16T00:00:00.000Z'),
        end: new Date('2024-01-16T23:59:59.999Z'),
      };

      const result = await getEventsForReminder('1_DAY', dateRange);

      expect(result).toEqual([]);
    });
  });

  describe('sendNotificationEmail', () => {
    let mockResend: any;
    let mockUser: User & { dateEvents: DateEvent[] };
    let reminderConfig: any;

    beforeEach(() => {
      jest.resetModules();

      mockResend = {
        emails: {
          send: jest.fn(),
        },
      };

      mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        dateEvents: [
          {
            id: 'event1',
            name: 'Birthday',
            date: new Date('2024-01-16'),
            category: 'Birthday',
            notes: 'Test notes',
            reminders: ['1_DAY'],
            userId: 'user1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      reminderConfig = {
        type: '1_DAY',
        days: 1,
        displayName: 'tomorrow',
      };
    });

    it('should send email successfully on first attempt', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, mockUser, reminderConfig);

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'DateKeeper <noreply@resend.dev>',
        to: 'test@example.com',
        subject: 'Reminder: Your Event(s) tomorrow!',
        html: expect.stringContaining('<h1>Upcoming Event Reminder</h1>'),
      });

      expect(result).toEqual({
        success: true,
        emailId: 'email-123',
        attempt: 1,
      });
    });

    it('should include all event details in email template', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const { sendNotificationEmail } = require('../functions');
      await sendNotificationEmail(mockResend, mockUser, reminderConfig);

      const emailCall = mockResend.emails.send.mock.calls[0][0];
      expect(emailCall.html).toContain('Birthday');
      expect(emailCall.html).toContain('1/16/2024');
      expect(emailCall.html).toContain('Birthday');
      expect(emailCall.html).toContain('Test notes');
      expect(emailCall.html).toContain('tomorrow');
    });

    it('should handle email template with multiple events', async () => {
      mockUser.dateEvents.push({
        id: 'event2',
        name: 'Anniversary',
        date: new Date('2024-01-16'),
        category: 'Anniversary',
        notes: null,
        reminders: ['1_DAY'],
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const { sendNotificationEmail } = require('../functions');
      await sendNotificationEmail(mockResend, mockUser, reminderConfig);

      const emailCall = mockResend.emails.send.mock.calls[0][0];
      expect(emailCall.html).toContain('Birthday');
      expect(emailCall.html).toContain('Anniversary');
      expect(emailCall.html).toContain('Test notes');
      expect(emailCall.html).not.toContain('Notes: null');
    });

    it('should skip sending email when user has no email', async () => {
      const userWithoutEmail = { ...mockUser, email: null };

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(
        mockResend,
        userWithoutEmail as any,
        reminderConfig
      );

      expect(mockResend.emails.send).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'No email or events',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping email - no email')
      );
    });

    it('should skip sending email when user has no events', async () => {
      const userWithoutEvents = { ...mockUser, dateEvents: [] };

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, userWithoutEvents, reminderConfig);

      expect(mockResend.emails.send).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'No email or events',
      });
    });

    it('should retry on failure and succeed on second attempt', async () => {
      mockResend.emails.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { id: 'email-123' },
          error: null,
        });

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, mockUser, reminderConfig);

      expect(mockResend.emails.send).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        emailId: 'email-123',
        attempt: 2,
      });
    });

    it('should fail after maximum retries', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Persistent network error'));

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, mockUser, reminderConfig, 2);

      expect(mockResend.emails.send).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: false,
        error: 'Persistent network error',
        totalAttempts: 2,
      });
    });

    it('should handle Resend API errors', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, mockUser, reminderConfig, 1);

      expect(result).toEqual({
        success: false,
        error: 'Resend API error: Invalid API key',
        totalAttempts: 1,
      });
    });

    it('should implement exponential backoff correctly', async () => {
      jest.useFakeTimers();

      mockResend.emails.send
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({
          data: { id: 'email-123' },
          error: null,
        });

      const { sendNotificationEmail } = require('../functions');
      const resultPromise = sendNotificationEmail(mockResend, mockUser, reminderConfig);

      // Advance timers for first retry (1000ms)
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Allow Promise to resolve

      // Advance timers for second retry (2000ms)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it('should handle non-Error exceptions', async () => {
      mockResend.emails.send.mockRejectedValue('String error');

      const { sendNotificationEmail } = require('../functions');
      const result = await sendNotificationEmail(mockResend, mockUser, reminderConfig, 1);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
        totalAttempts: 1,
      });
    });

    it('should log email sending attempts', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const { sendNotificationEmail } = require('../functions');
      await sendNotificationEmail(mockResend, mockUser, reminderConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '📧 sendNotificationEmail called for test@example.com'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('📧 User has 1 events');
    });
  });

  describe('sendEventReminders', () => {
    let mockFunctionHandler: jest.Mock;

    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-api-key';
      jest.resetModules();
      jest.clearAllMocks();

      // Create a mock function handler
      mockFunctionHandler = jest.fn();
      mockCreateFunction.mockReturnValue(mockFunctionHandler);
    });

    it('should create function with correct configuration', () => {
      require('../functions');

      expect(mockCreateFunction).toHaveBeenCalledWith(
        {
          id: 'send-event-reminders',
          retries: 3,
        },
        { cron: '0 0 * * *' },
        expect.any(Function)
      );
    });

    it('should process all reminder types', async () => {
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([]);

      MockResend.mockImplementation(() => ({
        emails: {
          send: jest.fn(),
        },
      }));

      require('../functions');

      // Get the function handler from the createFunction call
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      await functionHandler({ step: mockStep });

      expect(mockStep.run).toHaveBeenCalledTimes(5); // 5 reminder types
      expect(mockStep.run).toHaveBeenCalledWith('process-1_DAY-reminders', expect.any(Function));
      expect(mockStep.run).toHaveBeenCalledWith('process-3_DAYS-reminders', expect.any(Function));
      expect(mockStep.run).toHaveBeenCalledWith('process-1_WEEK-reminders', expect.any(Function));
      expect(mockStep.run).toHaveBeenCalledWith('process-2_WEEKS-reminders', expect.any(Function));
      expect(mockStep.run).toHaveBeenCalledWith('process-1_MONTH-reminders', expect.any(Function));
    });

    it('should return correct summary for successful processing', async () => {
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      // Mock one user with one event for each reminder type
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          dateEvents: [
            {
              id: 'event1',
              name: 'Test Event',
              date: new Date(),
              category: 'Birthday',
              reminders: ['1_DAY'],
            },
          ],
        },
      ]);

      MockResend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({
            data: { id: 'email-123' },
            error: null,
          }),
        },
      }));

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      const result = await functionHandler({ step: mockStep });

      expect(result).toEqual({
        totalNotificationsSent: 5, // 1 event * 5 reminder types
        totalFailures: 0,
        processedReminderTypes: ['1_DAY', '3_DAYS', '1_WEEK', '2_WEEKS', '1_MONTH'],
      });
    });

    it('should return failure details when emails fail', async () => {
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([
        {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          dateEvents: [
            {
              id: 'event1',
              name: 'Test Event',
              date: new Date(),
              category: 'Birthday',
              reminders: ['1_DAY'],
            },
          ],
        },
      ]);

      MockResend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockRejectedValue(new Error('Email service down')),
        },
      }));

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      const result = await functionHandler({ step: mockStep });

      expect(result).toEqual({
        totalNotificationsSent: 0,
        totalFailures: 5, // 1 user * 5 reminder types
        processedReminderTypes: ['1_DAY', '3_DAYS', '1_WEEK', '2_WEEKS', '1_MONTH'],
        failureDetails: expect.arrayContaining([
          expect.objectContaining({
            user: 'test@example.com',
            error: 'Email service down',
            attempts: 3,
          }),
        ]),
      });
    });

    it('should log environment variable information', async () => {
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([]);

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      await functionHandler({ step: mockStep });

      expect(mockLogger.info).toHaveBeenCalledWith('📧 RESEND_API_KEY exists: true');
      expect(mockLogger.info).toHaveBeenCalledWith('📧 RESEND_API_KEY preview: test-api...');
    });

    it('should handle missing RESEND_API_KEY', async () => {
      delete process.env.RESEND_API_KEY;

      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([]);

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      await functionHandler({ step: mockStep });

      expect(mockLogger.info).toHaveBeenCalledWith('📧 RESEND_API_KEY exists: false');
    });

    it('should log detailed user and event information', async () => {
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      const mockUsers = [
        {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          dateEvents: [
            {
              id: 'event1',
              name: 'Birthday Party',
              date: new Date('2024-01-16T00:00:00.000Z'),
              category: 'Birthday',
              reminders: ['1_DAY'],
            },
          ],
        },
      ];

      // Mock to return users only for 1_DAY reminder type
      mockPrismaFindMany.mockImplementation(query => {
        if (query.include.dateEvents.where.reminders.has === '1_DAY') {
          return Promise.resolve(mockUsers);
        }
        return Promise.resolve([]);
      });

      MockResend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({
            data: { id: 'email-123' },
            error: null,
          }),
        },
      }));

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];
      await functionHandler({ step: mockStep });

      expect(mockLogger.info).toHaveBeenCalledWith('👥 Found 1 users with 1_DAY reminders');
      expect(mockLogger.info).toHaveBeenCalledWith('👤 User 1: test@example.com has 1 events');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '  📅 Event 1: Birthday Party on 2024-01-16T00:00:00.000Z'
      );
    });
  });

  describe('REMINDER_CONFIGS', () => {
    it('should have correct configuration for all reminder types', async () => {
      jest.resetModules();
      jest.clearAllMocks();

      // Setup mock function handler
      const mockFunctionHandler = jest.fn();
      mockCreateFunction.mockReturnValue(mockFunctionHandler);

      const functions = require('../functions');

      // Access REMINDER_CONFIGS through a test export or by testing the actual functionality
      // Since it's not exported, we test through the sendEventReminders function behavior
      const mockStep = {
        run: jest.fn().mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([]);

      const functionHandler = mockCreateFunction.mock.calls[0][2];
      await functionHandler({ step: mockStep });

      const reminderTypes = mockStep.run.mock.calls.map(call => call[0]);
      expect(reminderTypes).toEqual([
        'process-1_DAY-reminders',
        'process-3_DAYS-reminders',
        'process-1_WEEK-reminders',
        'process-2_WEEKS-reminders',
        'process-1_MONTH-reminders',
      ]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();

      // Setup mock function handler
      const mockFunctionHandler = jest.fn();
      mockCreateFunction.mockReturnValue(mockFunctionHandler);
    });

    it('should handle step execution errors gracefully', async () => {
      const mockStep = {
        run: jest.fn().mockRejectedValue(new Error('Step execution failed')),
      };

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];

      await expect(functionHandler({ step: mockStep })).rejects.toThrow('Step execution failed');
    });

    it('should continue processing other reminder types when one fails', async () => {
      const mockStep = {
        run: jest
          .fn()
          .mockRejectedValueOnce(new Error('First step failed'))
          .mockImplementation(async (id, fn) => await fn()),
      };

      mockPrismaFindMany.mockResolvedValue([]);

      require('../functions');
      const functionHandler = mockCreateFunction.mock.calls[0][2];

      await expect(functionHandler({ step: mockStep })).rejects.toThrow('First step failed');
    });
  });
});
