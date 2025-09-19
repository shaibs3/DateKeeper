/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { Inter } from 'next/font/google';
import RootLayout, { metadata } from '../layout';

// Mock dependencies
jest.mock('next/font/google', () => ({
  Inter: jest.fn(() => ({
    className: 'mocked-inter-font',
  })),
}));

jest.mock('@/components/providers/SessionProvider', () => {
  return function MockSessionProvider({ children }: { children: React.ReactNode }) {
    return <div data-testid="session-provider">{children}</div>;
  };
});

jest.mock('react-hot-toast', () => ({
  Toaster: function MockToaster({ position }: { position: string }) {
    return <div data-testid="toaster" data-position={position} />;
  },
}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should export correct metadata', () => {
      expect(metadata).toEqual({
        title: 'BirthdayBuddy',
        description: 'Remember all your important dates',
      });
    });

    it('should have consistent branding', () => {
      expect(metadata.title).toBe('BirthdayBuddy');
      expect(metadata.description).toContain('important dates');
    });
  });

  describe('Font Configuration', () => {
    it('should configure Inter font with correct subsets', () => {
      render(<RootLayout>Test content</RootLayout>);

      expect(Inter).toHaveBeenCalledWith({ subsets: ['latin'] });
    });

    it('should apply font className to body element', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      const body = container.querySelector('body');
      expect(body).toHaveClass('mocked-inter-font');
    });
  });

  describe('HTML Structure', () => {
    it('should render proper HTML5 structure', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      const html = container.querySelector('html');
      const body = container.querySelector('body');

      expect(html).toHaveAttribute('lang', 'en');
      expect(body).toBeInTheDocument();
    });

    it('should render children content correctly', () => {
      render(
        <RootLayout>
          <div data-testid="child-content">This is test content</div>
        </RootLayout>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('should maintain proper DOM hierarchy', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      const html = container.querySelector('html');
      const body = html?.querySelector('body');
      const toaster = body?.querySelector('[data-testid="toaster"]');
      const sessionProvider = body?.querySelector('[data-testid="session-provider"]');

      expect(html).toContainElement(body!);
      expect(body).toContainElement(toaster!);
      expect(body).toContainElement(sessionProvider!);
    });
  });

  describe('Toaster Configuration', () => {
    it('should render Toaster with correct position', () => {
      render(<RootLayout>Test content</RootLayout>);

      const toaster = screen.getByTestId('toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster).toHaveAttribute('data-position', 'top-center');
    });

    it('should place Toaster before SessionProvider', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      const body = container.querySelector('body');
      const children = Array.from(body?.children || []);
      const toasterIndex = children.findIndex(
        child => child.getAttribute('data-testid') === 'toaster'
      );
      const sessionProviderIndex = children.findIndex(
        child => child.getAttribute('data-testid') === 'session-provider'
      );

      expect(toasterIndex).toBeGreaterThan(-1);
      expect(sessionProviderIndex).toBeGreaterThan(-1);
      expect(toasterIndex).toBeLessThan(sessionProviderIndex);
    });
  });

  describe('SessionProvider Integration', () => {
    it('should wrap children with SessionProvider', () => {
      render(
        <RootLayout>
          <div data-testid="test-child">Test Child</div>
        </RootLayout>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      const testChild = screen.getByTestId('test-child');

      expect(sessionProvider).toBeInTheDocument();
      expect(sessionProvider).toContainElement(testChild);
    });

    it('should pass children correctly to SessionProvider', () => {
      render(
        <RootLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </RootLayout>
      );

      const sessionProvider = screen.getByTestId('session-provider');
      expect(sessionProvider).toHaveTextContent('Child 1Child 2');
    });
  });

  describe('Accessibility', () => {
    it('should set proper lang attribute for screen readers', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      const html = container.querySelector('html');
      expect(html).toHaveAttribute('lang', 'en');
    });

    it('should maintain semantic HTML structure', () => {
      const { container } = render(<RootLayout>Test content</RootLayout>);

      expect(container.querySelector('html')).toBeInTheDocument();
      expect(container.querySelector('body')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should handle multiple children correctly', () => {
      render(
        <RootLayout>
          <header>Header content</header>
          <main>Main content</main>
          <footer>Footer content</footer>
        </RootLayout>
      );

      expect(screen.getByText('Header content')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      expect(() => {
        render(<RootLayout>{null}</RootLayout>);
      }).not.toThrow();
    });

    it('should handle string children', () => {
      render(<RootLayout>Simple text content</RootLayout>);

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should accept children prop correctly', () => {
      const testContent = <div data-testid="props-test">Props test</div>;

      render(<RootLayout>{testContent}</RootLayout>);

      expect(screen.getByTestId('props-test')).toBeInTheDocument();
    });

    it('should work with readonly children prop type', () => {
      // This test ensures TypeScript compatibility
      const props: Readonly<{ children: React.ReactNode }> = {
        children: <div>Readonly test</div>,
      };

      render(<RootLayout {...props} />);

      expect(screen.getByText('Readonly test')).toBeInTheDocument();
    });
  });

  describe('CSS Integration', () => {
    it('should import globals.css', () => {
      // This is tested implicitly through the component rendering
      // The import statement should not cause errors
      expect(() => {
        render(<RootLayout>Test</RootLayout>);
      }).not.toThrow();
    });

    it('should apply font class to body', () => {
      const { container } = render(<RootLayout>Test</RootLayout>);

      const body = container.querySelector('body');
      expect(body?.className).toBe('mocked-inter-font');
    });
  });
});
