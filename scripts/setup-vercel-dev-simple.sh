#!/bin/bash

# Simple Vercel Development Setup
# Uses .env.local for configuration (much simpler!)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Simple Vercel Development Setup${NC}"
echo "===================================="
echo ""

echo -e "${BLUE}💡 This setup uses .env.local for configuration${NC}"
echo "   • vercel dev automatically reads .env.local"
echo "   • Much simpler than managing Vercel environment variables"
echo "   • Perfect for local development"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel@latest
fi

echo ""
echo -e "${BLUE}🔐 Step 1: Vercel Authentication${NC}"
echo "----------------------------------------"

if ! vercel whoami >/dev/null 2>&1; then
    echo "Please log in to Vercel:"
    vercel login
else
    echo -e "${GREEN}✅ Already logged in to Vercel${NC}"
fi

echo ""
echo -e "${BLUE}📁 Step 2: Link Project (Optional)${NC}"
echo "----------------------------------------"

if [ ! -f ".vercel/project.json" ]; then
    read -p "Do you want to link this project to Vercel for deployments? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Linking project to Vercel..."
        vercel link
    else
        echo -e "${YELLOW}ℹ️  Skipping project linking - you can run 'vercel link' later${NC}"
    fi
else
    echo -e "${GREEN}✅ Project already linked to Vercel${NC}"
fi

echo ""
echo -e "${BLUE}⚙️  Step 3: Environment Configuration${NC}"
echo "----------------------------------------"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    echo ""
    read -p "Do you want to update it for Vercel development? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Keeping existing .env.local${NC}"
        echo "   Make sure it has APP_ENV=development for Vercel dev"
        echo ""
        echo -e "${BLUE}📋 Required variables for Vercel development:${NC}"
        echo "   • APP_ENV=development"
        echo "   • DATABASE_URL=(your cloud database URL)"
        echo "   • GOOGLE_CLIENT_ID=(your OAuth client ID)"
        echo "   • GOOGLE_CLIENT_SECRET=(your OAuth client secret)"
        echo "   • NEXTAUTH_SECRET=(generate with: openssl rand -base64 32)"
        echo ""
        echo -e "${GREEN}✅ Ready to use vercel dev!${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}💾 Database Setup${NC}"
echo "Choose your cloud database provider:"
echo "   1. Neon (PostgreSQL) - Recommended"
echo "   2. Railway (PostgreSQL)" 
echo "   3. Supabase (PostgreSQL)"
echo "   4. Other/Custom"
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
        echo -e "${YELLOW}ℹ️  Custom database setup selected${NC}"
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
echo -e "${BLUE}🔑 OAuth Setup${NC}"
echo "For Google OAuth development credentials:"
echo "1. Go to https://console.cloud.google.com/apis/credentials"
echo "2. Create OAuth 2.0 credentials for development"
echo "3. Add redirect URI: http://localhost:3000/api/auth/callback/google"
echo ""

read -p "Enter your development Google Client ID: " DEV_GOOGLE_CLIENT_ID
read -p "Enter your development Google Client Secret: " DEV_GOOGLE_CLIENT_SECRET

if [ -z "$DEV_GOOGLE_CLIENT_ID" ] || [ -z "$DEV_GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Both Google OAuth credentials are required${NC}"
    exit 1
fi

# Generate NEXTAUTH_SECRET
DEV_NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${BLUE}📝 Creating .env.local${NC}"
echo "----------------------------------------"

# Create .env.local for Vercel development
cat > .env.local <<EOF
# Vercel Development Environment
NODE_ENV=development
APP_ENV=development
APP_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_SECRET=$DEV_NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Configuration (Development)
GOOGLE_CLIENT_ID=$DEV_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$DEV_GOOGLE_CLIENT_SECRET

# Cloud Database Configuration
DATABASE_URL="$DEV_DATABASE_URL"

# Optional: Email Configuration
EMAIL_FROM=dev@datekeeper.app
RESEND_API_KEY=

# Optional: Analytics and Monitoring (leave empty for dev)
GOOGLE_ANALYTICS_ID=
SENTRY_DSN=
EOF

echo -e "${GREEN}✅ Created .env.local for Vercel development${NC}"

echo ""
echo -e "${BLUE}🗄️  Database Setup${NC}"
echo "----------------------------------------"

echo "Setting up database with new configuration..."

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
echo -e "${GREEN}✅ Vercel Development Environment Ready!${NC}"
echo ""

echo -e "${BLUE}🎯 How to Use:${NC}"
echo "   • vercel dev           # Start local development with Vercel"
echo "   • npm run dev:vercel   # Alternative command"
echo "   • vercel deploy        # Deploy to preview environment"
echo ""

echo -e "${BLUE}📋 What's Different:${NC}"
echo "   • .env.local contains all your development config"
echo "   • vercel dev reads .env.local automatically"  
echo "   • No need to manage Vercel environment variables for local dev"
echo "   • Cloud database instead of Docker PostgreSQL"
echo ""

echo -e "${BLUE}🔄 Migration from Docker:${NC}"
echo "   • Your Docker setup is still there as backup"
echo "   • Use 'npm run migrate-from-docker' if you have existing data"
echo "   • You can switch back anytime with 'npm run dev'"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   • Add .env.local to .gitignore (already done)"
echo "   • Never commit .env.local to version control"
echo "   • Use different OAuth credentials for each environment"
echo ""

echo -e "${GREEN}🎉 Ready to start with 'vercel dev'!${NC}"