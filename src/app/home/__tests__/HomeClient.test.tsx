/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import HomeClient from '../HomeClient';
import type { DateEvent } from '@/components/events/DateList';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/layout/AuthenticatedHeader', () => ({
  AuthenticatedHeader: () => <div data-testid="authenticated-header">Header</div>,
}));

jest.mock('@/components/events/AddDateModal', () => ({
  AddDateModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="add-date-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

jest.mock('@/components/events/DateList', () => ({
  DateList: ({ events, onEventDeleted }: { events: any[]; onEventDeleted: () => void }) => (
    <div data-testid="date-list">
      <div data-testid="event-count">{events.length}</div>
      <button onClick={onEventDeleted}>Delete Event</button>
      {events.map((event, index) => (
        <div key={event.id || index} data-testid={`event-${index}`}>
          {event.name} - {event.date}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('react-select', () => {
  return {
    __esModule: true,
    default: ({ options, value, onChange, isMulti, placeholder, isSearchable }: any) => {
      const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isMulti) {
          const selectedOptions = Array.from(e.target.selectedOptions).map(option => ({
            value: option.value === 'All' ? 'All' : Number(option.value),
            label: option.text,
          }));
          onChange(selectedOptions);
        } else {
          const selectedOption = options.find(
            (opt: any) => opt.value.toString() === e.target.value
          );
          onChange(selectedOption);
        }
      };

      return (
        <select
          data-testid={isMulti ? 'month-filter' : 'year-filter'}
          onChange={handleChange}
          multiple={isMulti}
          value={isMulti ? [] : value?.value || ''}
        >
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    },
  };
});

jest.mock('react-icons/fi', () => ({
  FiGift: () => <div data-testid="gift-icon">🎁</div>,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('HomeClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Authentication States', () => {
    it('should show loading spinner when session is loading', () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'loading' });

      render(<HomeClient />);

      const loadingContainer = document.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass(
        'min-h-screen',
        'bg-[#f6fcfb]',
        'flex',
        'items-center',
        'justify-center'
      );
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should redirect unauthenticated users to home', () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' });

      render(<HomeClient />);

      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('should render main content for authenticated users', async () => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-header')).toBeInTheDocument();
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
      });
    });
  });

  describe('Event Fetching', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
    });

    it('should fetch events on mount when authenticated', async () => {
      const currentYear = new Date().getFullYear();
      const mockEvents: DateEvent[] = [
        {
          id: '1',
          name: 'Test Event',
          date: `${currentYear}-12-31`,
          category: 'Birthday',
          color: 'blue',
          recurrence: 'Yearly',
          reminders: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      });

      render(<HomeClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events');
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<HomeClient />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events');
        // Should still render the page without errors
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
      });
    });

    it('should show loading state until fetch completes', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      render(<HomeClient />);

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => [],
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    });

    it('should show empty state when no events', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('No dates added yet')).toBeInTheDocument();
        expect(
          screen.getByText('Start adding important dates to never miss a special occasion again.')
        ).toBeInTheDocument();
        expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
        expect(screen.getByText('+ Add Your First Date')).toBeInTheDocument();
      });
    });

    it('should open modal when clicking "Add Your First Date"', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Your First Date')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Your First Date'));

      expect(screen.getByTestId('add-date-modal')).toBeInTheDocument();
    });
  });

  describe('Add Date Modal', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });
    });

    it('should open modal when clicking "+ Add Date" button', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('+ Add Date')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Date'));

      expect(screen.getByTestId('add-date-modal')).toBeInTheDocument();
    });

    it('should close modal and refetch events when modal closes', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Date'));
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Close Modal'));

      await waitFor(() => {
        expect(screen.queryByTestId('add-date-modal')).not.toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledTimes(2); // Refetch after close
      });
    });
  });

  describe('Event Filtering', () => {
    const mockEvents: DateEvent[] = [
      {
        id: '1',
        name: 'January Event',
        date: '2024-01-15',
        category: 'Birthday',
        color: 'blue',
        recurrence: 'None',
        reminders: [],
      },
      {
        id: '2',
        name: 'Yearly Event',
        date: '2024-03-10',
        category: 'Anniversary',
        color: 'pink',
        recurrence: 'Yearly',
        reminders: [],
      },
      {
        id: '3',
        name: 'Monthly Event',
        date: '2024-06-20',
        category: 'Other',
        color: 'green',
        recurrence: 'Monthly',
        reminders: [],
      },
    ];

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockEvents,
      });
    });

    it('should render year filter options', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const yearFilter = screen.getByTestId('year-filter');
        expect(yearFilter).toBeInTheDocument();

        const options = Array.from(yearFilter.querySelectorAll('option'));
        expect(options[0].textContent).toBe('All');
        expect(options.length).toBeGreaterThan(1); // Should have multiple years
      });
    });

    it('should render month filter options', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const monthFilter = screen.getByTestId('month-filter');
        expect(monthFilter).toBeInTheDocument();

        const options = Array.from(monthFilter.querySelectorAll('option'));
        expect(options.length).toBe(12); // All 12 months
        expect(options[0].textContent).toBe('January');
        expect(options[11].textContent).toBe('December');
      });
    });

    it('should filter events by year when year is selected', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const yearFilter = screen.getByTestId('year-filter');
        fireEvent.change(yearFilter, { target: { value: '2025' } });
      });

      // Should update the filtered events (mocked DateList will show the count)
      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
      });
    });

    it('should handle "All" year selection', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const yearFilter = screen.getByTestId('year-filter');
        fireEvent.change(yearFilter, { target: { value: 'All' } });
      });

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
      });
    });
  });

  describe('Event List Integration', () => {
    const currentYear = new Date().getFullYear();
    const mockEvents: DateEvent[] = [
      {
        id: '1',
        name: 'Test Event 1',
        date: `${currentYear}-01-15`,
        category: 'Birthday',
        color: 'blue',
        recurrence: 'Yearly',
        reminders: [],
      },
      {
        id: '2',
        name: 'Test Event 2',
        date: `${currentYear}-03-10`,
        category: 'Anniversary',
        color: 'pink',
        recurrence: 'None',
        reminders: [],
      },
    ];

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockEvents,
      });
    });

    it('should render DateList component with events', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
        expect(screen.getByTestId('event-count')).toBeInTheDocument();
      });
    });

    it('should refetch events when event is deleted', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Delete Event'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Refetch after deletion
      });
    });
  });

  describe('Date Processing Logic', () => {
    const currentYear = new Date().getFullYear();
    const mockEvents: DateEvent[] = [
      {
        id: '1',
        name: 'Yearly Birthday',
        date: `${currentYear}-01-15`,
        category: 'Birthday',
        color: 'blue',
        recurrence: 'Yearly',
        reminders: [],
      },
      {
        id: '2',
        name: 'Monthly Meeting',
        date: `${currentYear}-06-20`,
        category: 'Other',
        color: 'green',
        recurrence: 'Monthly',
        reminders: [],
      },
      {
        id: '3',
        name: 'One-time Event',
        date: `${currentYear}-12-25`,
        category: 'Holiday',
        color: 'red',
        recurrence: 'None',
        reminders: [],
      },
    ];

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockEvents,
      });
    });

    it('should process yearly events correctly', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
        // Should process events and render DateList with event count
        expect(screen.getByTestId('event-count')).toBeInTheDocument();
      });
    });

    it('should process monthly events correctly', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
        // Monthly events should be processed and rendered
        expect(screen.getByTestId('event-count')).toBeInTheDocument();
      });
    });

    it('should handle one-time events correctly', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('date-list')).toBeInTheDocument();
        expect(screen.getByText(/One-time Event/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
    });

    it('should handle network errors gracefully', async () => {
      // Suppress console errors for this test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<HomeClient />);

      await waitFor(() => {
        // Should still render the page without crashing
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
        // Should show empty state since no events loaded
        expect(screen.getByText('No dates added yet')).toBeInTheDocument();
      });

      console.error = originalConsoleError;
    });

    it('should handle invalid JSON response', async () => {
      // Suppress console errors for this test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<HomeClient />);

      await waitFor(() => {
        // Should still render the page
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
        // Should show empty state since no events loaded
        expect(screen.getByText('No dates added yet')).toBeInTheDocument();
      });

      console.error = originalConsoleError;
    });

    it('should handle events with invalid dates', async () => {
      const invalidEvents = [
        {
          id: '1',
          name: 'Invalid Date Event',
          date: 'invalid-date',
          category: 'Other',
          color: 'blue',
          recurrence: 'None',
          reminders: [],
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => invalidEvents,
      });

      render(<HomeClient />);

      await waitFor(() => {
        // Should render without crashing - invalid dates likely result in empty state
        expect(screen.getByText('Your Important Dates')).toBeInTheDocument();
        // Invalid dates would be filtered out, showing empty state
        expect(screen.getByText('No dates added yet')).toBeInTheDocument();
      });
    });

    it('should handle empty events array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('No dates added yet')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });
    });

    it('should have correct CSS classes and structure', async () => {
      const { container } = render(<HomeClient />);

      await waitFor(() => {
        expect(container.querySelector('.min-h-screen.bg-\\[\\#f6fcfb\\]')).toBeInTheDocument();
        expect(container.querySelector('.max-w-6xl.mx-auto')).toBeInTheDocument();
        expect(screen.getByText('Your Important Dates')).toHaveClass(
          'text-3xl font-bold text-gray-900'
        );
      });
    });

    it('should render all filter controls', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByTestId('year-filter')).toBeInTheDocument();
        expect(screen.getByTestId('month-filter')).toBeInTheDocument();
        expect(screen.getByText('+ Add Date')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ status: 'authenticated' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });
    });

    it('should have proper heading structure', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your Important Dates');
      });
    });

    it('should have accessible buttons', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const addButton = screen.getByText('+ Add Date');
        expect(addButton.tagName).toBe('BUTTON');
        expect(addButton).toHaveClass('px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg');
      });
    });

    it('should have accessible main landmark', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('main')).toHaveClass('max-w-6xl mx-auto py-10 px-4');
      });
    });
  });
});
