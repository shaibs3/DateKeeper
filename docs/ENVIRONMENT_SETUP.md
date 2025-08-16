# Environment Setup Guide

This guide will help you set up staging and production environments for DateKeeper.

## 🏗️ Environment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LOCAL DEV     │    │    STAGING      │    │   PRODUCTION    │
│                 │    │                 │    │                 │
│ localhost:3000  │ ──▶│ *-staging.vercel│ ──▶│ *.vercel.app    │
│                 │    │                 │    │                 │
│ Local Postgres  │    │ Staging DB      │    │ Production DB   │
│ Test OAuth      │    │ Staging OAuth   │    │ Prod OAuth      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Environment Variables by Environment

### 🟢 Local Development (.env.local)
```bash
NODE_ENV=development
APP_ENV=local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
DATABASE_URL=postgresql://localhost:5432/datekeeper_dev
```

### 🟡 Staging Environment
```bash
NODE_ENV=production
APP_ENV=staging
NEXTAUTH_URL=https://datekeeper-staging.vercel.app
NEXTAUTH_SECRET=your-staging-secret-key
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret
DATABASE_URL=postgresql://user:pass@staging-db-host:5432/datekeeper_staging
RESEND_API_KEY=your-resend-api-key
```

### 🔴 Production Environment
```bash
NODE_ENV=production
APP_ENV=production
NEXTAUTH_URL=https://datekeeper.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
DATABASE_URL=postgresql://user:pass@prod-db-host:5432/datekeeper_production
RESEND_API_KEY=your-resend-api-key
GOOGLE_ANALYTICS_ID=your-ga-id
SENTRY_DSN=your-sentry-dsn
```

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. **Create Staging Database:**
   ```bash
   # In Vercel Dashboard
   Project → Storage → Create Database → Postgres
   Name: datekeeper-staging
   ```

2. **Create Production Database:**
   ```bash
   # In Vercel Dashboard  
   Project → Storage → Create Database → Postgres
   Name: datekeeper-production
   ```

3. **Get Connection Strings:**
   - Copy `POSTGRES_URL` from each database
   - Add to respective environment variables

### Option 2: External PostgreSQL

1. **Staging Database:**
   ```sql
   CREATE DATABASE datekeeper_staging;
   CREATE USER staging_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE datekeeper_staging TO staging_user;
   ```

2. **Production Database:**
   ```sql
   CREATE DATABASE datekeeper_production;
   CREATE USER prod_user WITH PASSWORD 'very_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE datekeeper_production TO prod_user;
   ```

## 🔐 OAuth Setup

### Google OAuth for Each Environment

1. **Go to Google Cloud Console**
2. **Create separate OAuth credentials for each environment:**

#### Local Development
```
Application name: DateKeeper (Local)
Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google
```

#### Staging
```
Application name: DateKeeper (Staging)
Authorized redirect URIs:
- https://datekeeper-staging.vercel.app/api/auth/callback/google
```

#### Production
```
Application name: DateKeeper (Production)  
Authorized redirect URIs:
- https://datekeeper.vercel.app/api/auth/callback/google
- https://your-custom-domain.com/api/auth/callback/google
```

## 🚀 Vercel Deployment Setup

### 1. Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

### 2. Link Project
```bash
vercel link
```

### 3. Set Environment Variables

#### For Staging:
```bash
vercel env add NEXTAUTH_SECRET staging
vercel env add NEXTAUTH_URL staging
vercel env add GOOGLE_CLIENT_ID staging
vercel env add GOOGLE_CLIENT_SECRET staging
vercel env add DATABASE_URL staging
vercel env add APP_ENV staging
```

#### For Production:
```bash
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add DATABASE_URL production
vercel env add APP_ENV production
vercel env add RESEND_API_KEY production
vercel env add GOOGLE_ANALYTICS_ID production
vercel env add SENTRY_DSN production
```

## 🔄 Git Workflow

### Branch Strategy
```
main (production)
├── develop (staging)
    ├── feature/auth-improvements
    ├── feature/event-management
    └── bugfix/oauth-redirect
```

### Deployment Flow
1. **Development:** Work on feature branches
2. **Staging:** Merge to `develop` → auto-deploy to staging
3. **Production:** Merge `develop` to `main` → auto-deploy to production

## 🧪 Testing Strategy

### Local Development
```bash
npm run dev                 # Start local dev server
npm run test:e2e           # Run E2E tests locally
npm run env:check          # Validate environment variables
```

### Staging Testing
```bash
npm run test:e2e:staging   # Run E2E tests against staging
```

### Production Testing
```bash
npm run test:e2e:production # Run smoke tests against production
```

## 📊 Monitoring & Analytics

### Staging Environment
- **Error Tracking:** Sentry (optional)
- **Analytics:** Disabled
- **Logging:** Debug mode enabled

### Production Environment  
- **Error Tracking:** Sentry (required)
- **Analytics:** Google Analytics (required)
- **Logging:** Error level only
- **Uptime Monitoring:** External service

## 🛠️ Utility Scripts

### Check Environment Variables
```bash
npm run env:check
```

### Database Operations
```bash
npm run db:migrate          # Run database migrations
npm run db:generate         # Generate Prisma client
npm run db:studio          # Open Prisma studio
npm run db:seed            # Seed database with test data
```

### Build Commands
```bash
npm run build:staging      # Build for staging
npm run build:production   # Build for production
```

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variable Not Found**
   ```bash
   npm run env:check
   # Check which variables are missing
   ```

2. **Database Connection Failed**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

3. **OAuth Redirect Mismatch**
   - Verify redirect URIs in Google Cloud Console
   - Check NEXTAUTH_URL matches deployment URL

4. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### Environment Validation

Before deploying, always run:
```bash
npm run env:check           # Check environment variables
npm run type-check         # TypeScript validation
npm run lint               # Code quality check
npm test                   # Unit tests
npm run test:e2e          # E2E tests
```

## 📚 Quick Reference

### Environment URLs
- **Local:** http://localhost:3000
- **Staging:** https://datekeeper-staging.vercel.app  
- **Production:** https://datekeeper.vercel.app

### Database Studios
- **Local:** http://localhost:5555 (npm run db:studio)
- **Staging:** Vercel Dashboard → Storage → Staging DB
- **Production:** Vercel Dashboard → Storage → Production DB

### CI/CD Status
- **Staging:** Auto-deploy on push to `develop`
- **Production:** Auto-deploy on push to `main`
- **Tests:** Run on all PRs and deployments
