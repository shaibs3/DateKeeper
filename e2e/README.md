# E2E Testing Guide

This directory contains end-to-end tests using Playwright for the DateKeeper application.

## Test Structure

- `auth-flow.spec.ts` - Tests for unauthenticated user flows and basic auth pages
- `authenticated-flow.spec.ts` - Tests for authenticated user flows (requires auth setup)
- `oauth-flow.spec.ts` - Tests for OAuth authentication flow
- `test-utils.ts` - Utility functions for testing

## Running Tests

### Basic Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Run specific test file
npx playwright test auth-flow.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### Test Setup Requirements

1. **Environment Variables**: Make sure your `.env.local` has the required variables:

   ```
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DATABASE_URL=your-database-url
   ```

2. **Development Server**: Tests will automatically start the dev server on `localhost:3000`

3. **Database**: Make sure your database is set up and accessible

## Test Categories

### ✅ Currently Working Tests

- **Unauthenticated Flow**: Tests that don't require login
  - Landing page display
  - Sign in/up page display
  - Protected route redirects
  - Navigation between auth pages

### 🔄 Tests Requiring Setup

- **Authenticated Flow**: Tests requiring logged-in users
- **OAuth Flow**: Tests for Google authentication

## Setting Up Authentication Tests

To enable the skipped authentication tests, you need to:

### Option 1: Mock Authentication (Recommended for testing)

1. Create a test user in your database
2. Implement session mocking in `test-utils.ts`
3. Update the `beforeEach` hooks in authenticated test files

### Option 2: Use Real OAuth (Advanced)

1. Set up test Google OAuth credentials
2. Create test accounts
3. Implement automated OAuth flow

### Option 3: Custom Test Auth Provider

1. Add a test-only authentication provider
2. Bypass OAuth for test environment
3. Create deterministic test users

## Test Data Management

For tests that require database interactions:

1. Use a separate test database
2. Implement database seeding for tests
3. Clean up test data after tests

## Debugging Tests

### Visual Debugging

```bash
# Run with headed browser
npm run test:e2e:headed

# Use debug mode for step-by-step execution
npm run test:e2e:debug
```

### Screenshots and Videos

- Screenshots are automatically taken on failure
- Videos can be enabled in `playwright.config.ts`
- Trace files are generated for failed tests

### Common Issues

1. **Timeout Errors**: Increase timeout in config or specific tests
2. **Element Not Found**: Check selectors and wait for elements
3. **Navigation Issues**: Ensure proper URL expectations
4. **Auth State**: Verify authentication mocking is working

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data and state
3. **Waiting**: Use proper waiting strategies for async operations
4. **Selectors**: Use data-testid attributes for stable selectors
5. **Assertions**: Be specific with expectations

## Adding New Tests

1. Create new spec files in the `e2e/` directory
2. Follow the naming convention: `feature-name.spec.ts`
3. Use the utilities from `test-utils.ts`
4. Add proper test descriptions and organization

## Continuous Integration

When running in CI:

- Tests run in headless mode
- Retries are enabled for flaky tests
- Parallel execution is disabled for stability
- Test reports are generated in HTML format
