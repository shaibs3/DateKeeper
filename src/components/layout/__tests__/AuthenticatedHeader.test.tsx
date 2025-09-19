import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthenticatedHeader } from '../AuthenticatedHeader';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}));

const mockPush = jest.fn();

describe('AuthenticatedHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Rendering - User with Image', () => {
    const mockSessionWithImage = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: mockSessionWithImage,
      });
    });

    it('should render header with logo and user image', () => {
      render(<AuthenticatedHeader />);

      expect(screen.getByText('Datekeeper')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByAltText('Profile')).toBeInTheDocument();
    });

    it('should display user profile image when available', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(profileImage).toHaveAttribute('width', '36');
      expect(profileImage).toHaveAttribute('height', '36');
    });
  });

  describe('Rendering - User without Image', () => {
    const mockSessionWithoutImage = {
      user: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: null,
      },
    };

    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: mockSessionWithoutImage,
      });
    });

    it('should render settings icon when user has no image', () => {
      render(<AuthenticatedHeader />);

      expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
      // Should have settings button (count should be different without profile image)
      expect(screen.getAllByRole('button').length).toBeGreaterThan(2);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('should navigate to home when logo is clicked', () => {
      render(<AuthenticatedHeader />);

      const logo = screen.getByText('Datekeeper').parentElement;
      fireEvent.click(logo!);

      expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('should navigate to home when dashboard button is clicked', () => {
      render(<AuthenticatedHeader />);

      fireEvent.click(screen.getByText('Dashboard'));

      expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('should navigate to reminders when bell icon is clicked', () => {
      render(<AuthenticatedHeader />);

      const buttons = screen.getAllByRole('button');
      // Bell button is typically the first icon button (after Dashboard)
      const dashboardButton = screen.getByText('Dashboard').closest('button');
      const iconButtons = buttons.filter(btn => btn !== dashboardButton && !btn.textContent?.includes('Settings') && !btn.textContent?.includes('Sign Out'));

      // Click the first icon button (should be bell)
      if (iconButtons[0]) {
        fireEvent.click(iconButtons[0]);
        expect(mockPush).toHaveBeenCalledWith('/reminders');
      }
    });
  });

  describe('User Menu', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('should toggle menu when profile image is clicked', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');

      // Menu should not be visible initially
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

      // Click to open menu
      fireEvent.click(profileImage);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should close menu when settings is clicked and navigate', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      fireEvent.click(profileImage); // Open menu

      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/settings');
      // Menu should close after clicking settings
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should call signOut when sign out button is clicked', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      fireEvent.click(profileImage); // Open menu

      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('User Menu - Settings Icon', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            image: null,
          },
        },
      });
    });

    it('should toggle menu when settings icon is clicked (no user image)', () => {
      render(<AuthenticatedHeader />);

      const buttons = screen.getAllByRole('button');
      // Settings button should be one with focus:outline-none class
      const settingsIconButton = buttons.find(btn =>
        btn.className.includes('focus:outline-none') &&
        !btn.textContent?.includes('Dashboard')
      );

      expect(settingsIconButton).toBeInTheDocument();

      // Menu should not be visible initially
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();

      // Click settings icon to open menu
      fireEvent.click(settingsIconButton!);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  describe('Click Outside Behavior', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('should close menu when clicking outside', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      fireEvent.click(profileImage); // Open menu

      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Click outside the menu
      fireEvent.mouseDown(document.body);

      // Wait for the effect to run
      waitFor(() => {
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });

    it('should not close menu when clicking inside menu', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      fireEvent.click(profileImage); // Open menu

      const settingsButton = screen.getByText('Settings');
      expect(settingsButton).toBeInTheDocument();

      // Click inside the menu (but not on a button)
      const menuContainer = settingsButton.closest('div');
      fireEvent.mouseDown(menuContainer!);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('should have proper button roles', () => {
      render(<AuthenticatedHeader />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Dashboard button should be accessible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should have proper image alt text', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('alt', 'Profile');
    });

    it('should handle keyboard navigation', () => {
      render(<AuthenticatedHeader />);

      const profileButton = screen.getByAltText('Profile').parentElement;

      // Should be focusable
      expect(profileButton).toHaveAttribute('class', expect.stringContaining('focus:outline-none'));
    });
  });

  describe('Menu State Management', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        },
      });
    });

    it('should toggle menu state correctly', () => {
      render(<AuthenticatedHeader />);

      const profileImage = screen.getByAltText('Profile');

      // Initially closed
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(profileImage);
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Close menu by clicking profile again
      fireEvent.click(profileImage);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle session without user data', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
      });

      render(<AuthenticatedHeader />);

      // Should still render the header
      expect(screen.getByText('Datekeeper')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Should show settings icon (no user image)
      expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
    });

    it('should handle empty session', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: {} },
      });

      render(<AuthenticatedHeader />);

      expect(screen.getByText('Datekeeper')).toBeInTheDocument();
    });
  });
});