import { render, screen, fireEvent } from '@testing-library/react';
import { EventForm } from '../EventForm';

describe('EventForm', () => {
  const mockSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
  });

  it('submits form with correct data', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    });
    
    fireEvent.change(screen.getByLabelText(/date/i), {
      target: { value: '1990-04-15' },
    });
    
    fireEvent.change(screen.getByLabelText(/event type/i), {
      target: { value: 'BIRTHDAY' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    
    // Check if onSubmit was called with correct data
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      date: new Date('1990-04-15'),
      type: 'BIRTHDAY',
    });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    
    // Try to submit without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    
    // Check that onSubmit wasn't called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('resets form after successful submission', () => {
    render(<EventForm onSubmit={mockSubmit} />);
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/name/i);
    const dateInput = screen.getByLabelText(/date/i);
    
    fireEvent.change(nameInput, {
      target: { value: 'John Doe' },
    });
    
    fireEvent.change(dateInput, {
      target: { value: '1990-04-15' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    
    // Check if form was reset
    expect(nameInput).toHaveValue('');
    expect(dateInput).toHaveValue('');
    expect(screen.getByLabelText(/event type/i)).toHaveValue('BIRTHDAY');
  });
}); 