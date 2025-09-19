import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Delete Event',
    message: 'Are you sure you want to delete this event? This action cannot be undone.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dialog when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Delete Event')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this event? This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should not render the dialog when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should render with custom title and message', () => {
      const customProps = {
        ...defaultProps,
        title: 'Custom Title',
        message: 'Custom message for confirmation',
      };

      render(<ConfirmDialog {...customProps} />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message for confirmation')).toBeInTheDocument();
    });

    it('should render with empty title and message', () => {
      const emptyProps = {
        ...defaultProps,
        title: '',
        message: '',
      };

      render(<ConfirmDialog {...emptyProps} />);

      // Title element should exist but be empty
      const titleElement = screen.getByRole('heading');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('');

      // Message should be present but empty
      expect(screen.getByText('Cancel')).toBeInTheDocument(); // Buttons should still render
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call both onConfirm and onClose when Delete button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByText('Delete'));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm before onClose when Delete is clicked', () => {
      const callOrder: string[] = [];
      const trackingOnConfirm = jest.fn(() => callOrder.push('confirm'));
      const trackingOnClose = jest.fn(() => callOrder.push('close'));

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={trackingOnConfirm}
          onClose={trackingOnClose}
        />
      );

      fireEvent.click(screen.getByText('Delete'));

      expect(callOrder).toEqual(['confirm', 'close']);
    });

    it('should handle multiple clicks on Cancel button', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks on Delete button', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(2);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Delete Event');
    });

    it('should have accessible buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const deleteButton = screen.getByRole('button', { name: 'Delete' });

      expect(cancelButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const deleteButton = screen.getByText('Delete');

      // Buttons should be focusable
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();

      deleteButton.focus();
      expect(deleteButton).toHaveFocus();

      // Buttons should have proper button role for keyboard navigation
      expect(cancelButton.tagName).toBe('BUTTON');
      expect(deleteButton.tagName).toBe('BUTTON');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes for overlay', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const overlay = screen.getByText('Delete Event').closest('.fixed');
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-40');
    });

    it('should apply correct CSS classes for dialog content', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByText('Delete Event').closest('.bg-white');
      expect(dialog).toHaveClass('bg-white', 'rounded-lg', 'p-6', 'w-full', 'max-w-md');
    });

    it('should apply correct CSS classes for buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const deleteButton = screen.getByText('Delete');

      expect(cancelButton).toHaveClass('px-4', 'py-2', 'text-gray-700', 'bg-gray-100', 'rounded-lg');
      expect(deleteButton).toHaveClass('px-4', 'py-2', 'text-white', 'bg-red-600', 'rounded-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title text', () => {
      const longTitle = 'A'.repeat(100);
      const longProps = {
        ...defaultProps,
        title: longTitle,
        message: 'Short message',
      };

      render(<ConfirmDialog {...longProps} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText('Short message')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle special characters in title and message', () => {
      const specialProps = {
        ...defaultProps,
        title: 'Title with "quotes" & <symbols>',
        message: 'Message with émojis 🚀 and ñspecial characters',
      };

      render(<ConfirmDialog {...specialProps} />);

      expect(screen.getByText('Title with "quotes" & <symbols>')).toBeInTheDocument();
      expect(screen.getByText('Message with émojis 🚀 and ñspecial characters')).toBeInTheDocument();
    });
  });

  describe('Component State', () => {
    it('should update when props change', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Delete Event')).toBeInTheDocument();

      // Update props
      rerender(
        <ConfirmDialog
          {...defaultProps}
          title="Updated Title"
          message="Updated message"
        />
      );

      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.getByText('Updated message')).toBeInTheDocument();
      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();
    });

    it('should toggle visibility when isOpen changes', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Delete Event')).toBeInTheDocument();

      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();

      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Delete Event')).toBeInTheDocument();
    });
  });
});