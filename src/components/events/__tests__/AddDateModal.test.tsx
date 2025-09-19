import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddDateModal } from '../AddDateModal';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockPush = jest.fn();
const mockRefresh = jest.fn();

describe('AddDateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  const mockEvent = {
    id: '1',
    name: 'Test Event',
    date: '2024-12-25T00:00:00Z',
    category: 'Birthday',
    color: 'blue',
    recurrence: 'Yearly',
    notes: 'Test notes',
    reminders: ['On day', '1 day before'],
  };

  describe('Rendering - Add Mode', () => {
    it('should render the modal when open is true', () => {
      render(<AddDateModal {...defaultProps} />);

      expect(screen.getByText('Add New Date')).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., John's Birthday")).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Reminders')).toBeInTheDocument();
      expect(screen.getByText('Recurrence')).toBeInTheDocument();
      expect(screen.getByText('Notes (Optional)')).toBeInTheDocument();
    });

    it('should not render the modal when open is false', () => {
      render(<AddDateModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Add New Date')).not.toBeInTheDocument();
    });

    it('should have default values for new event', () => {
      render(<AddDateModal {...defaultProps} />);

      expect(screen.getByPlaceholderText("e.g., John's Birthday")).toHaveValue('');
      expect(screen.getByDisplayValue('Birthday')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'green' })).toHaveTextContent('✓');
    });
  });

  describe('Rendering - Edit Mode', () => {
    it('should render with event data in edit mode', () => {
      render(<AddDateModal {...defaultProps} event={mockEvent} />);

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-25')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Birthday')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'blue' })).toHaveTextContent('✓');
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update name input', () => {
      render(<AddDateModal {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText("e.g., John's Birthday");

      fireEvent.change(nameInput, { target: { value: 'New Event Name' } });

      expect(screen.getByDisplayValue('New Event Name')).toBeInTheDocument();
    });

    it('should update date input', () => {
      render(<AddDateModal {...defaultProps} />);
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date // date input is technically a textbox

      fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

      expect(dateInput).toHaveValue('2024-12-31');
    });

    it('should update category select', () => {
      render(<AddDateModal {...defaultProps} />);
      const categorySelect = screen.getByDisplayValue('Birthday');

      fireEvent.change(categorySelect, { target: { value: 'Anniversary' } });

      expect(screen.getByDisplayValue('Anniversary')).toBeInTheDocument();
    });

    it('should change color selection', () => {
      render(<AddDateModal {...defaultProps} />);
      const blueColor = screen.getByRole('button', { name: 'blue' });

      fireEvent.click(blueColor);

      expect(blueColor).toHaveTextContent('✓');
    });

    it('should toggle reminder options', () => {
      render(<AddDateModal {...defaultProps} />);
      const onDayReminder = screen.getByRole('button', { name: 'On day' });

      // Should be selected by default
      expect(onDayReminder).toHaveClass('bg-blue-600');

      fireEvent.click(onDayReminder);

      expect(onDayReminder).toHaveClass('bg-gray-100');
    });

    it('should update notes textarea', () => {
      render(<AddDateModal {...defaultProps} />);
      const notesTextarea = screen.getByPlaceholderText('Add any additional details...');

      fireEvent.change(notesTextarea, { target: { value: 'New notes' } });

      expect(screen.getByDisplayValue('New notes')).toBeInTheDocument();
    });
  });

  describe('Category Logic', () => {
    it('should set recurrence to Yearly when category is Birthday', () => {
      render(<AddDateModal {...defaultProps} />);

      // Birthday category should disable recurrence selection
      const recurrenceSelect = screen.getAllByRole('combobox')[1]; // Second combobox is recurrence
      expect(recurrenceSelect).toBeDisabled();
    });

    it('should set recurrence to Yearly when category is Anniversary', () => {
      render(<AddDateModal {...defaultProps} />);
      const categorySelect = screen.getByDisplayValue('Birthday');

      fireEvent.change(categorySelect, { target: { value: 'Anniversary' } });

      expect(screen.getByDisplayValue('Yearly')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Anniversary')).toBeInTheDocument();
    });

    it('should allow recurrence selection for Other category', () => {
      render(<AddDateModal {...defaultProps} />);
      const categorySelect = screen.getByDisplayValue('Birthday');

      fireEvent.change(categorySelect, { target: { value: 'Other' } });

      const recurrenceSelect = screen.getByDisplayValue('Monthly');
      expect(recurrenceSelect).not.toBeDisabled();

      fireEvent.change(recurrenceSelect, { target: { value: 'Yearly' } });
      expect(screen.getByDisplayValue('Yearly')).toBeInTheDocument();
    });
  });

  describe('Form Submission - Add Mode', () => {
    it('should create new event on form submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<AddDateModal {...defaultProps} onSaved={jest.fn()} />);

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("e.g., John's Birthday"), {
        target: { value: 'Test Event' },
      });
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      // Submit form
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/date-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Event',
            date: '2024-12-25',
            category: 'Birthday',
            color: 'green',
            recurrence: 'Yearly',
            notes: '',
            reminders: ['On day', '1 day before', '7 days before'],
          }),
        });
      });
    });

    it('should call onSaved and onClose on successful creation', async () => {
      const mockOnSaved = jest.fn();
      const mockOnClose = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<AddDateModal {...defaultProps} onClose={mockOnClose} onSaved={mockOnSaved} />);

      fireEvent.change(screen.getByPlaceholderText("e.g., John's Birthday"), {
        target: { value: 'Test Event' },
      });
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockOnSaved).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('should update existing event on form submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<AddDateModal {...defaultProps} event={mockEvent} />);

      // Modify name
      fireEvent.change(screen.getByDisplayValue('Test Event'), {
        target: { value: 'Updated Event' },
      });

      // Submit form
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Event',
            date: '2024-12-25',
            category: 'Birthday',
            color: 'blue',
            recurrence: 'Yearly',
            notes: 'Test notes',
            reminders: ['On day', '1 day before'],
          }),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors on create', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddDateModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText("e.g., John's Birthday"), {
        target: { value: 'Test Event' },
      });
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument(); // Button should be back to Save
      });
    });

    it('should handle non-ok response on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      render(<AddDateModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText("e.g., John's Birthday"), {
        target: { value: 'Test Event' },
      });
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should close modal when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<AddDateModal {...defaultProps} onClose={mockOnClose} />);

      fireEvent.click(screen.getByLabelText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when cancel button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<AddDateModal {...defaultProps} onClose={mockOnClose} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AddDateModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText("e.g., John's Birthday"), {
        target: { value: 'Test Event' },
      });
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<AddDateModal {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Notes (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should have color buttons with proper labels', () => {
      render(<AddDateModal {...defaultProps} />);

      expect(screen.getByLabelText('blue')).toBeInTheDocument();
      expect(screen.getByLabelText('pink')).toBeInTheDocument();
      expect(screen.getByLabelText('green')).toBeInTheDocument();
      expect(screen.getByLabelText('purple')).toBeInTheDocument();
      expect(screen.getByLabelText('orange')).toBeInTheDocument();
    });

    it('should have required fields marked', () => {
      render(<AddDateModal {...defaultProps} />);

      expect(screen.getByPlaceholderText("e.g., John's Birthday")).toBeRequired();
      const dateInput = screen.getAllByDisplayValue('')[0]; // First empty input is date
      expect(dateInput).toBeRequired();
    });
  });

  describe('State Management', () => {
    it('should reset form when switching from edit to add mode', () => {
      const { rerender } = render(<AddDateModal {...defaultProps} event={mockEvent} />);

      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();

      rerender(<AddDateModal {...defaultProps} event={undefined} />);

      expect(screen.queryByDisplayValue('Test Event')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Birthday')).toBeInTheDocument(); // Default category
    });

    it('should populate form when switching from add to edit mode', () => {
      const { rerender } = render(<AddDateModal {...defaultProps} />);

      expect(screen.queryByDisplayValue('Test Event')).not.toBeInTheDocument();

      rerender(<AddDateModal {...defaultProps} event={mockEvent} />);

      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-25')).toBeInTheDocument();
    });
  });
});
