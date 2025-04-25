import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '../EventCard';
import { format, isToday, isTomorrow } from 'date-fns';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('April 15, 1990'),
  isToday: jest.fn().mockReturnValue(false),
  isTomorrow: jest.fn().mockReturnValue(false),
}));

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    name: 'John Doe',
    date: new Date('1990-04-15'),
    type: 'BIRTHDAY' as const,
  };

  const mockDelete = jest.fn();
  const mockToday = new Date('2024-04-15');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default values
    (format as jest.Mock).mockReturnValue('April 15, 1990');
    (isToday as jest.Mock).mockReturnValue(false);
    (isTomorrow as jest.Mock).mockReturnValue(false);
    
    // Mock Date constructor
    const mockDate = jest.spyOn(global, 'Date');
    mockDate.mockImplementation(() => mockToday);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders event details correctly', () => {
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('April 15, 1990')).toBeInTheDocument();
    expect(screen.getByText('birthday')).toBeInTheDocument();
  });

  it('shows delete button on hover', () => {
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    
    const card = screen.getByTestId('event-card');
    
    // Initially button should not exist
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    
    // Show button on hover
    fireEvent.mouseEnter(card);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    
    // Hide button when not hovering
    fireEvent.mouseLeave(card);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    
    const card = screen.getByTestId('event-card');
    fireEvent.mouseEnter(card);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockDelete).toHaveBeenCalledWith(mockEvent.id);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('displays correct badge class based on event type', () => {
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    
    const badge = screen.getByText('birthday');
    expect(badge).toHaveClass('badge', 'badge-birthday');
  });

  it('shows "Today!" for events occurring today', () => {
    // Mock isToday to return true
    (isToday as jest.Mock).mockReturnValue(true);
    
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    const daysText = screen.getByText(/until next occurrence/).textContent;
    expect(daysText).toContain('Today!');
  });

  it('shows "Tomorrow" for events occurring tomorrow', () => {
    // Mock isTomorrow to return true
    (isTomorrow as jest.Mock).mockReturnValue(true);
    
    render(<EventCard event={mockEvent} onDelete={mockDelete} />);
    const daysText = screen.getByText(/until next occurrence/).textContent;
    expect(daysText).toContain('Tomorrow');
  });
}); 