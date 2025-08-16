#!/bin/bash

# Google OAuth Setup Helper Script
# This script helps you set up Google OAuth for local development

set -e

echo "🔐 Google OAuth Setup for DateKeeper"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you set up Google OAuth for local development.${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please run 'npm run dev:setup' first to create the development environment."
    exit 1
fi

echo -e "${YELLOW}📋 Prerequisites:${NC}"
echo "1. Google account"
echo "2. Access to Google Cloud Console"
echo "3. 5 minutes of your time"
echo ""

read -p "Ready to proceed? (y/N): " proceed
if [[ ! $proceed =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🌐 Step 1: Open Google Cloud Console${NC}"
echo "URL: https://console.cloud.google.com/"
echo ""
echo "1. Create a new project named 'DateKeeper Development'"
echo "2. Enable the Google+ API"
echo "3. Go to 'APIs & Services' → 'Credentials'"
echo ""

read -p "Press Enter when you've completed Step 1..."

echo ""
echo -e "${BLUE}🔧 Step 2: Create OAuth Client${NC}"
echo ""
echo "1. Click 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "2. Configure the OAuth consent screen if prompted:"
echo "   - Application type: External"
echo "   - Application name: DateKeeper Local"
echo "   - Add your email as test user"
echo ""
echo "3. Create OAuth client with these settings:"
echo "   - Application type: Web application"
echo "   - Name: DateKeeper Local Development"
echo "   - Authorized JavaScript origins: http://localhost:3000"
echo "   - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google"
echo ""

read -p "Press Enter when you've created the OAuth client..."

echo ""
echo -e "${BLUE}📋 Step 3: Enter Your Credentials${NC}"
echo ""

# Get Google Client ID
while true; do
    read -p "Enter your Google Client ID: " client_id
    if [[ $client_id == *".apps.googleusercontent.com" ]]; then
        break
    else
        echo -e "${RED}❌ Client ID should end with '.apps.googleusercontent.com'${NC}"
    fi
done

# Get Google Client Secret
while true; do
    read -s -p "Enter your Google Client Secret: " client_secret
    echo ""
    if [[ ${#client_secret} -gt 10 ]]; then
        break
    else
        echo -e "${RED}❌ Client secret seems too short. Please check and try again.${NC}"
    fi
done

echo ""
echo -e "${BLUE}💾 Updating .env.local...${NC}"

# Update .env.local file
if grep -q "GOOGLE_CLIENT_ID=" .env.local; then
    # Replace existing values
    sed -i '' "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$client_id/" .env.local
    sed -i '' "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$client_secret/" .env.local
else
    # Add new values
    echo "" >> .env.local
    echo "# Google OAuth (added by setup script)" >> .env.local
    echo "GOOGLE_CLIENT_ID=$client_id" >> .env.local
    echo "GOOGLE_CLIENT_SECRET=$client_secret" >> .env.local
fi

echo -e "${GREEN}✅ OAuth credentials saved to .env.local${NC}"
echo ""

# Test the setup
echo -e "${BLUE}🧪 Testing your setup...${NC}"
echo ""

# Validate environment
if npm run env:check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Environment validation passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some environment variables are still missing, but OAuth is configured${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Google OAuth setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to: http://localhost:3000"
echo "3. Click 'Sign In' and test the Google OAuth flow"
echo "4. Check your database: http://localhost:5555"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} If you get 'redirect_uri_mismatch' error, double-check"
echo "that 'http://localhost:3000/api/auth/callback/google' is in your"
echo "authorized redirect URIs in Google Cloud Console."
echo ""

# Offer to start dev server
read -p "Start the development server now? (y/N): " start_dev
if [[ $start_dev =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}🌐 Starting development server...${NC}"
    npm run dev
else
    echo ""
    echo -e "${YELLOW}Run 'npm run dev' when you're ready to test!${NC}"
fi
