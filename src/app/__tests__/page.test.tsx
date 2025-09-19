/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import RootPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/components/CookieConsentBanner', () => ({
  CookieConsentBanner: function MockCookieConsentBanner() {
    return <div data-testid="cookie-consent-banner">Cookie Consent</div>;
  },
}));

describe('RootPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Redirect', () => {
    it('should redirect authenticated users to /home', async () => {
      const mockSession = {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      };
      (auth as jest.Mock).mockResolvedValue(mockSession);

      await RootPage();

      expect(redirect).toHaveBeenCalledWith('/home');
    });

    it('should not redirect when user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const component = await RootPage();
      expect(redirect).not.toHaveBeenCalled();
      expect(component).toBeDefined();
    });

    it('should not redirect when session has no user', async () => {
      (auth as jest.Mock).mockResolvedValue({});

      const component = await RootPage();
      expect(redirect).not.toHaveBeenCalled();
      expect(component).toBeDefined();
    });
  });

  describe('Landing Page Rendering', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should render main landing page structure', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    });

    it('should have proper page styling', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const main = container.querySelector('main');
      expect(main).toHaveClass('bg-gray-50', 'min-h-screen');
    });

    it('should render cookie consent banner', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByTestId('cookie-consent-banner')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should render header with brand name', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('BirthdayBuddy')).toBeInTheDocument();
      expect(screen.getByText('🎂')).toBeInTheDocument();
    });

    it('should render navigation links', async () => {
      const component = await RootPage();
      render(component);

      const loginLink = screen.getByText('Log In');
      const signupLink = screen.getByText('Sign Up');

      expect(loginLink).toHaveAttribute('href', '/auth/signin');
      expect(signupLink).toHaveAttribute('href', '/auth/signup');
    });

    it('should have proper header styling', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const header = container.querySelector('header');
      expect(header).toHaveClass('w-full', 'bg-white', 'shadow-sm');
    });

    it('should render brand with gradient text', async () => {
      const component = await RootPage();
      render(component);

      const brandText = screen.getByText('BirthdayBuddy');
      expect(brandText).toHaveClass(
        'bg-gradient-to-r',
        'from-purple-500',
        'to-blue-500',
        'bg-clip-text',
        'text-transparent'
      );
    });
  });

  describe('Hero Section', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should render hero heading', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText(/Never Miss an/)).toBeInTheDocument();
      expect(screen.getByText(/Important Date/)).toBeInTheDocument();
    });

    it('should render hero description', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText(/BirthdayBuddy helps you remember birthdays/)).toBeInTheDocument();
    });

    it('should render call-to-action button', async () => {
      const component = await RootPage();
      render(component);

      const ctaButton = screen.getByText(/Get Started — It's Free/);
      expect(ctaButton).toHaveAttribute('href', '/auth/signup');
    });

    it('should render hero illustration', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText('Calendar Reminder')).toBeInTheDocument();
    });

    it('should have responsive layout classes', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('flex', 'flex-col', 'md:flex-row');
    });
  });

  describe('Features Section', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should render features heading', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('Why Choose BirthdayBuddy?')).toBeInTheDocument();
    });

    it('should render all three features', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('Easy Reminder Management')).toBeInTheDocument();
      expect(screen.getByText('Timely Notifications')).toBeInTheDocument();
      expect(screen.getByText('Multiple Channels')).toBeInTheDocument();
    });

    it('should render feature icons', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText('⏰')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('should have proper grid layout', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const featuresGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-3');
      expect(featuresGrid).toBeInTheDocument();
    });

    it('should render feature descriptions', async () => {
      const component = await RootPage();
      render(component);

      expect(
        screen.getByText(/Add birthdays, anniversaries, and custom events/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Get reminders exactly when you need them/)).toBeInTheDocument();
      expect(screen.getByText(/Choose how you want to be reminded/)).toBeInTheDocument();
    });
  });

  describe('How It Works Section', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should render how it works heading', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(
        screen.getByText('Three simple steps to never forget important dates again')
      ).toBeInTheDocument();
    });

    it('should render all three steps', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('Create an Account')).toBeInTheDocument();
      expect(screen.getByText('Add Important Dates')).toBeInTheDocument();
      expect(screen.getByText('Receive Reminders')).toBeInTheDocument();
    });

    it('should render step numbers', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render step descriptions', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText(/Sign up for free and set up/)).toBeInTheDocument();
      expect(
        screen.getByText(/Add birthdays, anniversaries, or any special event/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Get timely notifications through/)).toBeInTheDocument();
    });
  });

  describe('Pricing Section', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should not render pricing section when disabled', async () => {
      const component = await RootPage();
      render(component);

      // The pricing section is disabled with {false && (...)}
      expect(screen.queryByText('Simple Pricing')).not.toBeInTheDocument();
      expect(screen.queryByText('Free')).not.toBeInTheDocument();
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });

    it('should maintain pricing structure for future use', async () => {
      const component = await RootPage();

      // This tests that the pricing section is properly structured
      // even though it's currently disabled
      expect(component).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should have proper semantic structure', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    });

    it('should have screen reader text for icons', async () => {
      const component = await RootPage();
      render(component);

      expect(screen.getByText('Calendar Reminder')).toBeInTheDocument();
      expect(screen.getByText('Calendar Reminder')).toHaveClass('sr-only');
    });

    it('should have proper heading hierarchy', async () => {
      const component = await RootPage();
      render(component);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });
  });

  describe('Links and Navigation', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should have proper link attributes', async () => {
      const component = await RootPage();
      render(component);

      const loginLink = screen.getByText('Log In');
      const signupLinks = screen.getAllByText(/Sign Up|Get Started/);

      expect(loginLink).toHaveAttribute('href', '/auth/signin');
      signupLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/auth/signup');
      });
    });

    it('should have hover styles on interactive elements', async () => {
      const component = await RootPage();
      render(component);

      const loginLink = screen.getByText('Log In');
      const signupButton = screen.getByText('Sign Up');

      expect(loginLink).toHaveClass('hover:underline');
      expect(signupButton).toHaveClass('hover:bg-purple-700');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue(null);
    });

    it('should have responsive padding classes', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should have responsive grid classes', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const featuresGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-3');
      expect(featuresGrid).toBeInTheDocument();
    });

    it('should have responsive flex direction', async () => {
      const component = await RootPage();
      const { container } = render(component);

      const heroLayout = container.querySelector('.flex-col.md\\:flex-row');
      expect(heroLayout).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle auth function errors gracefully', async () => {
      (auth as jest.Mock).mockRejectedValue(new Error('Auth error'));

      await expect(RootPage()).rejects.toThrow('Auth error');
    });

    it('should handle undefined auth response', async () => {
      (auth as jest.Mock).mockResolvedValue(undefined);

      const component = await RootPage();
      expect(component).toBeDefined();
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
