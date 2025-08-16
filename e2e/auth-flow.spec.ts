import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('unauthenticated user sees landing page with sign in options', async ({ page }) => {
    await page.goto('/');

    // Check that we're on the landing page
    await expect(page).toHaveTitle(/BirthdayBuddy/);

    // Check for the main heading and branding
    await expect(page.locator('span', { hasText: 'BirthdayBuddy' }).first()).toBeVisible();
    await expect(page.locator('text=🎂')).toBeVisible();

    // Check for authentication buttons
    await expect(page.locator('a[href="/auth/signin"]')).toBeVisible();
    await expect(page.locator('a[href="/auth/signup"]').first()).toBeVisible();

    // Check for hero section content
    await expect(page.locator('text=Never Miss an Important Date Again')).toBeVisible();

    // Verify user is not redirected (stays on landing page)
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated user cannot access protected dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to sign in
    await expect(page).toHaveURL('/auth/signin');
  });

  test('unauthenticated user cannot access protected home page', async ({ page }) => {
    await page.goto('/home');

    // Should be redirected to landing page
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated user cannot access protected reminders page', async ({ page }) => {
    await page.goto('/reminders');

    // Should be redirected to landing page
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated user cannot access protected settings page', async ({ page }) => {
    await page.goto('/settings');

    // Should be redirected to landing page
    await expect(page).toHaveURL('/');
  });

  test('sign in page displays correctly', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check page title and content
    await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');
    await expect(page.locator('text=Welcome back! Please sign in to continue.')).toBeVisible();

    // Check for Google sign in button
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).toBeVisible();
  });

  test('sign up page displays correctly', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check page content
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('text=sign in to your account')).toBeVisible();

    // Check for Google sign up button
    await expect(page.locator('button', { hasText: 'Sign up with Google' })).toBeVisible();
  });

  test('navigation between auth pages works', async ({ page }) => {
    // Start at sign in
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');

    // Go to landing page via logo/home
    await page.goto('/');
    await expect(page.locator('text=Never Miss an Important Date Again')).toBeVisible();

    // Navigate to sign up
    await page.click('a[href="/auth/signup"]');
    await expect(page.locator('h2')).toContainText('Create your account');

    // Navigate back to sign in via link in signup page
    await page.click('a[href="/auth/signin"]');
    await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');
  });
});
