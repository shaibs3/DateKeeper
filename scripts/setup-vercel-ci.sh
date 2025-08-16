#!/bin/bash

# Setup Vercel CI/CD Integration
# This script helps configure Vercel for GitHub Actions deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Vercel CI/CD Setup for DateKeeper${NC}"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel@latest
fi

echo -e "${BLUE}📋 This script will help you set up Vercel for GitHub Actions deployment.${NC}"
echo ""
echo -e "${YELLOW}Before proceeding, make sure you have:${NC}"
echo "   1. A Vercel account"
echo "   2. Admin access to your GitHub repository"
echo "   3. Two Vercel projects created (staging & production)"
echo ""

read -p "Ready to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Step 1: Get Vercel Token${NC}"
echo "----------------------------------------"
echo "1. Go to https://vercel.com/account/tokens"
echo "2. Create a new token named 'GitHub Actions - DateKeeper'"
echo "3. Copy the token"
echo ""

read -p "Enter your Vercel token: " VERCEL_TOKEN

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ Vercel token is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🏢 Step 2: Get Organization ID${NC}"
echo "----------------------------------------"

# Get org ID using Vercel CLI
echo "Getting organization ID..."
vercel teams ls --token="$VERCEL_TOKEN" 2>/dev/null || true

echo ""
read -p "Enter your Vercel Team/Organization ID (or press Enter for personal account): " VERCEL_ORG_ID

if [ -z "$VERCEL_ORG_ID" ]; then
    echo -e "${YELLOW}ℹ️  Using personal account${NC}"
fi

echo ""
echo -e "${BLUE}📁 Step 3: Project Configuration${NC}"
echo "----------------------------------------"

# List projects
echo "Your Vercel projects:"
vercel projects ls --token="$VERCEL_TOKEN" 2>/dev/null || true

echo ""
echo -e "${YELLOW}Enter your project IDs:${NC}"
read -p "Staging project ID (e.g., datekeeper-staging): " STAGING_PROJECT_ID
read -p "Production project ID (e.g., datekeeper): " PRODUCTION_PROJECT_ID

if [ -z "$STAGING_PROJECT_ID" ] || [ -z "$PRODUCTION_PROJECT_ID" ]; then
    echo -e "${RED}❌ Both project IDs are required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 4: Environment Setup${NC}"
echo "----------------------------------------"

# Create .env.vercel for local testing
cat > .env.vercel <<EOF
# Vercel CI/CD Configuration
VERCEL_TOKEN=$VERCEL_TOKEN
VERCEL_ORG_ID=$VERCEL_ORG_ID
VERCEL_STAGING_PROJECT_ID=$STAGING_PROJECT_ID
VERCEL_PRODUCTION_PROJECT_ID=$PRODUCTION_PROJECT_ID
EOF

echo -e "${GREEN}✅ Created .env.vercel for local testing${NC}"

echo ""
echo -e "${BLUE}📝 Step 5: GitHub Secrets Setup${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}Add these secrets to your GitHub repository:${NC}"
echo ""
echo "Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/secrets/actions"
echo ""
echo -e "${GREEN}Required Secrets:${NC}"
echo "VERCEL_TOKEN = $VERCEL_TOKEN"
if [ ! -z "$VERCEL_ORG_ID" ]; then
    echo "VERCEL_ORG_ID = $VERCEL_ORG_ID"
fi
echo "VERCEL_PROJECT_ID = $PRODUCTION_PROJECT_ID"
echo ""

echo -e "${BLUE}🌍 Step 6: Environment Variables${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}Make sure these environment variables are set in both Vercel projects:${NC}"
echo ""
echo -e "${GREEN}Staging Project:${NC}"
echo "APP_ENV = staging"
echo "DATABASE_URL = (your staging database URL)"
echo "GOOGLE_CLIENT_ID = (your OAuth client ID)"
echo "GOOGLE_CLIENT_SECRET = (your OAuth client secret)"
echo "NEXTAUTH_URL = https://datekeeper-staging.vercel.app"
echo "NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)"
echo ""
echo -e "${GREEN}Production Project:${NC}"
echo "APP_ENV = production"
echo "DATABASE_URL = (your production database URL)"
echo "GOOGLE_CLIENT_ID = (your OAuth client ID)"
echo "GOOGLE_CLIENT_SECRET = (your OAuth client secret)"
echo "NEXTAUTH_URL = https://datekeeper.vercel.app"
echo "NEXTAUTH_SECRET = (same as staging or generate new)"
echo ""

echo -e "${BLUE}🧪 Step 7: Testing${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}Test the setup:${NC}"
echo "1. Push changes to main branch"
echo "2. Check GitHub Actions for deployment status"
echo "3. Verify staging deployment: https://datekeeper-staging.vercel.app"
echo "4. Verify production deployment: https://datekeeper.vercel.app"
echo ""

echo -e "${GREEN}✅ Vercel CI/CD setup complete!${NC}"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "   • GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
echo "   • Staging App: https://datekeeper-staging.vercel.app"
echo "   • Production App: https://datekeeper.vercel.app"
echo ""

echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Add the GitHub secrets listed above"
echo "2. Configure environment variables in Vercel projects"
echo "3. Push to main branch to trigger first deployment"
echo "4. Monitor the deployment pipeline in GitHub Actions"
