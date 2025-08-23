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
