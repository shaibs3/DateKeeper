import { Page } from '@playwright/test';
import { TestDatabase } from './test-database';

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
  private testDb: TestDatabase;

  constructor(private page: Page) {
    this.testDb = new TestDatabase();
  }

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
   * Clean up test data
   */
  async cleanup() {
    await this.testDb.disconnect();
  }

  /**
   * Set the mock user scenario for testing
   */
  async setMockUserScenario(
    scenario: 'new-user' | 'existing-user',
    userEmail = 'test@example.com'
  ) {
    // Set up the database state for the scenario
    if (scenario === 'existing-user') {
      // Create the user in the database
      await this.testDb.createTestUser(userEmail, 'Test User');
    } else {
      // Ensure the user doesn't exist
      await this.testDb.deleteTestUser(userEmail);
    }

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

    // Instead of using 302 redirect, we'll simulate the OAuth flow
    // by directly navigating to the callback URL
    const callbackTarget = `/api/auth/callback/google?${new URLSearchParams({
      code: 'mock-oauth-code',
      state: `callbackUrl=${encodeURIComponent(callbackUrl)}`,
    })}`;

    // Fulfill with a simple response and let the test handle navigation
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<script>window.location.href = '${callbackTarget}';</script>`,
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
        // With simplified auth, both signup and signin work for new users
        redirectUrl = '/home';
        break;

      case 'existing-user':
        // Existing user attempting different flows
        // With simplified auth, both signup and signin work for existing users
        redirectUrl = '/home';
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

    // Use JavaScript redirect instead of HTTP 302
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<script>window.location.href = '${redirectUrl}';</script>`,
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
