#!/bin/bash

# Migrate from Docker to Vercel Development
# This script helps migrate your existing Docker data to the new Vercel setup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 → ☁️  Docker to Vercel Migration${NC}"
echo "====================================="
echo ""

echo -e "${YELLOW}⚠️  This script will help you migrate from Docker to Vercel development environment.${NC}"
echo ""
echo -e "${BLUE}What this script does:${NC}"
echo "   1. Export data from your existing Docker database"
echo "   2. Import data to your new cloud database"
echo "   3. Verify the migration"
echo "   4. Clean up Docker containers (optional)"
echo ""

read -p "Ready to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 1: Check Docker Database${NC}"
echo "----------------------------------------"

# Check if Docker is running and database is accessible
if ! docker ps | grep postgres > /dev/null; then
    echo -e "${YELLOW}Starting Docker PostgreSQL...${NC}"
    npm run db:up
    sleep 5
fi

if ! docker ps | grep postgres > /dev/null; then
    echo -e "${RED}❌ Docker PostgreSQL is not running. Please start it first with 'npm run db:up'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker database is running${NC}"

# Get Docker database URL
DOCKER_DB_URL="postgresql://datekeeper:dev_password_123@localhost:5432/datekeeper_dev"

echo ""
echo -e "${BLUE}📤 Step 2: Export Docker Database${NC}"
echo "----------------------------------------"

# Create export directory
mkdir -p migration_backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Exporting schema and data..."

# Export schema
docker exec -i $(docker ps --filter "name=postgres" --format "{{.ID}}") pg_dump -U datekeeper -d datekeeper_dev --schema-only > migration_backup/schema_$TIMESTAMP.sql

# Export data
docker exec -i $(docker ps --filter "name=postgres" --format "{{.ID}}") pg_dump -U datekeeper -d datekeeper_dev --data-only > migration_backup/data_$TIMESTAMP.sql

# Export full database as backup
docker exec -i $(docker ps --filter "name=postgres" --format "{{.ID}}") pg_dump -U datekeeper -d datekeeper_dev > migration_backup/full_backup_$TIMESTAMP.sql

echo -e "${GREEN}✅ Database exported to migration_backup/${NC}"

echo ""
echo -e "${BLUE}☁️  Step 3: Prepare Cloud Database${NC}"
echo "----------------------------------------"

echo "Enter your cloud database URL (from your Vercel development setup):"
read -p "Database URL: " CLOUD_DB_URL

if [ -z "$CLOUD_DB_URL" ]; then
    echo -e "${RED}❌ Database URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📥 Step 4: Import to Cloud Database${NC}"
echo "----------------------------------------"

# Set environment for cloud database
export DATABASE_URL="$CLOUD_DB_URL"

echo "Running migrations on cloud database..."
npx prisma migrate deploy

echo ""
echo -e "${YELLOW}Choose import method:${NC}"
echo "   1. Import schema + data (recommended for fresh cloud database)"
echo "   2. Import data only (if schema already exists)"
echo "   3. Skip import (manual import later)"
echo ""

read -p "Select option (1-3): " IMPORT_CHOICE

case $IMPORT_CHOICE in
    1)
        echo "Importing schema and data..."
        
        # Parse database URL to extract connection details
        if [[ $CLOUD_DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASS="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"
        else
            echo -e "${RED}❌ Could not parse database URL${NC}"
            exit 1
        fi
        
        # Import to cloud database
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < migration_backup/full_backup_$TIMESTAMP.sql
        ;;
    2)
        echo "Importing data only..."
        if [[ $CLOUD_DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASS="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"
        else
            echo -e "${RED}❌ Could not parse database URL${NC}"
            exit 1
        fi
        
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < migration_backup/data_$TIMESTAMP.sql
        ;;
    3)
        echo -e "${YELLOW}Skipping automatic import${NC}"
        echo ""
        echo -e "${BLUE}📋 Manual Import Instructions:${NC}"
        echo "   1. Use your database client (psql, pgAdmin, etc.)"
        echo "   2. Connect to: $CLOUD_DB_URL"
        echo "   3. Import: migration_backup/full_backup_$TIMESTAMP.sql"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}✅ Step 5: Verify Migration${NC}"
echo "----------------------------------------"

if [ "$IMPORT_CHOICE" != "3" ]; then
    echo "Testing cloud database connection..."
    
    # Simple connection test
    npm run db:generate
    
    echo "Checking data integrity..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function verify() {
            try {
                const userCount = await prisma.user.count();
                const eventCount = await prisma.dateEvent.count();
                console.log(\`✅ Found \${userCount} users and \${eventCount} events\`);
                await prisma.\$disconnect();
            } catch (error) {
                console.error('❌ Verification failed:', error.message);
                process.exit(1);
            }
        }
        verify();
    "
    
    echo -e "${GREEN}✅ Migration verification completed${NC}"
fi

echo ""
echo -e "${BLUE}🧹 Step 6: Cleanup (Optional)${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}Do you want to stop and remove Docker containers?${NC}"
echo "   (This will free up system resources)"
echo ""

read -p "Stop Docker containers? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping Docker containers..."
    npm run db:down
    
    read -p "Remove Docker volumes (this will delete local data permanently)? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        echo -e "${GREEN}✅ Docker containers and volumes removed${NC}"
    else
        echo -e "${YELLOW}ℹ️  Docker containers stopped, volumes preserved${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo ""

echo -e "${BLUE}📋 Summary:${NC}"
echo "   • Docker data backed up to: migration_backup/"
echo "   • Cloud database is ready for use"
echo "   • Use 'vercel dev' for local development"
echo "   • Use 'npm run dev:vercel' as alternative"
echo ""

echo -e "${BLUE}🔄 Next Steps:${NC}"
echo "   1. Test your application with the cloud database"
echo "   2. Update your development workflow to use Vercel"
echo "   3. Remove Docker commands from your daily workflow"
echo "   4. Keep migration backups safe until confident in new setup"
echo ""

echo -e "${YELLOW}💡 New Development Commands:${NC}"
echo "   • vercel dev                 # Local development with Vercel"
echo "   • npm run dev:vercel         # Alternative local development"
echo "   • vercel env ls              # List environment variables"
echo "   • vercel logs                # View deployment logs"
echo ""

echo -e "${GREEN}✅ Ready to develop with Vercel!${NC}"