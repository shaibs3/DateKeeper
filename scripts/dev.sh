#!/bin/bash

# Development Environment Startup Script
# This script starts all necessary services for local development

set -e

echo "🚀 Starting DateKeeper Development Environment"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Set environment variables
export DATABASE_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev?schema=public"

echo -e "${BLUE}🗄️  Starting PostgreSQL database...${NC}"
npm run db:up

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 5

# Check if database is responding
if docker exec datekeeper-postgres pg_isready -U datekeeper -d datekeeper_dev > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready!${NC}"
else
    echo -e "${RED}❌ Database is not responding. Check logs with: npm run db:logs${NC}"
    exit 1
fi

# Check if migrations are needed
echo -e "${BLUE}🔄 Checking database schema...${NC}"
if ! npx prisma migrate status --schema=prisma/schema.prisma > /dev/null 2>&1; then
    echo -e "${YELLOW}📊 Running database migrations...${NC}"
    npx prisma migrate dev --name auto_dev
fi

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npm run db:generate

echo ""
echo -e "${GREEN}✅ Development environment ready!${NC}"
echo ""
echo -e "${BLUE}📊 Available services:${NC}"
echo "   • PostgreSQL:     localhost:5432"
echo "   • Database UI:    http://localhost:8080 (Adminer)"
echo "   • Prisma Studio:  http://localhost:5555 (run 'npm run db:studio')"
echo ""
echo -e "${BLUE}🛠️  Useful commands:${NC}"
echo "   • npm run dev           - Start Next.js development server"
echo "   • npm run db:studio     - Open Prisma Studio"
echo "   • npm run db:logs       - View database logs"
echo "   • npm run db:down       - Stop database"
echo "   • npm run env:check     - Check environment variables"
echo ""

# Optionally start the development server
read -p "Start Next.js development server? (y/N): " start_dev

if [[ $start_dev =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🌐 Starting Next.js development server...${NC}"
    npm run dev
else
    echo -e "${YELLOW}💡 Run 'npm run dev' when you're ready to start coding!${NC}"
fi
