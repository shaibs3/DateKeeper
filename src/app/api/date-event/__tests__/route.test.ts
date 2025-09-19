/**
 * @jest-environment node
 */

// Mock external dependencies first
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    dateEvent: {
      create: jest.fn(),
    },
  },
}));

// Import after mocks
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cast mocked functions for TypeScript
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockPrismaEventCreate = prisma.dateEvent.create as jest.MockedFunction<typeof prisma.dateEvent.create>;

describe('/api/date-event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/date-event', () => {
    const eventData = {
      name: 'Birthday Party',
      date: '2025-06-15T00:00:00.000Z',
      category: 'Birthday',
      color: '#ff0000',
      recurrence: 'yearly',
      notes: 'Birthday celebration',
      reminders: ['1_DAY', '1_WEEK'],
    };

    const createMockRequest = (data = eventData) => new NextRequest('http://localhost:3000/api/date-event', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaEventCreate).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaEventCreate).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found in database', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaEventCreate).not.toHaveBeenCalled();
    });

    it('should successfully create event for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockCreatedEvent = {
        id: 'event-456',
        name: 'Birthday Party',
        date: '2025-06-15T00:00:00.000Z',
        category: 'Birthday',
        color: '#ff0000',
        recurrence: 'yearly',
        notes: 'Birthday celebration',
        reminders: ['1_DAY', '1_WEEK'],
        userId: 'user-123',
        createdAt: '2025-09-19T13:37:23.873Z',
        updatedAt: '2025-09-19T13:37:23.873Z',
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaEventCreate.mockResolvedValue(mockCreatedEvent);

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCreatedEvent);
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaEventCreate).toHaveBeenCalledWith({
        data: {
          name: 'Birthday Party',
          date: new Date('2025-06-15T00:00:00.000Z'),
          category: 'Birthday',
          color: '#ff0000',
          recurrence: 'yearly',
          notes: 'Birthday celebration',
          reminders: ['1_DAY', '1_WEEK'],
          userId: 'user-123',
        },
      });
    });

    it('should return 500 when database error occurs during user lookup', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create event');
      expect(data.details).toBeDefined();
      expect(mockPrismaEventCreate).not.toHaveBeenCalled();
    });

    it('should return 500 when database error occurs during event creation', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaEventCreate.mockRejectedValue(new Error('Creation failed'));

      const response = await POST(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create event');
      expect(data.details).toBeDefined();
      expect(mockPrismaEventCreate).toHaveBeenCalled();
    });

    it('should handle malformed JSON in request body', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/date-event', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });

      await expect(POST(malformedRequest)).rejects.toThrow('Unexpected token');
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaEventCreate).not.toHaveBeenCalled();
    });

    it('should create event with minimal data', async () => {
      const minimalEventData = {
        name: 'Simple Event',
        date: '2025-12-25T00:00:00.000Z',
        category: 'Other',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockCreatedEvent = {
        id: 'event-456',
        ...minimalEventData,
        date: '2025-12-25T00:00:00.000Z',
        userId: 'user-123',
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaEventCreate.mockResolvedValue(mockCreatedEvent);

      const response = await POST(createMockRequest(minimalEventData));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCreatedEvent);
      expect(mockPrismaEventCreate).toHaveBeenCalledWith({
        data: {
          name: 'Simple Event',
          date: new Date('2025-12-25T00:00:00.000Z'),
          category: 'Other',
          color: undefined,
          recurrence: undefined,
          notes: undefined,
          reminders: undefined,
          userId: 'user-123',
        },
      });
    });

    it('should create event with null values for optional fields', async () => {
      const eventDataWithNulls = {
        name: 'Event with nulls',
        date: '2025-03-10T00:00:00.000Z',
        category: 'Meeting',
        color: null,
        recurrence: null,
        notes: null,
        reminders: null,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockCreatedEvent = {
        id: 'event-789',
        ...eventDataWithNulls,
        date: '2025-03-10T00:00:00.000Z',
        userId: 'user-123',
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaEventCreate.mockResolvedValue(mockCreatedEvent);

      const response = await POST(createMockRequest(eventDataWithNulls));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCreatedEvent);
      expect(mockPrismaEventCreate).toHaveBeenCalledWith({
        data: {
          name: 'Event with nulls',
          date: new Date('2025-03-10T00:00:00.000Z'),
          category: 'Meeting',
          color: null,
          recurrence: null,
          notes: null,
          reminders: null,
          userId: 'user-123',
        },
      });
    });
  });
});