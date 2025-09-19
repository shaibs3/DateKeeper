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
      deleteMany: jest.fn(),
    },
  },
}));

// Import after mocks
import { GET, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cast mocked functions for TypeScript
const mockAuth = auth as any;
const mockPrismaFindUnique = prisma.user.findUnique as any;
const mockPrismaDeleteMany = prisma.dateEvent.deleteMany as any;

describe('/api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/events', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/events');

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found in database', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { dateEvents: true },
      });
    });

    it('should return user events when authenticated user exists', async () => {
      const mockEvents = [
        {
          id: 'event1',
          name: 'Birthday',
          date: '2025-01-01T00:00:00.000Z',
          category: 'Birthday',
          notes: 'Test notes',
          reminders: ['1_DAY'],
          userId: 'user1',
        },
        {
          id: 'event2',
          name: 'Anniversary',
          date: '2025-02-01T00:00:00.000Z',
          category: 'Anniversary',
          notes: null,
          reminders: ['1_WEEK'],
          userId: 'user1',
        },
      ];

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        dateEvents: mockEvents,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEvents);
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { dateEvents: true },
      });
    });

    it('should return 500 when database error occurs', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch events');
      expect(data.details).toBeDefined();
    });

    it('should return empty array when user has no events', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        dateEvents: [],
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('DELETE /api/events', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/events', {
      method: 'DELETE',
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaDeleteMany).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
      expect(mockPrismaDeleteMany).not.toHaveBeenCalled();
    });

    it('should return 404 when user is not found in database', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue(null);

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaDeleteMany).not.toHaveBeenCalled();
    });

    it('should successfully delete all user events', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      });
      mockPrismaDeleteMany.mockResolvedValue({ count: 5 });

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should return 500 when database error occurs during user lookup', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete all events');
      expect(data.details).toBeDefined();
      expect(mockPrismaDeleteMany).not.toHaveBeenCalled();
    });

    it('should return 500 when database error occurs during deletion', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      });
      mockPrismaDeleteMany.mockRejectedValue(new Error('Deletion failed'));

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete all events');
      expect(data.details).toBeDefined();
      expect(mockPrismaDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });
  });
});
