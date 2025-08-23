#!/bin/bash

# Development Server Startup Script
# Ensures all environment variables are loaded correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting DateKeeper Development Server${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo -e "${YELLOW}Please create .env.local with your environment variables${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📋 Loading environment variables...${NC}"
set -a  # automatically export all variables
source .env.local
set +a  # stop automatically exporting

# Verify required variables
echo -e "${BLUE}🔍 Checking required environment variables...${NC}"
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    else
        echo -e "${GREEN}✅ $var${NC}"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}   - $var${NC}"
    done
    exit 1
fi

# Check database connection
echo -e "${BLUE}🐘 Testing database connection...${NC}"
if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}Make sure Docker is running: npm run db:up${NC}"
    exit 1
fi

# Kill any existing Next.js processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start the development server
echo -e "${GREEN}🎉 Starting Next.js development server...${NC}"
echo -e "${BLUE}Server will be available at: http://localhost:3000${NC}"
echo -e "${BLUE}Signup page: http://localhost:3000/auth/signup${NC}"
echo -e "${BLUE}Signin page: http://localhost:3000/auth/signin${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start Next.js with environment variables
npm run dev:next
