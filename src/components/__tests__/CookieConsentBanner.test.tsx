import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookieConsentBanner } from '../CookieConsentBanner';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('Rendering - Initial State', () => {
    it('should render when no consent is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    });

    it('should render when consent is stored as false', () => {
      localStorageMock.getItem.mockReturnValue('false');

      render(<CookieConsentBanner />);

      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    });

    it('should not render when consent is already given', () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(<CookieConsentBanner />);

      expect(
        screen.queryByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should hide banner when Accept button is clicked', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const acceptButton = screen.getByRole('button', { name: 'Accept' });
      expect(acceptButton).toBeInTheDocument();

      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(
          screen.queryByText(
            'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('should save consent to localStorage when Accept is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const acceptButton = screen.getByRole('button', { name: 'Accept' });
      fireEvent.click(acceptButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie_consent', 'true');
    });

    it('should call setItem only once when Accept is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const acceptButton = screen.getByRole('button', { name: 'Accept' });
      fireEvent.click(acceptButton);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie_consent', 'true');
    });
  });

  describe('LocalStorage Interactions', () => {
    it('should check localStorage for existing consent on mount', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cookie_consent');
    });

    it('should handle localStorage returning unexpected values', () => {
      localStorageMock.getItem.mockReturnValue('unexpected_value');

      render(<CookieConsentBanner />);

      // Should render banner since value is not 'true'
      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
    });

    it('should handle empty string from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('');

      render(<CookieConsentBanner />);

      // Should show banner since empty string is not 'true'
      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes to banner', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const banner = screen
        .getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
        .closest('div');
      expect(banner).toHaveClass(
        'fixed',
        'bottom-0',
        'left-0',
        'w-full',
        'bg-gray-900',
        'text-white',
        'p-4',
        'flex',
        'justify-between',
        'items-center',
        'z-50'
      );
    });

    it('should apply correct CSS classes to button', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const button = screen.getByRole('button', { name: 'Accept' });
      expect(button).toHaveClass(
        'ml-4',
        'px-4',
        'py-2',
        'bg-blue-600',
        'rounded',
        'text-white',
        'font-semibold'
      );
    });

    it('should have proper text content', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toHaveTextContent('Accept');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const button = screen.getByRole('button', { name: 'Accept' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should be focusable', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      const button = screen.getByRole('button', { name: 'Accept' });

      // Button should be focusable
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Component Behavior', () => {
    it('should show banner after initial render when no consent exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
    });

    it('should hide banner after accepting consent', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      // Banner should be visible initially
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();

      const acceptButton = screen.getByRole('button', { name: 'Accept' });
      fireEvent.click(acceptButton);

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByText(
            'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('should handle component remount with different localStorage values', () => {
      localStorageMock.getItem.mockReturnValue('true');

      const { unmount } = render(<CookieConsentBanner />);

      // Should not be visible with existing consent
      expect(
        screen.queryByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).not.toBeInTheDocument();

      unmount();

      // Change localStorage to no consent
      localStorageMock.getItem.mockReturnValue(null);

      render(<CookieConsentBanner />);

      // Should be visible after remount
      expect(
        screen.getByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle different values correctly', () => {
      // Test various values that should show the banner
      const valuesToTest = [null, undefined, '', 'false', '0', 'no'];

      valuesToTest.forEach(value => {
        localStorageMock.getItem.mockReturnValue(value);
        const { unmount } = render(<CookieConsentBanner />);

        expect(
          screen.getByText(
            'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
          )
        ).toBeInTheDocument();

        unmount();
      });
    });

    it('should only hide banner when value is exactly "true"', () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(<CookieConsentBanner />);

      expect(
        screen.queryByText(
          'We use cookies to improve your experience. By using our site, you accept our use of cookies.'
        )
      ).not.toBeInTheDocument();
    });
  });
});
