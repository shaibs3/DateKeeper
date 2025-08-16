import { Page } from '@playwright/test';

/**
 * Test helpers for mocking authentication flows in E2E tests
 */

export interface MockUser {
  email: string;
  name: string;
  image?: string;
  exists?: boolean; // Whether user exists in database
}

export class AuthMock {
  constructor(private page: Page) {}

  /**
   * Set up OAuth mocking for the page
   */
  async setupOAuthMocking() {
    // Intercept NextAuth API routes
    await this.page.route('**/api/auth/**', async route => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.includes('/signin/google')) {
        await this.handleOAuthRedirect(route, url);
      } else if (pathname.includes('/callback/google')) {
        await this.handleOAuthCallback(route, url);
      } else {
        // Let other auth requests pass through
        await route.continue();
      }
    });
  }

  /**
   * Set the mock user scenario for testing
   */
  async setMockUserScenario(
    scenario: 'new-user' | 'existing-user',
    userEmail = 'test@example.com'
  ) {
    await this.page.addInitScript(
      data => {
        window.mockUserScenario = data.scenario;
        window.mockUserEmail = data.userEmail;
      },
      { scenario, userEmail }
    );
  }

  /**
   * Mock a successful OAuth flow with user creation
   */
  async mockSuccessfulSignUp(user: MockUser) {
    await this.page.addInitScript(userData => {
      window.mockUserData = userData;
      window.mockUserScenario = 'new-user-success';
    }, user);
  }

  /**
   * Mock a successful OAuth flow with existing user
   */
  async mockSuccessfulSignIn(user: MockUser) {
    await this.page.addInitScript(userData => {
      window.mockUserData = userData;
      window.mockUserScenario = 'existing-user-success';
    }, user);
  }

  private async handleOAuthRedirect(route: any, url: URL) {
    // Extract parameters from the OAuth request
    const callbackUrl = url.searchParams.get('callbackUrl') || '/home';
    const isSignup = callbackUrl.includes('signup=true');

    // Redirect to our mocked callback
    await route.fulfill({
      status: 302,
      headers: {
        Location: `/api/auth/callback/google?${new URLSearchParams({
          code: 'mock-oauth-code',
          state: `callbackUrl=${encodeURIComponent(callbackUrl)}`,
        })}`,
      },
    });
  }

  private async handleOAuthCallback(route: any, url: URL) {
    const callbackUrl = url.searchParams.get('state')?.match(/callbackUrl=([^&]+)/)?.[1];
    const decodedCallbackUrl = callbackUrl ? decodeURIComponent(callbackUrl) : '/home';
    const isSignup = decodedCallbackUrl.includes('signup=true');

    // Get the mock scenario
    const scenario = await this.page.evaluate(() => window.mockUserScenario);

    let redirectUrl: string;

    switch (scenario) {
      case 'new-user':
        // New user attempting different flows
        if (isSignup) {
          // New user signing up - success
          redirectUrl = '/home';
        } else {
          // New user trying to sign in - fail
          redirectUrl = '/auth/error?error=UserNotRegistered';
        }
        break;

      case 'existing-user':
        // Existing user attempting different flows
        if (isSignup) {
          // Existing user trying to sign up - fail
          redirectUrl = '/auth/error?error=UserAlreadyExists';
        } else {
          // Existing user signing in - success
          redirectUrl = '/home';
        }
        break;

      case 'new-user-success':
      case 'existing-user-success':
        // Force success for specific test scenarios
        redirectUrl = '/home';
        break;

      default:
        // Default to sign-in success
        redirectUrl = '/home';
    }

    await route.fulfill({
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  }
}

/**
 * Type definitions for test window object
 */
declare global {
  interface Window {
    mockUserScenario?: string;
    mockUserEmail?: string;
    mockUserData?: MockUser;
  }
}
