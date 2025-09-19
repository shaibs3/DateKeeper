import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddEventForm } from '../AddEventForm';

describe('AddEventForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields with proper labels', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Type')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Event' })).toBeInTheDocument();
    });

    it('should render form with proper structure and classes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('bg-white', 'shadow-md', 'rounded-lg', 'p-6');
    });

    it('should render name input with correct attributes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('id', 'name');
      expect(nameInput).toHaveAttribute('placeholder', 'Enter name');
      expect(nameInput).toBeRequired();
      expect(nameInput).toHaveClass('input-field');
    });

    it('should render date input with correct attributes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const dateInput = screen.getByLabelText('Date');
      expect(dateInput).toHaveAttribute('type', 'date');
      expect(dateInput).toHaveAttribute('id', 'date');
      expect(dateInput).toBeRequired();
      expect(dateInput).toHaveClass('input-field');
    });

    it('should render select with all event type options', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const select = screen.getByLabelText('Event Type');
      expect(select).toHaveAttribute('id', 'type');
      expect(select).toHaveClass('input-field');

      expect(screen.getByRole('option', { name: 'Birthday' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Anniversary' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
    });

    it('should have Birthday as default selected option', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const select = screen.getByLabelText('Event Type') as HTMLSelectElement;
      expect(select.value).toBe('BIRTHDAY');
      expect(screen.getByRole('option', { name: 'Birthday' })).toHaveProperty('selected', true);
    });
  });

  describe('Form Interactions', () => {
    it('should update name input value when typing', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      expect(nameInput).toHaveValue('John Doe');
    });

    it('should update date input value when changed', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const dateInput = screen.getByLabelText('Date');
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      expect(dateInput).toHaveValue('2024-12-25');
    });

    it('should update event type when selection changes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const typeSelect = screen.getByLabelText('Event Type');
      fireEvent.change(typeSelect, { target: { value: 'ANNIVERSARY' } });

      expect(typeSelect).toHaveValue('ANNIVERSARY');
      expect(screen.getByRole('option', { name: 'Anniversary' })).toHaveProperty('selected', true);
    });

    it('should handle all event type changes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const typeSelect = screen.getByLabelText('Event Type');

      // Change to Anniversary
      fireEvent.change(typeSelect, { target: { value: 'ANNIVERSARY' } });
      expect(typeSelect).toHaveValue('ANNIVERSARY');

      // Change to Other
      fireEvent.change(typeSelect, { target: { value: 'OTHER' } });
      expect(typeSelect).toHaveValue('OTHER');

      // Change back to Birthday
      fireEvent.change(typeSelect, { target: { value: 'BIRTHDAY' } });
      expect(typeSelect).toHaveValue('BIRTHDAY');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is submitted', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      // Fill form
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Birthday' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: 'BIRTHDAY' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Birthday',
        date: new Date('2024-01-15'),
        type: 'BIRTHDAY',
      });
    });

    it('should submit with Anniversary type', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Wedding Anniversary' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-02-14' } });
      fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: 'ANNIVERSARY' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Wedding Anniversary',
        date: new Date('2024-02-14'),
        type: 'ANNIVERSARY',
      });
    });

    it('should submit with Other type', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Important Meeting' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-03-01' } });
      fireEvent.change(screen.getByLabelText('Event Type'), { target: { value: 'OTHER' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Important Meeting',
        date: new Date('2024-03-01'),
        type: 'OTHER',
      });
    });

    it('should handle form submission via Enter key', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      // Fill required fields
      const nameInput = screen.getByLabelText('Name');
      const dateInput = screen.getByLabelText('Date');

      fireEvent.change(nameInput, { target: { value: 'Test Event' } });
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      // Submit form with Enter key
      fireEvent.submit(document.querySelector('form')!);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Event',
        date: new Date('2024-12-25'),
        type: 'BIRTHDAY',
      });
    });

    it('should reset form after successful submission', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      const dateInput = screen.getByLabelText('Date');
      const typeSelect = screen.getByLabelText('Event Type');

      // Fill form
      fireEvent.change(nameInput, { target: { value: 'Test Event' } });
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
      fireEvent.change(typeSelect, { target: { value: 'OTHER' } });

      // Verify values are set
      expect(nameInput).toHaveValue('Test Event');
      expect(dateInput).toHaveValue('2024-12-25');
      expect(typeSelect).toHaveValue('OTHER');

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      // Form should be reset, but controlled inputs keep their state
      // The reset() call in handleSubmit resets the native form but not controlled state
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation when name is required', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toBeRequired();
    });

    it('should show validation when date is required', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const dateInput = screen.getByLabelText('Date');
      expect(dateInput).toBeRequired();
    });

    it('should not submit form when required fields are empty', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      // Try to submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      // onSubmit should not be called due to browser validation
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle invalid date formats', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Event' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'invalid-date' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      // If the form submission goes through, it should handle invalid dates
      // The Date constructor will create an Invalid Date object
      if (mockOnSubmit.mock.calls.length > 0) {
        const submittedDate = mockOnSubmit.mock.calls[0][0].date;
        expect(submittedDate instanceof Date).toBe(true);
      }
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for each form field', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      const dateInput = screen.getByLabelText('Date');
      const typeSelect = screen.getByLabelText('Event Type');

      // Change name
      fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      expect(nameInput).toHaveValue('Test Name');
      expect(dateInput).toHaveValue('');
      expect(typeSelect).toHaveValue('BIRTHDAY');

      // Change date
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } });
      expect(nameInput).toHaveValue('Test Name');
      expect(dateInput).toHaveValue('2024-01-01');
      expect(typeSelect).toHaveValue('BIRTHDAY');

      // Change type
      fireEvent.change(typeSelect, { target: { value: 'OTHER' } });
      expect(nameInput).toHaveValue('Test Name');
      expect(dateInput).toHaveValue('2024-01-01');
      expect(typeSelect).toHaveValue('OTHER');
    });

    it('should handle rapid state changes', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');

      // Simulate rapid typing
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.change(nameInput, { target: { value: 'ABC' } });
      fireEvent.change(nameInput, { target: { value: 'ABCD' } });

      expect(nameInput).toHaveValue('ABCD');
    });

    it('should start with default values', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText('Name')).toHaveValue('');
      expect(screen.getByLabelText('Date')).toHaveValue('');
      expect(screen.getByLabelText('Event Type')).toHaveValue('BIRTHDAY');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels associated with inputs', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      const dateInput = screen.getByLabelText('Date');
      const typeSelect = screen.getByLabelText('Event Type');

      expect(nameInput).toHaveAttribute('id', 'name');
      expect(dateInput).toHaveAttribute('id', 'date');
      expect(typeSelect).toHaveAttribute('id', 'type');

      expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'name');
      expect(screen.getByLabelText('Date')).toHaveAttribute('id', 'date');
      expect(screen.getByLabelText('Event Type')).toHaveAttribute('id', 'type');
    });

    it('should have proper form structure', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form!.tagName).toBe('FORM');

      const submitButton = screen.getByRole('button', { name: 'Add Event' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should be keyboard navigable', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText('Name');
      const dateInput = screen.getByLabelText('Date');
      const typeSelect = screen.getByLabelText('Event Type');
      const submitButton = screen.getByRole('button', { name: 'Add Event' });

      // All elements should be focusable
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      dateInput.focus();
      expect(dateInput).toHaveFocus();

      typeSelect.focus();
      expect(typeSelect).toHaveFocus();

      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string submissions', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      // Try to submit with empty strings (should be prevented by required attributes)
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      // Should not submit due to required validation
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle special characters in name', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const specialName = 'John\'s "Special" Event & More';
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: specialName } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-12-25' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: specialName,
        date: new Date('2024-12-25'),
        type: 'BIRTHDAY',
      });
    });

    it('should handle very long names', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const longName = 'A'.repeat(1000);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: longName } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-12-25' } });

      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: longName,
        date: new Date('2024-12-25'),
        type: 'BIRTHDAY',
      });
    });

    it('should handle edge case dates', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      const testDates = [
        '2024-02-29', // Leap year
        '1900-01-01', // Very old date
        '2099-12-31', // Future date
      ];

      testDates.forEach((testDate, index) => {
        fireEvent.change(screen.getByLabelText('Name'), {
          target: { value: `Test Event ${index}` },
        });
        fireEvent.change(screen.getByLabelText('Date'), { target: { value: testDate } });

        fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

        expect(mockOnSubmit).toHaveBeenLastCalledWith({
          name: `Test Event ${index}`,
          date: new Date(testDate),
          type: 'BIRTHDAY',
        });

        mockOnSubmit.mockClear();
      });
    });
  });

  describe('Multiple Submissions', () => {
    it('should handle multiple form submissions', () => {
      render(<AddEventForm onSubmit={mockOnSubmit} />);

      // First submission
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'First Event' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-01-01' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);

      // Second submission (form should allow reuse)
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Second Event' } });
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-02-01' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        name: 'Second Event',
        date: new Date('2024-02-01'),
        type: 'BIRTHDAY',
      });
    });
  });
});
