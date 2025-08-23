#!/bin/bash

# Pre-commit verification script
# This script ensures code quality before commits

set -e  # Exit on any error

echo "🔍 Running pre-commit checks..."

echo "📝 Checking linting..."
npm run lint

echo "🎨 Checking formatting..."
npm run format:check

echo "🔧 Checking TypeScript types..."
npm run type-check

echo "🧪 Running tests..."
npm run test

echo "🏗️  Verifying build..."
npm run build

echo "✅ All checks passed! Ready to commit."
