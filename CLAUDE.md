# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

```bash
# Development setup and start
npm run dev:setup          # Complete environment setup (recommended)
npm run dev                # Start development server (requires database)
npm run dev:next           # Start Next.js only (no database setup)

# Code quality and validation
npm run lint               # ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript validation
npm run format             # Prettier formatting
npm run format:check       # Check Prettier formatting

# Testing
npm test                   # Unit tests (Jest)
npm run test:watch         # Unit tests in watch mode
npm run test:coverage      # Unit tests with coverage
npm run test:e2e           # E2E tests (Playwright)
npm run test:e2e:ui        # E2E tests with UI
npm run test:e2e:debug     # Debug E2E tests

# Build and deployment
npm run build              # Production build
npm run build:staging      # Staging build
npm run build:production   # Production build with APP_ENV
```

### Database Commands

```bash
npm run db:up              # Start PostgreSQL with Docker
npm run db:down            # Stop database
npm run db:migrate         # Run database migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio (http://localhost:5555)
npm run db:seed            # Seed with test data
npm run db:reset           # Reset database (destructive)
```

### Inngest Commands

```bash
npx inngest-cli@latest dev # Start Inngest Dev Server (local development)
# Access Inngest Dashboard at http://localhost:8288
```

## Architecture Overview

### Tech Stack

- **Frontend:** Next.js 15 with App Router, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, NextAuth.js v5 (beta)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Google OAuth 2.0 with custom sign-up/sign-in flow logic
- **Testing:** Jest (unit), Playwright (E2E), React Testing Library

### Key Architecture Patterns

#### Authentication Flow

- NextAuth.js with custom callbacks in `src/lib/auth.ts:37-72`
- Separate sign-up and sign-in flows with URL parameter detection
- Google OAuth with `select_account consent` prompt
- Custom error handling for user registration states

#### Database Architecture

- Prisma schema with User, Account, Session, DateEvent models
- Multi-environment support via `APP_ENV` (local, staging, production)
- Docker Compose setup for local PostgreSQL development
- Database URL: `postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev`

#### Configuration Management

- Centralized config in `src/lib/config.ts` with environment validation
- Environment-specific feature flags and settings
- Required environment variables validated at startup

#### Component Structure

- App Router layout with authenticated/unauthenticated states
- Event management components in `src/components/events/`
- Reusable components with TypeScript interfaces
- Header components for different authentication states

### Development Environment

#### Required Environment Variables

