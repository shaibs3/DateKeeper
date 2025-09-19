/**
 * @jest-environment node
 */

// Mock external dependencies first
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    dateEvent: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Import after mocks
import { DELETE, PUT } from '../route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cast mocked functions for TypeScript
const mockAuth = auth as any;
const mockPrismaFindUnique = prisma.dateEvent.findUnique as any;
const mockPrismaDelete = prisma.dateEvent.delete as any;
const mockPrismaUpdate = prisma.dateEvent.update as any;

describe('/api/events/[id]', () => {
  const mockParams = { params: Promise.resolve({ id: 'event-123' }) };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/events/[id]', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/events/event-123', {
      method: 'DELETE',
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 404 when event is not found', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue(null);

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Event not found');
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        include: { user: true },
      });
      expect(mockPrismaDelete).not.toHaveBeenCalled();
    });

    it('should return 401 when user tries to delete another users event', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'other@example.com' },
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaDelete).not.toHaveBeenCalled();
    });

    it('should successfully delete user event', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'test@example.com' },
      });
      mockPrismaDelete.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
      });

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrismaDelete).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
    });

    it('should return 500 when database error occurs during lookup', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete event');
      expect(data.details).toBeDefined();
    });

    it('should return 500 when database error occurs during deletion', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'test@example.com' },
      });
      mockPrismaDelete.mockRejectedValue(new Error('Deletion failed'));

      const response = await DELETE(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete event');
      expect(data.details).toBeDefined();
    });
  });

  describe('PUT /api/events/[id]', () => {
    const eventUpdateData = {
      name: 'Updated Birthday',
      date: '2025-06-15T00:00:00.000Z',
      category: 'Birthday',
      color: '#ff0000',
      recurrence: 'yearly',
      notes: 'Updated notes',
      reminders: ['1_DAY', '1_WEEK'],
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/events/event-123', {
      method: 'PUT',
      body: JSON.stringify(eventUpdateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 401 when session has no user email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaFindUnique).not.toHaveBeenCalled();
    });

    it('should return 404 when event is not found', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue(null);

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Event not found');
      expect(mockPrismaFindUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        include: { user: true },
      });
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    it('should return 401 when user tries to update another users event', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'other@example.com' },
      });

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    it('should successfully update user event', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'test@example.com' },
      });
      mockPrismaUpdate.mockResolvedValue({
        id: 'event-123',
        ...eventUpdateData,
        date: new Date(eventUpdateData.date),
      });

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Event with ID event-123 updated successfully.');
      expect(mockPrismaUpdate).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          name: 'Updated Birthday',
          date: new Date('2025-06-15T00:00:00.000Z'),
          category: 'Birthday',
          color: '#ff0000',
          recurrence: 'yearly',
          notes: 'Updated notes',
          reminders: ['1_DAY', '1_WEEK'],
        },
      });
    });

    it('should return 500 when database error occurs during lookup', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update event');
      expect(data.details).toBeDefined();
    });

    it('should return 500 when database error occurs during update', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'test@example.com' },
      });
      mockPrismaUpdate.mockRejectedValue(new Error('Update failed'));

      const response = await PUT(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update event');
      expect(data.details).toBeDefined();
    });

    it('should handle malformed JSON in request body', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/events/event-123', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaFindUnique.mockResolvedValue({
        id: 'event-123',
        name: 'Birthday',
        user: { email: 'test@example.com' },
      });

      const response = await PUT(malformedRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update event');
    });
  });
});
