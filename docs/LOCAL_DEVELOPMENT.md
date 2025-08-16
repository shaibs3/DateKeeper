# Local Development Setup

This guide helps you set up and run DateKeeper locally with a PostgreSQL database.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
npm run dev:setup
```

This will:
- Start PostgreSQL database with Docker
- Run database migrations
- Generate Prisma client
- Optionally start the development server

### Option 2: Manual Setup

1. **Start the database:**
   ```bash
   npm run db:up
   ```

2. **Run migrations:**
   ```bash
   DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev?schema=public" npm run db:migrate
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Seed the database:**
   ```bash
   DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev?schema=public" npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Access

### Database Credentials
- **Host:** localhost:5432
- **Database:** datekeeper_dev
- **Username:** datekeeper
- **Password:** dev_password_123

### Database UIs

**Adminer (Web-based):**
```bash
docker-compose up -d adminer
# Open: http://localhost:8080
```

**Prisma Studio:**
```bash
npm run db:studio
# Open: http://localhost:5555
```

## 🛠️ Available Commands

### Database Commands
```bash
npm run db:up          # Start PostgreSQL with Docker
npm run db:down        # Stop all Docker services
npm run db:logs        # View database logs
npm run db:migrate     # Run database migrations
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with test data
npm run db:reset       # Reset database (danger!)
```

### Development Commands
```bash
npm run dev            # Start Next.js development server
npm run dev:setup      # Full development environment setup
npm run env:check      # Check environment variables
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
npm run lint           # Run ESLint
npm run type-check     # TypeScript validation
```

## 🔧 Environment Variables

Your `.env.local` should contain:

```bash
# Required for development
NODE_ENV=development
APP_ENV=local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-this-for-production
DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev?schema=public"

# Google OAuth (set these up for full functionality)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Optional
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=noreply@localhost
APP_URL=http://localhost:3000
```

## 🧪 Test Data

The database is seeded with:
- **Test User:** test@example.com
- **Sample Events:**
  - John's Birthday (March 15)
  - Wedding Anniversary (June 20)
  - Mom's Birthday (August 10)

## 🐛 Troubleshooting

### Database Issues

**Database not starting:**
```bash
# Check Docker is running
docker --version

# Check logs
npm run db:logs

# Restart database
npm run db:down && npm run db:up
```

**Connection refused:**
```bash
# Wait for database to be ready (takes ~10 seconds)
sleep 10

# Test connection
docker exec datekeeper-postgres pg_isready -U datekeeper -d datekeeper_dev
```

**Schema out of sync:**
```bash
# Reset and recreate database
npm run db:reset

# Or apply migrations manually
DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev?schema=public" npx prisma migrate dev
```

### Environment Issues

**Environment variables not loaded:**
```bash
# Check environment
npm run env:check

# Load variables manually
source .env.local && npm run dev
```

**Google OAuth not working:**
- Set up OAuth credentials in Google Cloud Console
- Add redirect URI: `http://localhost:3000/api/auth/callback/google`
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

### Application Issues

**Build failures:**
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run db:generate

# Check TypeScript
npm run type-check
```

**Port conflicts:**
- PostgreSQL: 5432 (change in docker-compose.yml)
- Next.js: 3000 (change with `npm run dev -- -p 3001`)
- Adminer: 8080
- Prisma Studio: 5555

## 📊 Monitoring

### Database Monitoring
```bash
# Connection count
docker exec datekeeper-postgres psql -U datekeeper -d datekeeper_dev -c "SELECT count(*) FROM pg_stat_activity;"

# Table sizes
docker exec datekeeper-postgres psql -U datekeeper -d datekeeper_dev -c "\dt+"

# Recent activity
npm run db:studio
```

### Application Monitoring
- Next.js dev server shows real-time compilation
- Check browser console for client-side errors
- Check terminal for server-side errors

## 🔄 Git Workflow

1. **Start development:**
   ```bash
   git checkout -b feature/your-feature-name
   npm run dev:setup
   ```

2. **Make changes and test:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run test:e2e
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

## 🎯 Next Steps

1. **Set up Google OAuth** for full authentication
2. **Add Resend API key** for email functionality
3. **Install browser extensions** for React/Next.js development
4. **Configure your IDE** with ESLint and Prettier

Happy coding! 🎉
