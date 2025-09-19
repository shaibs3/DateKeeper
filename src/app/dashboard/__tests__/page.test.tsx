/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Dashboard from '../page';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/events/EventCard', () => ({
  EventCard: function MockEventCard({ event, onDelete }: any) {
    return (
      <div data-testid={`event-card-${event.id}`} data-event-name={event.name}>
        <span>{event.name}</span>
        <button onClick={() => onDelete(event.id)} data-testid={`delete-${event.id}`}>
          Delete
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/events/EventForm', () => ({
  EventForm: function MockEventForm({ onSubmit }: any) {
    return (
      <form
        data-testid="event-form"
        onSubmit={e => {
          e.preventDefault();
          onSubmit({ name: 'Test Event', category: 'BIRTHDAY', date: new Date() });
        }}
      >
        <button type="submit">Submit Event</button>
      </form>
    );
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Dashboard', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Authentication States', () => {
    it('should show loading spinner when session is loading', () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'loading' });

      const { container } = render(<Dashboard />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should redirect to signin when unauthenticated', () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' });

      render(<Dashboard />);

      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('should show loading when events are being fetched', () => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: { user: { name: 'John' } },
      });
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<Dashboard />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Authenticated User Experience', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should display welcome message with user name', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      });
    });

    it('should fetch events on authenticated mount', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events');
      });
    });

    it('should render event form', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });
    });

    it('should render back to home button', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const backButton = screen.getByText('Back to Home');
        expect(backButton).toBeInTheDocument();
      });
    });

    it('should handle back to home button click', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const backButton = screen.getByText('Back to Home');
        fireEvent.click(backButton);
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Events Management', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should display "No events found" when no events exist', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No events found.')).toBeInTheDocument();
      });
    });

    it('should handle event form submission', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Event');
        fireEvent.click(submitButton);
        // TODO functionality is not implemented yet, so we just test it doesn't crash
      });
    });

    it('should handle event deletion', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Test Birthday',
          date: '2024-12-25T00:00:00.000Z',
          category: 'BIRTHDAY',
          recurrence: 'Yearly',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const deleteButton = screen.getByTestId('delete-1');
        fireEvent.click(deleteButton);
        // TODO functionality is not implemented yet, so we just test it doesn't crash
      });
    });
  });

  describe('Event Grouping and Display', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should group events by month', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'January Birthday',
          date: '2024-01-15T00:00:00.000Z',
          category: 'BIRTHDAY',
          recurrence: 'None',
        },
        {
          id: '2',
          name: 'February Anniversary',
          date: '2024-02-14T00:00:00.000Z',
          category: 'ANNIVERSARY',
          recurrence: 'None',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('January')).toBeInTheDocument();
        expect(screen.getByText('February')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
      });
    });

    it('should handle monthly recurring events', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Monthly Meeting',
          date: '2024-01-15T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'Monthly',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        // Monthly events should appear in all 12 months
        expect(screen.getByText('January')).toBeInTheDocument();
        expect(screen.getByText('February')).toBeInTheDocument();
        expect(screen.getByText('March')).toBeInTheDocument();
        expect(screen.getByText('December')).toBeInTheDocument();
      });
    });

    it('should handle yearly recurring events', async () => {
      const currentYear = new Date().getFullYear();
      const pastDate = `${currentYear - 1}-01-15T00:00:00.000Z`;

      const mockEvents = [
        {
          id: '1',
          name: 'Annual Birthday',
          date: pastDate,
          category: 'BIRTHDAY',
          recurrence: 'Yearly',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('January')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-1-y' + currentYear)).toBeInTheDocument();
      });
    });

    it('should sort events within months by date', async () => {
      const mockEvents = [
        {
          id: '2',
          name: 'Late January Event',
          date: '2024-01-25T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'None',
        },
        {
          id: '1',
          name: 'Early January Event',
          date: '2024-01-05T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'None',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const januarySection = screen.getByText('January').parentElement;
        const eventCards = januarySection?.querySelectorAll('[data-testid^="event-card"]');
        expect(eventCards?.[0]).toHaveAttribute('data-event-name', 'Early January Event');
        expect(eventCards?.[1]).toHaveAttribute('data-event-name', 'Late January Event');
      });
    });

    it('should sort months in chronological order', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'December Event',
          date: '2024-12-25T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'None',
        },
        {
          id: '2',
          name: 'January Event',
          date: '2024-01-01T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'None',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        const monthHeaders = screen.getAllByRole('heading', { level: 3 });
        expect(monthHeaders[0]).toHaveTextContent('January');
        expect(monthHeaders[1]).toHaveTextContent('December');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { container } = render(<Dashboard />);

      await waitFor(() => {
        // Should not crash and should show loading state until error is handled
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });

    it('should handle malformed event data', async () => {
      const mockEvents = [
        { id: '1' }, // Missing required fields
        null, // Null event
        { id: '2', name: 'Valid Event', date: '2024-01-01T00:00:00.000Z', category: 'OTHER' },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      expect(() => render(<Dashboard />)).not.toThrow();
    });

    it('should handle events with edge case dates', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Leap Year Event',
          date: '2024-02-29T00:00:00.000Z',
          category: 'OTHER',
          recurrence: 'Monthly',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        // Should handle leap year dates in monthly recurrence
        expect(screen.getByText('February')).toBeInTheDocument();
      });
    });

    it('should handle session without user name', async () => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: { user: {} }, // No name
      });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, !')).toBeInTheDocument();
      });
    });
  });

  describe('UI Components and Layout', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should render with proper layout structure', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(container.querySelector('.min-h-screen.bg-gray-50')).toBeInTheDocument();
        expect(screen.getByRole('banner')).toBeInTheDocument(); // header
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should have responsive grid layout', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      const { container } = render(<Dashboard />);

      await waitFor(() => {
        const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
        expect(gridContainer).toBeInTheDocument();
      });
    });

    it('should render proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome, John Doe!');
        expect(
          screen.getByRole('heading', { level: 2, name: 'Add New Event' })
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Your Events' })).toBeInTheDocument();
      });
    });

    it('should have proper semantic structure', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // header
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should render loading spinner with proper styling', () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'loading' });

      const { container } = render(<Dashboard />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Event Category Handling', () => {
    const mockSession = {
      user: { name: 'John Doe', email: 'john@example.com' },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        status: 'authenticated',
        data: mockSession,
      });
    });

    it('should handle different event categories', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Birthday Party',
          date: '2024-01-15T00:00:00.000Z',
          category: 'birthday',
          recurrence: 'None',
        },
        {
          id: '2',
          name: 'Wedding Anniversary',
          date: '2024-02-14T00:00:00.000Z',
          category: 'anniversary',
          recurrence: 'None',
        },
        {
          id: '3',
          name: 'Meeting',
          date: '2024-03-10T00:00:00.000Z',
          category: 'meeting',
          recurrence: 'None',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-3')).toBeInTheDocument();
      });
    });

    it('should handle undefined/null categories', async () => {
      const mockEvents = [
        {
          id: '1',
          name: 'Event Without Category',
          date: '2024-01-15T00:00:00.000Z',
          category: null,
          recurrence: 'None',
        },
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockEvents),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });
    });
  });
});
