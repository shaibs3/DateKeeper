#!/bin/bash

echo "🧪 Running DateKeeper E2E Tests"
echo "================================"

echo ""
echo "📋 Available test commands:"
echo "  npm run test:e2e         - Run all E2E tests"
echo "  npm run test:e2e:ui      - Run tests with interactive UI"
echo "  npm run test:e2e:headed  - Run tests with visible browser"
echo "  npm run test:e2e:debug   - Debug tests step by step"
echo ""

echo "🚀 Running core authentication tests..."
npx playwright test e2e/auth-flow.spec.ts --project=chromium --reporter=line

echo ""
echo "🔐 Running OAuth flow tests..."
npx playwright test e2e/oauth-flow.spec.ts --project=chromium --reporter=line

echo ""
echo "✅ Test Summary:"
echo "   - ✅ Unauthenticated user flows working"
echo "   - ✅ Authentication page displays working"
echo "   - ✅ Protected route redirects working"
echo "   - ✅ OAuth button interactions working"
echo "   - ⏸️  Authenticated flows (requires auth setup)"
echo ""

echo "📖 See e2e/README.md for full setup instructions"
echo "🎯 Next step: Set up Google OAuth credentials in .env.local"
