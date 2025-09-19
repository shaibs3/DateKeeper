#!/bin/bash

# Run tests locally with .env.local configuration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running Tests Locally${NC}"
echo "=========================="
echo ""

# Load .env.local variables
if [ -f ".env.local" ]; then
    echo -e "${BLUE}📄 Loading .env.local...${NC}"
    set -a
    source .env.local
    set +a
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Running database setup...${NC}"

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

echo -e "${GREEN}✅ Database ready${NC}"

echo ""
echo -e "${BLUE}🧪 Running unit tests...${NC}"

# Run unit tests
npm test

echo -e "${GREEN}✅ Unit tests passed${NC}"

echo ""
echo -e "${BLUE}🎭 Running Playwright tests...${NC}"

# Run Playwright tests with simplified setup
npm run test:e2e:simple

echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"