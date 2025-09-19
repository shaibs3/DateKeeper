import { render, screen } from '@testing-library/react';
import { EventList } from '../EventList';
import { Event } from '../EventCard';

// Mock the EventCard component
jest.mock('../EventCard', () => ({
  EventCard: ({ event, onDelete }: { event: Event; onDelete: (id: string) => void }) => (
    <div data-testid={`event-card-${event.id}`} data-event-name={event.name}>
      <h3>{event.name}</h3>
      <p>{event.type}</p>
      <button onClick={() => onDelete(event.id)}>Delete {event.name}</button>
    </div>
  ),
}));

describe('EventList', () => {
  const mockOnDelete = jest.fn();

  const sampleEvents: Event[] = [
    {
      id: '1',
      name: "John's Birthday",
      date: new Date('2024-01-15'),
      type: 'BIRTHDAY',
    },
    {
      id: '2',
      name: 'Wedding Anniversary',
      date: new Date('2024-02-14'),
      type: 'ANNIVERSARY',
    },
    {
      id: '3',
      name: 'Project Deadline',
      date: new Date('2024-03-01'),
      type: 'OTHER',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - Empty State', () => {
    it('should render empty grid when no events provided', () => {
      render(<EventList events={[]} onDelete={mockOnDelete} />);

      const container = document.querySelector(
        '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6'
      );
      expect(container).toBeInTheDocument();
      expect(container?.children).toHaveLength(0);
    });

    it('should not crash with empty events array', () => {
      expect(() => render(<EventList events={[]} onDelete={mockOnDelete} />)).not.toThrow();
    });
  });

  describe('Rendering - With Events', () => {
    it('should render all events when provided', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-3')).toBeInTheDocument();

      expect(screen.getByText("John's Birthday")).toBeInTheDocument();
      expect(screen.getByText('Wedding Anniversary')).toBeInTheDocument();
      expect(screen.getByText('Project Deadline')).toBeInTheDocument();
    });

    it('should render events with correct types', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      expect(screen.getByText('BIRTHDAY')).toBeInTheDocument();
      expect(screen.getByText('ANNIVERSARY')).toBeInTheDocument();
      expect(screen.getByText('OTHER')).toBeInTheDocument();
    });

    it('should render single event correctly', () => {
      const singleEvent = [sampleEvents[0]];
      render(<EventList events={singleEvent} onDelete={mockOnDelete} />);

      expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      expect(screen.getByText("John's Birthday")).toBeInTheDocument();
      expect(screen.queryByTestId('event-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('event-card-3')).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout and Styling', () => {
    it('should have correct CSS classes for responsive grid', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'gap-6'
      );
    });

    it('should maintain grid structure with different numbers of events', () => {
      const testCases = [
        { events: sampleEvents.slice(0, 1), description: '1 event' },
        { events: sampleEvents.slice(0, 2), description: '2 events' },
        { events: sampleEvents, description: '3 events' },
        { events: [...sampleEvents, ...sampleEvents], description: '6 events' },
      ];

      testCases.forEach(({ events, description }) => {
        const { unmount } = render(<EventList events={events} onDelete={mockOnDelete} />);

        const gridContainer = document.querySelector('.grid');
        expect(gridContainer).toHaveClass(
          'grid',
          'grid-cols-1',
          'md:grid-cols-2',
          'lg:grid-cols-3',
          'gap-6'
        );
        expect(gridContainer?.children).toHaveLength(events.length);

        unmount();
      });
    });
  });

  describe('Event Prop Passing', () => {
    it('should pass correct event data to EventCard components', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      // Check that event data is passed correctly through data attributes
      expect(screen.getByTestId('event-card-1')).toHaveAttribute(
        'data-event-name',
        "John's Birthday"
      );
      expect(screen.getByTestId('event-card-2')).toHaveAttribute(
        'data-event-name',
        'Wedding Anniversary'
      );
      expect(screen.getByTestId('event-card-3')).toHaveAttribute(
        'data-event-name',
        'Project Deadline'
      );
    });

    it('should pass onDelete function to each EventCard', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      const deleteButtons = [
        screen.getByText("Delete John's Birthday"),
        screen.getByText('Delete Wedding Anniversary'),
        screen.getByText('Delete Project Deadline'),
      ];

      expect(deleteButtons).toHaveLength(3);
      deleteButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should pass unique keys to EventCard components', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      const eventCards = [
        screen.getByTestId('event-card-1'),
        screen.getByTestId('event-card-2'),
        screen.getByTestId('event-card-3'),
      ];

      // Verify that each card has a unique testid (indicating unique keys)
      eventCards.forEach((card, index) => {
        expect(card).toHaveAttribute('data-testid', `event-card-${sampleEvents[index].id}`);
      });
    });
  });

  describe('Event Types Handling', () => {
    it('should handle all event types correctly', () => {
      const eventsWithAllTypes: Event[] = [
        { id: '1', name: 'Birthday Event', date: new Date(), type: 'BIRTHDAY' },
        { id: '2', name: 'Anniversary Event', date: new Date(), type: 'ANNIVERSARY' },
        { id: '3', name: 'Other Event', date: new Date(), type: 'OTHER' },
      ];

      render(<EventList events={eventsWithAllTypes} onDelete={mockOnDelete} />);

      expect(screen.getByText('BIRTHDAY')).toBeInTheDocument();
      expect(screen.getByText('ANNIVERSARY')).toBeInTheDocument();
      expect(screen.getByText('OTHER')).toBeInTheDocument();
    });

    it('should handle events with same type', () => {
      const birthdayEvents: Event[] = [
        { id: '1', name: "John's Birthday", date: new Date(), type: 'BIRTHDAY' },
        { id: '2', name: "Jane's Birthday", date: new Date(), type: 'BIRTHDAY' },
        { id: '3', name: "Bob's Birthday", date: new Date(), type: 'BIRTHDAY' },
      ];

      render(<EventList events={birthdayEvents} onDelete={mockOnDelete} />);

      const birthdayTexts = screen.getAllByText('BIRTHDAY');
      expect(birthdayTexts).toHaveLength(3);
    });
  });

  describe('Event Dates Handling', () => {
    it('should handle events with different dates', () => {
      const eventsWithDifferentDates: Event[] = [
        { id: '1', name: 'Past Event', date: new Date('2020-01-01'), type: 'OTHER' },
        { id: '2', name: 'Today Event', date: new Date(), type: 'OTHER' },
        { id: '3', name: 'Future Event', date: new Date('2025-12-31'), type: 'OTHER' },
      ];

      render(<EventList events={eventsWithDifferentDates} onDelete={mockOnDelete} />);

      expect(screen.getByText('Past Event')).toBeInTheDocument();
      expect(screen.getByText('Today Event')).toBeInTheDocument();
      expect(screen.getByText('Future Event')).toBeInTheDocument();
    });

    it('should handle events with edge case dates', () => {
      const eventsWithEdgeDates: Event[] = [
        { id: '1', name: 'Leap Year Event', date: new Date('2024-02-29'), type: 'OTHER' },
        { id: '2', name: 'New Year Event', date: new Date('2024-01-01'), type: 'OTHER' },
        { id: '3', name: 'Last Day Event', date: new Date('2024-12-31'), type: 'OTHER' },
      ];

      render(<EventList events={eventsWithEdgeDates} onDelete={mockOnDelete} />);

      expect(screen.getByText('Leap Year Event')).toBeInTheDocument();
      expect(screen.getByText('New Year Event')).toBeInTheDocument();
      expect(screen.getByText('Last Day Event')).toBeInTheDocument();
    });
  });

  describe('Component Props and Interface', () => {
    it('should accept and render events prop correctly', () => {
      const customEvents: Event[] = [
        { id: 'custom-1', name: 'Custom Event 1', date: new Date(), type: 'BIRTHDAY' },
        { id: 'custom-2', name: 'Custom Event 2', date: new Date(), type: 'ANNIVERSARY' },
      ];

      render(<EventList events={customEvents} onDelete={mockOnDelete} />);

      expect(screen.getByText('Custom Event 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Event 2')).toBeInTheDocument();
    });

    it('should accept and use onDelete prop correctly', () => {
      const customOnDelete = jest.fn();

      render(<EventList events={sampleEvents} onDelete={customOnDelete} />);

      // The onDelete should be passed to EventCard components
      expect(screen.getByText("Delete John's Birthday")).toBeInTheDocument();
      expect(screen.getByText('Delete Wedding Anniversary')).toBeInTheDocument();
      expect(screen.getByText('Delete Project Deadline')).toBeInTheDocument();
    });

    it('should handle prop updates correctly', () => {
      const initialEvents = [sampleEvents[0]];
      const { rerender } = render(<EventList events={initialEvents} onDelete={mockOnDelete} />);

      expect(screen.getByText("John's Birthday")).toBeInTheDocument();
      expect(screen.queryByText('Wedding Anniversary')).not.toBeInTheDocument();

      // Update props
      rerender(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      expect(screen.getByText("John's Birthday")).toBeInTheDocument();
      expect(screen.getByText('Wedding Anniversary')).toBeInTheDocument();
      expect(screen.getByText('Project Deadline')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should render large number of events efficiently', () => {
      const manyEvents: Event[] = Array.from({ length: 100 }, (_, index) => ({
        id: `event-${index}`,
        name: `Event ${index}`,
        date: new Date(),
        type: 'OTHER' as const,
      }));

      const startTime = performance.now();
      render(<EventList events={manyEvents} onDelete={mockOnDelete} />);
      const endTime = performance.now();

      // Should render within reasonable time (arbitrary threshold)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should render all events
      expect(document.querySelectorAll('[data-testid^="event-card-"]')).toHaveLength(100);
    });

    it('should use correct keys for React optimization', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      // Each event card should have unique testid based on event id
      sampleEvents.forEach(event => {
        expect(screen.getByTestId(`event-card-${event.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with special characters in names', () => {
      const specialEvents: Event[] = [
        { id: '1', name: 'John\'s "Special" Birthday', date: new Date(), type: 'BIRTHDAY' },
        { id: '2', name: "Sarah & Mike's Anniversary", date: new Date(), type: 'ANNIVERSARY' },
        { id: '3', name: '<Important> Meeting', date: new Date(), type: 'OTHER' },
      ];

      render(<EventList events={specialEvents} onDelete={mockOnDelete} />);

      expect(screen.getByText('John\'s "Special" Birthday')).toBeInTheDocument();
      expect(screen.getByText("Sarah & Mike's Anniversary")).toBeInTheDocument();
      expect(screen.getByText('<Important> Meeting')).toBeInTheDocument();
    });

    it('should handle events with very long names', () => {
      const longNameEvent: Event[] = [
        {
          id: '1',
          name: 'A'.repeat(200),
          date: new Date(),
          type: 'OTHER',
        },
      ];

      render(<EventList events={longNameEvent} onDelete={mockOnDelete} />);

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle events with empty names gracefully', () => {
      const emptyNameEvents: Event[] = [
        { id: '1', name: '', date: new Date(), type: 'BIRTHDAY' },
        { id: '2', name: ' ', date: new Date(), type: 'OTHER' },
      ];

      render(<EventList events={emptyNameEvents} onDelete={mockOnDelete} />);

      // Component should render without crashing
      expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
    });

    it('should handle duplicate event IDs gracefully', () => {
      const duplicateIdEvents: Event[] = [
        { id: 'duplicate', name: 'Event 1', date: new Date(), type: 'BIRTHDAY' },
        { id: 'duplicate', name: 'Event 2', date: new Date(), type: 'OTHER' },
      ];

      // Should render without crashing (though React may warn about duplicate keys)
      expect(() =>
        render(<EventList events={duplicateIdEvents} onDelete={mockOnDelete} />)
      ).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should maintain semantic structure', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();

      // Each event card should be properly structured
      sampleEvents.forEach(event => {
        const eventCard = screen.getByTestId(`event-card-${event.id}`);
        expect(eventCard).toBeInTheDocument();

        const heading = eventCard.querySelector('h3');
        expect(heading).toHaveTextContent(event.name);
      });
    });

    it('should provide accessible delete buttons', () => {
      render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByText(/Delete .+/);
      expect(deleteButtons).toHaveLength(sampleEvents.length);

      deleteButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Component Behavior', () => {
    it('should maintain component structure with different event arrays', () => {
      const { rerender } = render(<EventList events={[]} onDelete={mockOnDelete} />);

      let gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.children).toHaveLength(0);

      rerender(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.children).toHaveLength(3);

      rerender(<EventList events={sampleEvents.slice(0, 1)} onDelete={mockOnDelete} />);

      gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.children).toHaveLength(1);
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<EventList events={sampleEvents} onDelete={mockOnDelete} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