```bash
NEXTAUTH_SECRET=local-dev-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev"
RESEND_API_KEY=your-resend-api-key
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

#### Test Data

- Test user: `test@example.com`
- Sample events for John's Birthday, Wedding Anniversary, Mom's Birthday
- Seeded via `prisma/seed.ts`

### Testing Strategy

#### Unit Tests (Jest)

- Components in `__tests__` directories
- React Testing Library for component testing
- Path mapping: `@/` resolves to `src/`
- Test files: `**/__tests__/**/*.[jt]s?(x)` and `**/?(*.)+(spec|test).[jt]s?(x)`

#### E2E Tests (Playwright)

- Located in `e2e/` directory
- Authentication flows, registration, and user workflows
- Cross-browser testing (Chrome, Firefox, Safari, Mobile)
- Test helpers in `e2e/test-helpers/`
- Automatic server startup for local testing

### Important Development Notes

#### Database Development

- Always use `npm run db:up` before development
- Docker must be running for database
- Prisma generates client automatically on build
- Use `npm run db:studio` for database inspection

#### Authentication Development

- Sign-up and sign-in are separate flows with different logic
- URL parameter `signup=true` determines registration vs login
- User existence checked before allowing sign-in
- Custom error pages for authentication failures

#### Environment Management

- `APP_ENV` controls environment-specific features
- Development environment has debug mode enabled
- Staging and production have different notification settings
- Feature flags in `src/lib/config.ts:44-49`

#### Code Style

- ESLint with Next.js, TypeScript, and Prettier configs
- Path imports use `@/` alias for `src/`
- Tailwind CSS for styling
- React 18 with TypeScript throughout

**IMPORTANT: Code Formatting Requirements**

- **ALWAYS run `npm run format` after making ANY code changes**
- **BEFORE committing, ALWAYS run `npm run format:check`**
- **If `npm run format:check` fails, the commit MUST be rejected**
- **Never commit code that doesn't pass formatting checks**

**Pre-Commit Checklist:**

1. Run `npm run format` to auto-fix formatting
2. **Run `npm run format:check` to verify formatting** (REQUIRED - commits MUST be rejected if formatting check fails)
3. Run `npm run lint` to check for linting issues
4. Run `npm run type-check` to verify TypeScript
5. **Run `npm test` to verify all unit tests pass** (REQUIRED - commits MUST be rejected if ANY tests fail)
6. Run `npm audit` to check for security vulnerabilities
7. Only proceed with commit if ALL checks pass

**IMPORTANT: Unit Test Validation**

- **ALL unit tests must pass before each commit**
- **Never commit code with failing tests**
- **If tests fail, fix the issues or update the tests before committing**
- **Use `npm run test:watch` during development to catch issues early**

### Multi-Environment Setup

- **Local:** `APP_ENV=local` with full debugging
- **Staging:** `APP_ENV=staging` deployed to Vercel
- **Production:** `APP_ENV=production` with analytics and error tracking

### Quick Start for New Features

1. Start development environment: `npm run dev:setup`
2. Create feature branch from main
3. Run tests: `npm test && npm run test:e2e`
4. Check code quality: `npm run lint && npm run type-check`
5. Test against staging: `npm run test:e2e:staging` (if deployed)

## Email Notifications System

### Inngest Integration

- **Functions:** `src/inngest/functions.ts`
- **API Route:** `src/app/api/inngest/route.ts`
- **Client:** `src/inngest/client.ts`
- **Schedule:** Daily at midnight UTC via Inngest cron triggers
- **Email Service:** Resend API with `RESEND_API_KEY`
- **Reliability:** Built-in retries, error handling, and monitoring via Inngest dashboard

### Reminder Types

The system supports 5 reminder types with extensible configuration:

```typescript
const REMINDER_CONFIGS: ReminderConfig[] = [
  { type: '1_DAY', days: 1, displayName: 'tomorrow' },
  { type: '3_DAYS', days: 3, displayName: 'in 3 days' },
  { type: '1_WEEK', days: 7, displayName: 'in 1 week' },
  { type: '2_WEEKS', days: 14, displayName: 'in 2 weeks' },
  { type: '1_MONTH', days: 30, displayName: 'in 1 month' },
];
```

### Error Handling & Retry Logic

- **Retry Strategy:** Exponential backoff (1s, 2s, 4s)
- **Max Retries:** 3 attempts per email
- **Error Logging:** Comprehensive failure tracking
- **Graceful Degradation:** System continues processing other users on individual failures

## Testing Guidelines

### Unit Testing Best Practices

- **Coverage Threshold:** 30% global, 80% for critical API routes
- **Test Files:** Place in `__tests__` directories alongside components
- **Mocking Strategy:** Mock external dependencies (Prisma, Resend)
- **Environment:** Use Node.js environment for API tests, JSDOM for component tests

### Test Coverage Commands

```bash
npm run test:coverage           # Generate coverage report
npm run test:coverage:watch     # Coverage in watch mode
npm run test:coverage:threshold # Enforce coverage thresholds
```

### E2E Testing Strategy

- **Authentication Flows:** Google OAuth, sign-up/sign-in differentiation
- **Event Management:** CRUD operations, date validation
- **Cross-Browser:** Chrome, Firefox, Safari, Mobile viewports
- **Environment Testing:** Local, staging, production validation

### Test Data Management

- **Seed Data:** Use `npm run db:seed` for consistent test data
- **Test User:** `test@example.com` with pre-configured events
- **Database Reset:** `npm run db:reset` for clean state

## Code Quality Standards

### TypeScript Configuration

- **Strict Mode:** Enabled for type safety
- **Path Mapping:** `@/` alias for `src/` directory
- **Type Definitions:** Custom types in `src/types/`
- **Prisma Types:** Auto-generated from schema

### Component Architecture

- **React Patterns:** Functional components with hooks
- **State Management:** Local state with React hooks, no external state manager
- **Props Validation:** TypeScript interfaces for all props
- **Error Boundaries:** Implement for production error handling

### API Route Patterns

- **Authentication:** Verify user sessions for protected routes
- **Error Handling:** Consistent error responses with proper HTTP status codes
- **Input Validation:** Validate and sanitize all inputs
- **Database Operations:** Use Prisma transactions for complex operations

## Security Guidelines

### Authentication & Authorization

- **NextAuth.js:** Google OAuth 2.0 with custom callbacks
- **Session Management:** Secure session tokens with proper expiration
- **CSRF Protection:** Built-in NextAuth.js CSRF protection
- **Environment Secrets:** Never commit secrets, use `.env.local`

### Database Security

- **Connection Security:** SSL-enabled PostgreSQL connections in production
- **Query Safety:** Prisma prevents SQL injection
- **User Data:** Encrypt sensitive data at rest
- **Access Control:** Role-based access (future enhancement)

### Email Security

- **API Keys:** Secure Resend API key storage
- **Content Validation:** Sanitize email content
- **Rate Limiting:** Implement email sending limits
- **Unsubscribe:** Provide opt-out mechanisms

## Performance Optimization

### Frontend Performance

- **Next.js Optimization:** Leverage built-in optimizations (Image, Link components)
- **Bundle Analysis:** Use `npm run analyze` to check bundle size
- **Lazy Loading:** Implement for non-critical components
- **Caching:** Utilize Next.js caching strategies

### Database Performance

- **Query Optimization:** Use Prisma query optimization
- **Indexing:** Proper database indexes for frequent queries
- **Connection Pooling:** Configure for production workloads
- **Migrations:** Version-controlled schema changes

### API Performance

- **Response Caching:** Cache static responses where appropriate
- **Pagination:** Implement for large data sets
- **Background Jobs:** Use Inngest for reliable job processing and workflows
- **Error Handling:** Fast-fail strategies for better UX

## Deployment & CI/CD

### Branch Strategy

- **main:** Production deployments
- **develop:** Staging deployments (if implemented)
- **feature/\*:** Feature development branches
- **hotfix/\*:** Emergency production fixes

### GitHub Actions Workflows

- **Test Coverage:** Automated coverage reporting on PRs
- **Code Quality:** ESLint, TypeScript, and Prettier checks
- **E2E Testing:** Automated browser testing (when configured)
- **Security Scanning:** Dependency vulnerability checks

### Environment Management

- **Local:** Full development environment with Docker
- **Staging:** Vercel preview deployments for testing
- **Production:** Vercel production with analytics and monitoring

## Monitoring & Observability

### Error Tracking

- **Console Logging:** Structured logging for debugging
- **Error Boundaries:** React error boundary implementation
- **API Error Handling:** Consistent error response format
- **Email Failure Tracking:** Comprehensive notification failure logs

### Performance Monitoring

- **Core Web Vitals:** Monitor loading, interactivity, visual stability
- **API Response Times:** Track endpoint performance
- **Database Query Performance:** Monitor slow queries
- **Email Delivery Rates:** Track notification success rates

## Important Instruction Reminders

### Development Workflow

- **NEVER create files unless they're absolutely necessary for achieving your goal**
- **ALWAYS prefer editing an existing file to creating a new one**
- **NEVER proactively create documentation files (\*.md) or README files unless explicitly requested**
- **ALWAYS run formatting commands before committing:**
  1. `npm run format` - Auto-fix formatting
  2. `npm run format:check` - Verify formatting
  3. `npm run lint` - Check for linting issues
  4. `npm run type-check` - Verify TypeScript

### Code Standards

- **Follow existing patterns** - Study the codebase before implementing new features
- **Use TypeScript strictly** - No `any` types unless absolutely necessary
- **Test coverage** - Maintain or improve existing coverage percentages
- **Security first** - Never commit secrets, validate all inputs

### Communication

- **Be concise** - Keep responses short and actionable
- **Ask before major changes** - Confirm architectural decisions
- **Document decisions** - Update relevant documentation when making changes
- **Use conventional commits** - Follow commit message standards

### Error Handling

- **Graceful degradation** - Applications should work even when services are down
- **User-friendly errors** - Provide helpful error messages to users
- **Comprehensive logging** - Log errors with context for debugging
- **Recovery strategies** - Implement retry logic where appropriate
