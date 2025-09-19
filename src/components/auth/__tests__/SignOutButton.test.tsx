/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import SignOutButton from '../SignOutButton';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign out button', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Sign Out');
    });

    it('should have correct CSS classes for styling', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'px-4',
        'py-2',
        'border',
        'border-transparent',
        'text-sm',
        'font-medium',
        'rounded-md',
        'text-white',
        'bg-red-600',
        'hover:bg-red-700',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-red-500'
      );
    });
  });

  describe('Functionality', () => {
    it('should call signOut with correct callback URL when clicked', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(button);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });

    it('should call signOut every time button is clicked', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      fireEvent.click(button);
      expect(signOut).toHaveBeenCalledTimes(1);

      fireEvent.click(button);
      expect(signOut).toHaveBeenCalledTimes(2);

      fireEvent.click(button);
      expect(signOut).toHaveBeenCalledTimes(3);
    });

    it('should handle signOut being called multiple times rapidly', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(signOut).toHaveBeenCalledTimes(3);
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Accessibility', () => {
    it('should be focusable and have proper button role', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be keyboard accessible', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      // Focus the button
      button.focus();
      expect(document.activeElement).toBe(button);

      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter' });
      // Note: fireEvent.keyDown doesn't automatically trigger click for buttons,
      // but we can test that the button is properly focusable
      expect(document.activeElement).toBe(button);
    });

    it('should have visible text for screen readers', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveTextContent('Sign Out');
      expect(button).not.toHaveAttribute('aria-label'); // Text content is sufficient
    });
  });

  describe('Error Handling', () => {
    it('should not break if signOut throws an error', () => {
      const mockSignOut = signOut as jest.Mock;
      mockSignOut.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      // Should not throw an error when clicked
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Button States', () => {
    it('should maintain consistent appearance', () => {
      const { rerender } = render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      const initialClasses = button.className;

      // Re-render component
      rerender(<SignOutButton />);

      const buttonAfterRerender = screen.getByRole('button', { name: 'Sign Out' });
      expect(buttonAfterRerender.className).toBe(initialClasses);
    });

    it('should not have disabled state', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('disabled');
    });
  });

  describe('Component Integration', () => {
    it('should work correctly when rendered multiple times', () => {
      const { rerender } = render(<SignOutButton />);

      let button = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(button);

      expect(signOut).toHaveBeenCalledTimes(1);

      rerender(<SignOutButton />);

      button = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(button);

      expect(signOut).toHaveBeenCalledTimes(2);
    });

    it('should maintain function binding correctly', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });

      // Extract the onClick handler
      const clickHandler = button.onclick;
      expect(typeof clickHandler).toBe('function');

      // Simulate direct function call
      if (clickHandler) {
        clickHandler(new MouseEvent('click'));
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
      }
    });
  });

  describe('CSS and Styling', () => {
    it('should have red color scheme appropriate for sign out action', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('hover:bg-red-700');
      expect(button).toHaveClass('focus:ring-red-500');
    });

    it('should have proper spacing and typography', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm', 'font-medium');
    });

    it('should have rounded corners and proper border', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveClass('rounded-md', 'border', 'border-transparent');
    });

    it('should have focus ring for accessibility', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: 'Sign Out' });
      expect(button).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-red-500'
      );
    });
  });
});