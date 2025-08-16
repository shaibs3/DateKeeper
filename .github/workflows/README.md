# CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 🔄 `ci.yml` - Full CI Pipeline

**Triggers:** Push/PR to `main` or `develop` branches

**Jobs:**
1. **Lint & Type Check** - ESLint, TypeScript, Prettier
2. **Unit Tests** - Jest tests with coverage
3. **Build** - Next.js application build
4. **E2E Tests** - Playwright tests across browsers

**Matrix Strategy:** Tests run on `chromium` and `firefox` in parallel

### 🧪 `e2e-tests.yml` - E2E Only

**Triggers:** Push/PR to `main` or `develop` branches

**Purpose:** Standalone E2E testing workflow for faster feedback

## Environment Variables

### Required for CI

The workflows automatically create test environment variables:

```bash
NEXTAUTH_SECRET=test-secret-for-ci-only-not-secure
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=test-client-id
GOOGLE_CLIENT_SECRET=test-client-secret
DATABASE_URL=file:./test.db
```

### Production Secrets

For production deployments, add these secrets in GitHub:
- Repository Settings → Secrets and Variables → Actions

**Required Secrets:**
- `NEXTAUTH_SECRET` - Secure random string
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `DATABASE_URL` - Your production database URL

## Test Optimization

### Browser Matrix

**CI Environment:**
- Chromium ✅
- Firefox ✅  
- WebKit ✅ (Safari)

**Local Development:**
- All desktop browsers ✅
- Mobile Chrome ✅
- Mobile Safari ✅

### Performance Optimizations

- **Parallel Jobs** - Linting, building, and testing run concurrently
- **Caching** - Node modules and build outputs cached
- **Selective Browser Testing** - Mobile tests only run locally
- **Retry Logic** - Failed tests retry 2x in CI
- **Artifacts** - Test reports uploaded on failure

## Artifacts

When tests fail, the following artifacts are uploaded:

- **Playwright Report** - HTML test report with traces
- **Test Results** - Screenshots and videos
- **Coverage Reports** - Code coverage data

**Retention:** 30 days

## Monitoring

### Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/yourusername/DateKeeper/workflows/CI/badge.svg)
![E2E Tests](https://github.com/yourusername/DateKeeper/workflows/E2E%20Tests/badge.svg)
```

### Notifications

Configure notifications in GitHub:
- Repository Settings → Notifications
- Set up Slack/Discord webhooks for failures

## Local Testing

Before pushing, run the same checks locally:

```bash
# Full CI simulation
npm run lint
npm run type-check
npm run format:check
npm test -- --coverage --watchAll=false
npm run build
npm run test:e2e

# Quick checks
npm run test:e2e -- --project=chromium
```

## Troubleshooting

### Common Issues

1. **E2E Test Timeouts**
   - Increase timeout in `playwright.config.ts`
   - Check if dev server starts properly

2. **Build Failures**
   - Verify all environment variables are set
   - Check for TypeScript errors

3. **Flaky Tests**
   - Review test selectors for specificity
   - Add proper wait conditions
   - Use data-testid attributes

### Debug Failed Tests

1. Download artifacts from failed workflow
2. Open Playwright HTML report
3. Review traces and screenshots
4. Fix issues and push again

## Adding New Workflows

Create new `.yml` files in this directory following this pattern:

```yaml
name: Workflow Name
on: [trigger]
jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... your steps
```

## Security Notes

- Never commit real secrets to workflows
- Use GitHub Secrets for sensitive data
- Test environment uses dummy credentials
- Production secrets managed separately
