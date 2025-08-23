# Registration Flow E2E Testing

This guide explains how to test the user registration flow with E2E tests, both locally and in CI.

## 🎯 What We're Testing

The registration flow tests verify that:

1. **New users can sign in** → Account automatically created + signed in (simplified auth)
2. **Existing users can sign up** → Signed in successfully (simplified auth)
3. **New users can sign up successfully** → Account created + signed in
4. **Existing users can sign in successfully** → Authenticated
5. **Error pages work correctly** → Error pages display and navigate properly (edge cases)
6. **OAuth parameters are handled** → Both signup and signin flows work seamlessly

## 🧪 Test Files

### Basic UI Tests (`user-registration.spec.ts`)

- Tests sign-in/sign-up page rendering
- Validates OAuth parameter passing
- Tests error page display and navigation
- **No database required** - UI tests only

### Mocked OAuth Tests (`auth-flow-mocked.spec.ts`)

- Basic OAuth flow simulation
- Tests registration logic without real OAuth
- Uses route interception for mocking

### Complete Flow Tests (`registration-flow-complete.spec.ts`)

- **Comprehensive registration flow testing**
- Tests all user scenarios with mocked OAuth
- Includes cross-flow prevention
- **Recommended for CI**

## 🚀 Running Tests Locally

### Run All Registration Tests

```bash
npm run test:e2e:registration
```

### Run All Authentication Tests

```bash
npm run test:e2e:auth
```

### Run Specific Test File

```bash
# Basic UI tests
npx playwright test user-registration.spec.ts

# Complete flow tests
npx playwright test registration-flow-complete.spec.ts

# Run with UI for debugging
npx playwright test registration-flow-complete.spec.ts --ui
```

### Run Tests in Different Browsers

```bash
# Chrome only
npx playwright test registration-flow-complete.spec.ts --project=chromium

# All browsers
npx playwright test registration-flow-complete.spec.ts
```

## 🔧 CI/CD Integration

### Automatic Test Execution

Tests run automatically on:

- **Pull requests** to `main` or `develop`
- **Push** to `main` or `develop`
- **Manual workflow dispatch**

### CI Configuration

```yaml
# .github/workflows/ci.yml
- name: Run Playwright tests
  run: npx playwright test --project=${{ matrix.browser }}
  env:
    CI: true
    GOOGLE_CLIENT_ID=mock-client-id-for-testing
    GOOGLE_CLIENT_SECRET=mock-client-secret-for-testing
```

### Test Matrix

CI runs tests on:

- ✅ **Chromium** (Chrome)
- ✅ **Firefox**
- ✅ **WebKit** (Safari)

## 🎭 OAuth Mocking Strategy

### How It Works

1. **Route Interception**: Playwright intercepts OAuth requests
2. **Scenario Setting**: Tests set user scenarios (new/existing)
3. **Response Simulation**: Mock returns appropriate success/error responses
4. **Flow Validation**: Tests verify correct redirects and errors

### Mock Scenarios

```typescript
// New user trying to sign in (should fail)
await authMock.setMockUserScenario('new-user', 'newuser@example.com');

// Existing user trying to sign up (should fail)
await authMock.setMockUserScenario('existing-user', 'existing@example.com');
```

### Benefits

- ✅ **No real OAuth credentials needed**
- ✅ **Deterministic test results**
- ✅ **Fast execution**
- ✅ **Works in CI without external dependencies**
- ✅ **Tests actual registration logic**

## 📊 Test Coverage

### Scenarios Covered

1. **New User Flows**

   - ❌ Sign-in attempt → Error page → Guided to sign-up → ✅ Success
   - ✅ Direct sign-up → Success

2. **Existing User Flows**

   - ❌ Sign-up attempt → Error page → Guided to sign-in → ✅ Success
   - ✅ Direct sign-in → Success

3. **Error Handling**

   - Error page messaging
   - Navigation buttons
   - Unknown error handling

4. **OAuth Parameters**

   - Sign-in: No signup parameter
   - Sign-up: Includes signup=true
   - Parameter persistence through flow

5. **Security**
   - Cross-flow prevention
   - URL manipulation protection
   - Consistent flow enforcement

## 🐛 Debugging Tests

### Local Debugging

```bash
# Run with visible browser
npm run test:e2e:headed

# Interactive debugging
npm run test:e2e:debug

# UI mode for specific test
npx playwright test registration-flow-complete.spec.ts --ui
```

### CI Debugging

When tests fail in CI:

1. **Download artifacts** from failed workflow
2. **Open Playwright HTML report**
3. **Review screenshots and traces**
4. **Check error messages in logs**

### Common Issues

1. **Timeout errors**: Increase timeout or add waits
2. **Element not found**: Check selectors match UI
3. **Mock not working**: Verify route interception setup
4. **Environment issues**: Check CI environment variables

## 📈 Adding New Tests

### Test Structure

```typescript
test.describe('New Test Group', () => {
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    authMock = new AuthMock(page);
    await authMock.setupOAuthMocking();
  });

  test('new test scenario', async ({ page }) => {
    await authMock.setMockUserScenario('new-user');
    // Test implementation
  });
});
```

### Best Practices

1. **Use descriptive test names**
2. **Set up mocking in beforeEach**
3. **Test both positive and negative flows**
4. **Verify error messages and navigation**
5. **Keep tests isolated and independent**

## 🎯 Success Metrics

### Test Results

- ✅ **All registration scenarios pass**
- ✅ **Error handling works correctly**
- ✅ **Navigation flows are functional**
- ✅ **OAuth parameters are correct**
- ✅ **Cross-browser compatibility**

### CI Integration

- ✅ **Tests run on every PR**
- ✅ **Failures block merges**
- ✅ **Artifacts available for debugging**
- ✅ **Matrix testing across browsers**

The registration flow is now **thoroughly tested** and **CI-ready**! 🎉
