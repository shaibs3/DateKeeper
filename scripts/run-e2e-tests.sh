#!/bin/bash

# E2E Test Runner Script
# Handles common issues with Playwright E2E tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 E2E Test Runner${NC}"
echo -e "${BLUE}==================${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Killing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to wait for server
wait_for_server() {
    local url=$1
    local timeout=${2:-60}
    echo -e "${BLUE}⏳ Waiting for server at $url...${NC}"
    
    for i in $(seq 1 $timeout); do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "${RED}❌ Server failed to start within $timeout seconds${NC}"
    return 1
}

# Check if Docker is running (needed for database)
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if database is ready
echo -e "${BLUE}🐘 Starting database...${NC}"
npm run db:up
sleep 3

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
npm run db:migrate:deploy

# Check if something is running on port 3000
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1. Kill existing process and start fresh"
    echo "2. Use existing server"
    echo "3. Exit"
    
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            kill_port 3000
            echo -e "${BLUE}🚀 Starting development server...${NC}"
            npm run dev &
            SERVER_PID=$!
            sleep 5
            ;;
        2)
            echo -e "${BLUE}📡 Using existing server...${NC}"
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
    echo -e "${BLUE}🚀 Starting development server...${NC}"
    npm run dev &
    SERVER_PID=$!
    sleep 5
fi

# Wait for server to be ready
if ! wait_for_server "http://localhost:3000" 60; then
    echo -e "${RED}❌ Server failed to start${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    exit 1
fi

# Run the tests
echo -e "${BLUE}🧪 Running E2E tests...${NC}"

# Parse command line arguments
TEST_ARGS=""
if [ "$1" = "--ui" ]; then
    TEST_ARGS="--ui"
    echo -e "${BLUE}🎮 Running in UI mode${NC}"
elif [ "$1" = "--headed" ]; then
    TEST_ARGS="--headed"
    echo -e "${BLUE}🎬 Running in headed mode${NC}"
elif [ "$1" = "--debug" ]; then
    TEST_ARGS="--debug"
    echo -e "${BLUE}🐛 Running in debug mode${NC}"
fi

# Run Playwright tests
if npx playwright test $TEST_ARGS; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo -e "${BLUE}💡 You can view the test report with: npx playwright show-report${NC}"
    EXIT_CODE=1
fi

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${BLUE}🧹 Cleaning up server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
fi

echo -e "${BLUE}🏁 E2E test run completed${NC}"
exit $EXIT_CODE
