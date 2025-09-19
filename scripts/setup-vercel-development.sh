#!/bin/bash

# Setup Vercel Development Environment
# This script helps configure Vercel Development environment to replace Docker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Vercel Development Environment Setup${NC}"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel@latest
fi

echo -e "${BLUE}📋 This script will set up Vercel Development environment to replace Docker.${NC}"
echo ""
echo -e "${YELLOW}Before proceeding, you'll need:${NC}"
echo "   1. A Vercel account"
echo "   2. A cloud database (Neon, Railway, or Supabase)"
echo "   3. Google OAuth credentials for development"
echo ""

read -p "Ready to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Step 1: Vercel Authentication${NC}"
echo "----------------------------------------"
echo "Logging into Vercel..."

if ! vercel whoami >/dev/null 2>&1; then
    echo "Please log in to Vercel:"
    vercel login
else
    echo -e "${GREEN}✅ Already logged in to Vercel${NC}"
fi

echo ""
echo -e "${BLUE}📁 Step 2: Link Project${NC}"
echo "----------------------------------------"

# Check if project is already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "Linking project to Vercel..."
    vercel link
else
    echo -e "${GREEN}✅ Project already linked to Vercel${NC}"
fi

echo ""
echo -e "${BLUE}💾 Step 3: Database Setup${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}Choose your database provider:${NC}"
echo "   1. Neon (PostgreSQL) - Recommended"
echo "   2. Railway (PostgreSQL)"
echo "   3. Supabase (PostgreSQL)"
echo "   4. I'll set up database manually"
echo ""

read -p "Select option (1-4): " DB_CHOICE

case $DB_CHOICE in
    1)
        echo ""
        echo -e "${BLUE}🐘 Neon Database Setup${NC}"
        echo "1. Go to https://neon.tech"
        echo "2. Create a new project (or use existing)"
        echo "3. Create a database branch for development"
        echo "4. Copy the connection string"
        ;;
    2)
        echo ""
        echo -e "${BLUE}🚂 Railway Database Setup${NC}"
        echo "1. Go to https://railway.app"
        echo "2. Create a PostgreSQL service"
        echo "3. Copy the connection string from Variables tab"
        ;;
    3)
        echo ""
        echo -e "${BLUE}⚡ Supabase Database Setup${NC}"
        echo "1. Go to https://supabase.com"
        echo "2. Create a new project"
        echo "3. Go to Settings → Database"
        echo "4. Copy the connection string (URI format)"
        ;;
    4)
        echo -e "${YELLOW}ℹ️  Manual database setup selected${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
read -p "Enter your development database URL: " DEV_DATABASE_URL

if [ -z "$DEV_DATABASE_URL" ]; then
    echo -e "${RED}❌ Database URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔑 Step 4: OAuth Setup${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}Google OAuth Setup for Development:${NC}"
echo "1. Go to https://console.cloud.google.com/apis/credentials"
echo "2. Create OAuth 2.0 credentials for development"
echo "3. Add authorized redirect URI: https://<your-dev-url>/api/auth/callback/google"
echo ""

read -p "Enter your development Google Client ID: " DEV_GOOGLE_CLIENT_ID
read -p "Enter your development Google Client Secret: " DEV_GOOGLE_CLIENT_SECRET

if [ -z "$DEV_GOOGLE_CLIENT_ID" ] || [ -z "$DEV_GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Both Google OAuth credentials are required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}⚙️  Step 5: Environment Variables Setup${NC}"
echo "----------------------------------------"

# Generate NEXTAUTH_SECRET
DEV_NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "Setting up Vercel environment variables for development..."

# Set environment variables in Vercel for development
vercel env add APP_ENV development development <<< "development"
vercel env add DATABASE_URL development <<< "$DEV_DATABASE_URL"
vercel env add GOOGLE_CLIENT_ID development <<< "$DEV_GOOGLE_CLIENT_ID"
vercel env add GOOGLE_CLIENT_SECRET development <<< "$DEV_GOOGLE_CLIENT_SECRET"
vercel env add NEXTAUTH_SECRET development <<< "$DEV_NEXTAUTH_SECRET"

echo -e "${GREEN}✅ Environment variables set in Vercel${NC}"

echo ""
echo -e "${BLUE}📝 Step 6: Local Environment File${NC}"
echo "----------------------------------------"

# Create .env.development for local reference
cat > .env.development <<EOF
# Vercel Development Environment Variables
# DO NOT COMMIT THIS FILE - Add to .gitignore

APP_ENV=development
DATABASE_URL="$DEV_DATABASE_URL"
GOOGLE_CLIENT_ID="$DEV_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="$DEV_GOOGLE_CLIENT_SECRET"
NEXTAUTH_SECRET="$DEV_NEXTAUTH_SECRET"
NEXTAUTH_URL="https://\$(vercel inspect --scope=\$(vercel whoami) | grep url | cut -d'"' -f4)"

# Optional: Email and Analytics (add if needed)
# RESEND_API_KEY=
# GOOGLE_ANALYTICS_ID=
# SENTRY_DSN=
EOF

echo -e "${GREEN}✅ Created .env.development for reference${NC}"

# Update .gitignore to include development env file
if ! grep -q "\.env\.development" .gitignore; then
    echo ".env.development" >> .gitignore
    echo -e "${GREEN}✅ Added .env.development to .gitignore${NC}"
fi

echo ""
echo -e "${BLUE}🗄️  Step 7: Database Migration${NC}"
echo "----------------------------------------"

echo "Running database migrations for development..."

# Set temporary environment variables for migration
export APP_ENV=development
export DATABASE_URL="$DEV_DATABASE_URL"

# Generate Prisma client and run migrations
npm run db:generate
npx prisma migrate deploy

# Optional: Seed development database
read -p "Do you want to seed the development database with test data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    echo -e "${GREEN}✅ Development database seeded${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Step 8: Deployment${NC}"
echo "----------------------------------------"

echo "Deploying to Vercel development environment..."
vercel --env APP_ENV=development

echo ""
echo -e "${GREEN}✅ Vercel Development Environment Setup Complete!${NC}"
echo ""

echo -e "${BLUE}🔗 Your Development Environment:${NC}"
DEV_URL=$(vercel inspect --scope=$(vercel whoami 2>/dev/null) 2>/dev/null | grep url | cut -d'"' -f4 2>/dev/null || echo "Check Vercel dashboard")
echo "   • Development URL: $DEV_URL"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
echo "   • Database: Connected to your cloud database"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Update Google OAuth redirect URI with your development URL"
echo "   2. Test authentication and database operations"
echo "   3. Use 'vercel dev' for local development with Vercel environment"
echo "   4. Use 'vercel --prod' for production deployments"
echo ""

echo -e "${BLUE}💡 Commands for Vercel Development:${NC}"
echo "   • vercel dev                    # Local development with Vercel functions"
echo "   • vercel --env APP_ENV=development  # Deploy to development"
echo "   • vercel env ls                 # List environment variables"
echo "   • vercel logs                   # View deployment logs"
echo ""

echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "   • Your Docker PostgreSQL setup is no longer needed"
echo "   • Use 'vercel dev' instead of 'npm run dev' for local development"
echo "   • All environment variables are managed in Vercel dashboard"
echo "   • Database is now hosted in the cloud (no Docker required)"
echo ""

echo -e "${GREEN}🎉 Ready to develop with Vercel!${NC}"