#!/bin/bash

# Fix DATABASE_URL in .env.local
# This script adds the correct DATABASE_URL based on your Docker setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing DATABASE_URL in .env.local${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo -e "${YELLOW}Please create .env.local first with your Google OAuth credentials${NC}"
    exit 1
fi

# Database URL based on docker-compose.yml
DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev"

# Check if DATABASE_URL already exists
if grep -q "DATABASE_URL=" .env.local; then
    echo -e "${YELLOW}⚠️  DATABASE_URL already exists in .env.local${NC}"
    echo -e "${BLUE}Current value:${NC}"
    grep "DATABASE_URL=" .env.local
    echo ""
    echo -e "${BLUE}Expected value:${NC}"
    echo "DATABASE_URL=$DATABASE_URL"
    echo ""
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1. Replace existing DATABASE_URL"
    echo "2. Keep existing DATABASE_URL"
    echo "3. Exit"
    
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            # Replace existing DATABASE_URL
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env.local
            else
                # Linux
                sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env.local
            fi
            echo -e "${GREEN}✅ Updated DATABASE_URL in .env.local${NC}"
            ;;
        2)
            echo -e "${GREEN}👍 Keeping existing DATABASE_URL${NC}"
            ;;
        3)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
else
    # Add DATABASE_URL to .env.local
    echo "" >> .env.local
    echo "# Database Configuration (Auto-added by fix-database-url.sh)" >> .env.local
    echo "DATABASE_URL=$DATABASE_URL" >> .env.local
    echo -e "${GREEN}✅ Added DATABASE_URL to .env.local${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Testing database connection...${NC}"

# Test database connection
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}Make sure Docker is running: npm run db:up${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Make sure your Google OAuth credentials are in .env.local"
echo "2. Start your dev server: npm run dev"
echo "3. Go to http://localhost:3000/auth/signup (for new users)"
echo "4. Or go to http://localhost:3000/auth/signin (for existing users)"
