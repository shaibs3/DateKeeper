import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('Sign up page loads and displays correctly', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Verify page elements
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up with Google' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'sign in to your account' })).toBeVisible();
  });

  test('Sign in page loads and displays correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Verify page elements  
    await expect(page.getByText('Sign in to BirthdayBuddy')).toBeVisible();
    await expect(page.getByText('Welcome back! Please sign in to continue.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('Navigation between sign-up and sign-in works', async ({ page }) => {
    // Start on sign-up page
    await page.goto('/auth/signup');
    await expect(page.getByText('Create your account')).toBeVisible();
    
    // Click link to sign-in
    await page.getByRole('link', { name: 'sign in to your account' }).click();
    
    // Should be on sign-in page
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.getByText('Sign in to BirthdayBuddy')).toBeVisible();
  });

  test('Google sign-up button is clickable and initiates OAuth', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Mock the OAuth redirect to prevent actual Google calls
    let oauthInitiated = false;
    await page.route('**/api/auth/signin/google**', async (route) => {
      oauthInitiated = true;
      // Just return a simple response instead of redirecting to Google
      await route.fulfill({
        status: 200,
        body: 'OAuth would start here'
      });
    });
    
    // Click the sign-up button
    await page.getByRole('button', { name: 'Sign up with Google' }).click();
    
    // Wait a moment for any navigation/redirect attempts
    await page.waitForTimeout(1000);
    
    // The button should be functional (even if we mock the actual OAuth)
    // We can't easily test the full OAuth flow without real credentials
    expect(oauthInitiated).toBeTruthy();
  });

  test('Google sign-in button is clickable and initiates OAuth', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Mock the OAuth redirect to prevent actual Google calls
    let oauthInitiated = false;
    await page.route('**/api/auth/signin/google**', async (route) => {
      oauthInitiated = true;
      await route.fulfill({
        status: 200,
        body: 'OAuth would start here'
      });
    });
    
    // Click the sign-in button
    await page.getByRole('button', { name: 'Sign in with Google' }).click();
    
    // Wait a moment for any navigation/redirect attempts
    await page.waitForTimeout(1000);
    
    expect(oauthInitiated).toBeTruthy();
  });
});