# 🎂 DateKeeper

[![Tests](https://img.shields.io/badge/tests-258%20passing-brightgreen)](https://github.com/shaibs3/DateKeeper/actions)
[![Coverage](https://img.shields.io/badge/coverage-51.98%25-orange)](https://github.com/shaibs3/DateKeeper/actions)
[![API Coverage](https://img.shields.io/badge/API%20routes-100%25-brightgreen)](https://github.com/shaibs3/DateKeeper/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Never miss an important date again! DateKeeper helps you remember birthdays, anniversaries, and other special events with timely reminders via email, SMS, or WhatsApp.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google
- 🎂 **Event Management** - Add, edit, and delete special events
- 🔄 **Recurring Events** - Yearly birthdays and anniversaries
- 🔔 **Multi-Channel Notifications** - Email, SMS, and WhatsApp reminders
- 📱 **Responsive Design** - Works on desktop and mobile
- 🧪 **Comprehensive Testing** - Unit and E2E tests with Playwright

## 🚀 Quick Start again

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd DateKeeper
npm install
```

### 2. Start Development Environment

```bash
# Automated setup (recommended)
npm run dev:setup
```

This will:

- ✅ Start PostgreSQL database with Docker
- ✅ Run database migrations
- ✅ Generate Prisma client
- ✅ Seed with test data
- ✅ Optionally start the development server

### 3. Access Your Application

- **App:** http://localhost:3000
- **Database UI:** http://localhost:5555 (Prisma Studio)
- **Health Check:** http://localhost:3000/api/health

## 🛠️ Development Commands

### Quick Start

```bash
npm run dev:setup      # Complete environment setup
npm run dev           # Start Next.js development server
```

### Database Management

```bash
npm run db:up         # Start PostgreSQL with Docker
npm run db:down       # Stop database
npm run db:studio     # Open Prisma Studio (database UI)
npm run db:seed       # Populate with test data
npm run db:migrate    # Run database migrations
npm run db:logs       # View database logs
```

### Testing & Quality

```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:e2e:ui   # E2E tests with UI
npm run lint          # ESLint
npm run type-check    # TypeScript validation
npm run env:check     # Environment validation
```

## 🏗️ Architecture

### Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, NextAuth.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Google OAuth 2.0
- **Testing:** Jest (unit), Playwright (E2E)
- **Deployment:** Vercel with CI/CD

### Project Structure

```
DateKeeper/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript definitions
├── prisma/                  # Database schema and migrations
├── e2e/                     # End-to-end tests
├── docs/                    # Documentation
└── scripts/                 # Development scripts
```

## 🗄️ Database

### Local Development

Your local database includes:

- **Test User:** `test@example.com`
- **Sample Events:** 3 pre-loaded events for testing

### Schema

- **Users** - Google OAuth user profiles
- **DateEvents** - Birthdays, anniversaries, etc.
- **Sessions/Accounts** - NextAuth.js authentication

## 🔧 Configuration

### Required Environment Variables

```bash
# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev
```

### Optional Environment Variables

```bash
# Email notifications
RESEND_API_KEY=your-resend-api-key

# Analytics & monitoring
GOOGLE_ANALYTICS_ID=your-ga-id
SENTRY_DSN=your-sentry-dsn
```

## 🚀 Deployment

### Staging Environment

- **URL:** https://datekeeper-staging.vercel.app
- **Trigger:** Push to `develop` branch
- **Database:** Separate staging database

### Production Environment

- **URL:** https://datekeeper.vercel.app
- **Trigger:** Push to `main` branch
- **Database:** Production database

### Manual Deployment

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

## 🧪 Testing

### Running Tests Locally

```bash
# Unit tests
npm test                    # Run all unit tests (258 tests)
npm run test:watch          # Unit tests in watch mode
npm run test:coverage       # Unit tests with coverage report

# E2E tests (requires app running)
npm run test:e2e           # Run end-to-end tests
npm run test:e2e:ui        # E2E tests with visual UI
npm run test:e2e:debug     # E2E tests with debugging
```

### Test Coverage

**📊 Current Test Statistics:**

- **258 total tests** - All passing ✅
- **46 API route tests** - 100% coverage of all CRUD operations
- **202 component tests** - React component testing with RTL
- **10 E2E tests** - Cross-browser compatibility testing

**🎯 Coverage Breakdown:**

- **API Routes**: 100% coverage (Events, CRUD, Email notifications)
- **Authentication**: Complete session validation and authorization testing
- **Error Scenarios**: Database failures, malformed requests, edge cases
- **Business Logic**: Event creation, updates, deletions with validation
- **Email System**: 95.65% branch coverage with retry logic testing

**🔍 What's Tested:**

- ✅ Authentication flows and session management
- ✅ Event CRUD operations with authorization
- ✅ Email notification system with retry logic
- ✅ Database error handling and edge cases
- ✅ Input validation and security checks
- ✅ React component rendering and interactions
- ✅ Cross-browser E2E workflows

## 📚 Documentation

- **[Local Development Guide](docs/LOCAL_DEVELOPMENT.md)** - Detailed setup instructions
- **[Environment Setup](docs/ENVIRONMENT_SETUP.md)** - Multi-environment configuration
- **[E2E Testing Guide](e2e/README.md)** - Testing documentation

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Run tests:** `npm test && npm run test:e2e`
4. **Commit changes:** `git commit -m 'feat: add amazing feature'`
5. **Push to branch:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Workflow

- `develop` branch for staging
- `main` branch for production
- Feature branches for new development
- Automated CI/CD on all branches

## 🆘 Troubleshooting

### Common Issues

**Database not starting:**

```bash
# Check Docker is running
docker --version

# Restart database
npm run db:down && npm run db:up
```

**Environment variables missing:**

```bash
# Check what's missing
npm run env:check

# Copy example file
cp .env.example .env.local
```

**Authentication not working:**

- Set up Google OAuth credentials
- Check redirect URLs match
- Verify environment variables

For more help, see [Local Development Guide](docs/LOCAL_DEVELOPMENT.md).

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding!** 🎉 If you have questions, check the docs or open an issue.
