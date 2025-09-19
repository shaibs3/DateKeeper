/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import Header from '../Header';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../auth/SignOutButton', () => {
  return function MockSignOutButton() {
    return <button data-testid="sign-out-button">Sign Out</button>;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, className, ...props }: any) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  };
});

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render header with correct structure', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Remindr')).toBeInTheDocument();
    });

    it('should have proper CSS classes and layout', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-white', 'shadow');

      const mainContainer = container.querySelector('.max-w-7xl');
      expect(mainContainer).toHaveClass(
        'max-w-7xl',
        'mx-auto',
        'px-4',
        'sm:px-6',
        'lg:px-8',
        'py-4'
      );

      const flexContainer = container.querySelector('.flex.justify-between');
      expect(flexContainer).toHaveClass('flex', 'justify-between', 'items-center');
    });
  });

  describe('Logo/Brand Link', () => {
    it('should render logo link with correct text and href', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      const logoLink = screen.getByText('Remindr');
      expect(logoLink).toHaveAttribute('href', '/');
      expect(logoLink).toHaveClass('text-xl', 'font-bold', 'text-gray-900');
    });

    it('should be accessible as a heading-style link', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      const logoLink = screen.getByText('Remindr');
      expect(logoLink.tagName).toBe('A');
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ data: null });
    });

    it('should show sign in link when user is not authenticated', () => {
      render(<Header />);

      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/auth/signin');
      expect(signInLink).toHaveClass('text-sm', 'text-gray-600', 'hover:text-gray-900');
    });

    it('should not show user name or sign out button', () => {
      render(<Header />);

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
      expect(screen.queryByText(/john/i)).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    });

    it('should show user name when authenticated', () => {
      render(<Header />);

      const userName = screen.getByText('John Doe');
      expect(userName).toBeInTheDocument();
      expect(userName).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should show sign out button when authenticated', () => {
      render(<Header />);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should not show sign in link when authenticated', () => {
      render(<Header />);

      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    });

    it('should have correct layout with user info and sign out button', () => {
      const { container } = render(<Header />);

      const userSection = container.querySelector('.flex.items-center.space-x-4');
      expect(userSection).toBeInTheDocument();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });
  });

  describe('Session Edge Cases', () => {
    it('should handle session with missing user name', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            email: 'john@example.com',
            // name is missing
          },
        },
      });

      render(<Header />);

      // Should still show sign out button
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
      // Should not show a name
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle session with empty user name', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: '',
            email: 'john@example.com',
          },
        },
      });

      render(<Header />);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
      // Should not display empty name text
      const userSection = document.querySelector('.flex.items-center.space-x-4');
      expect(userSection).toBeInTheDocument();
    });

    it('should handle session without user object', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          // user object is missing
        },
      });

      render(<Header />);

      // Should still show the sign out button due to session existing
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should handle undefined session data gracefully', () => {
      (useSession as jest.Mock).mockReturnValue({ data: undefined });

      render(<Header />);

      // Should show sign in link
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure and Accessibility', () => {
    it('should use semantic header element', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      const header = screen.getByRole('banner');
      expect(header.tagName).toBe('HEADER');
    });

    it('should have proper navigation structure', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      // Logo link should be accessible
      const logoLink = screen.getByText('Remindr');
      expect(logoLink).toHaveAttribute('href', '/');

      // Sign in link should be accessible
      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toHaveAttribute('href', '/auth/signin');
    });

    it('should maintain consistent spacing and layout', () => {
      const { container } = render(<Header />);

      const flexContainer = container.querySelector('.flex.items-center.space-x-4');
      expect(flexContainer).toHaveClass('space-x-4');
    });
  });

  describe('Visual Design', () => {
    it('should have shadow and white background', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const { container } = render(<Header />);
      const header = container.querySelector('header');

      expect(header).toHaveClass('bg-white', 'shadow');
    });

    it('should have responsive padding', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const { container } = render(<Header />);
      const mainContainer = container.querySelector('.max-w-7xl');

      expect(mainContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should use consistent text styles', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      });

      render(<Header />);

      // Logo should be bold and large
      expect(screen.getByText('Remindr')).toHaveClass('text-xl', 'font-bold', 'text-gray-900');

      // User name should be smaller and gray
      expect(screen.getByText('John Doe')).toHaveClass('text-sm', 'text-gray-600');
    });
  });

  describe('Link Behavior', () => {
    it('should have correct hover states for sign in link', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      const signInLink = screen.getByText('Sign in');
      expect(signInLink).toHaveClass('hover:text-gray-900');
    });

    it('should render all links as anchor elements', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      render(<Header />);

      const logoLink = screen.getByText('Remindr');
      const signInLink = screen.getByText('Sign in');

      expect(logoLink.tagName).toBe('A');
      expect(signInLink.tagName).toBe('A');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive max-width container', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const { container } = render(<Header />);
      const mainContainer = container.querySelector('.max-w-7xl.mx-auto');

      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto');
    });

    it('should maintain proper alignment on different screen sizes', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const { container } = render(<Header />);
      const flexContainer = container.querySelector('.flex.justify-between.items-center');

      expect(flexContainer).toHaveClass('justify-between', 'items-center');
    });
  });
});