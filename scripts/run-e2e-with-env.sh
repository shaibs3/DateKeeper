#!/bin/bash

# Run E2E tests with environment variables loaded
# This ensures the tests have access to all required environment variables

set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
    echo "✅ Environment variables loaded from .env.local"
else
    echo "❌ No .env.local file found. Please create one based on .env.example"
    exit 1
fi

# Run the E2E tests
echo "🧪 Running E2E tests..."
npm run test:e2e:clean