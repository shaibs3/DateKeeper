#!/bin/bash

# Environment Setup Script for DateKeeper
# This script helps you set up staging and production environments

set -e

echo "🏗️  DateKeeper Environment Setup"
echo "================================"
echo ""

# Check if required tools are installed
check_tools() {
    echo "🔍 Checking required tools..."
    
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Please install it:"
        echo "   npm install -g vercel"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo "⚠️  PostgreSQL CLI not found. You may need it for database operations."
    fi
    
    echo "✅ Tools check complete"
    echo ""
}

# Generate secure secrets
generate_secrets() {
    echo "🔐 Generating secure secrets..."
    
    local staging_secret=$(openssl rand -base64 32)
    local prod_secret=$(openssl rand -base64 32)
    
    echo "📝 Generated secrets (save these securely):"
    echo "Staging NEXTAUTH_SECRET: $staging_secret"
    echo "Production NEXTAUTH_SECRET: $prod_secret"
    echo ""
}

# Setup Vercel project
setup_vercel() {
    echo "🚀 Setting up Vercel project..."
    
    if [ ! -f ".vercel/project.json" ]; then
        echo "Linking Vercel project..."
        vercel link
    else
        echo "✅ Vercel project already linked"
    fi
    echo ""
}

# Environment setup instructions
environment_instructions() {
    echo "📋 Next Steps:"
    echo "=============="
    echo ""
    echo "1. 🗄️  Set up databases:"
    echo "   • Go to Vercel Dashboard → Your Project → Storage"
    echo "   • Create 'datekeeper-staging' PostgreSQL database"
    echo "   • Create 'datekeeper-production' PostgreSQL database"
    echo "   • Copy connection strings"
    echo ""
    echo "2. 🔐 Set up Google OAuth:"
    echo "   • Go to Google Cloud Console"
    echo "   • Create OAuth credentials for each environment:"
    echo "     - Local: http://localhost:3000/api/auth/callback/google"
    echo "     - Staging: https://datekeeper-staging.vercel.app/api/auth/callback/google"  
    echo "     - Production: https://datekeeper.vercel.app/api/auth/callback/google"
    echo ""
    echo "3. ⚙️  Set environment variables:"
    echo "   • Run: vercel env add VARIABLE_NAME staging"
    echo "   • Run: vercel env add VARIABLE_NAME production"
    echo "   • See docs/ENVIRONMENT_SETUP.md for complete list"
    echo ""
    echo "4. 🚀 Deploy:"
    echo "   • Push to 'develop' branch → auto-deploy to staging"
    echo "   • Push to 'main' branch → auto-deploy to production"
    echo ""
    echo "5. ✅ Validate:"
    echo "   • Run: npm run env:check"
    echo "   • Run: npm run test:e2e:staging"
    echo ""
}

# Environment variable template
create_env_template() {
    echo "📄 Creating environment variable templates..."
    
    cat > ".env.staging.example" << 'EOF'
# Staging Environment Variables
NODE_ENV=production
APP_ENV=staging
NEXTAUTH_URL=https://datekeeper-staging.vercel.app
NEXTAUTH_SECRET=your-staging-secret-here
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret
DATABASE_URL=your-staging-database-url
RESEND_API_KEY=your-resend-api-key
EOF

    cat > ".env.production.example" << 'EOF'
# Production Environment Variables  
NODE_ENV=production
APP_ENV=production
NEXTAUTH_URL=https://datekeeper.vercel.app
NEXTAUTH_SECRET=your-production-secret-here
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
DATABASE_URL=your-production-database-url
RESEND_API_KEY=your-resend-api-key
GOOGLE_ANALYTICS_ID=your-google-analytics-id
SENTRY_DSN=your-sentry-dsn
EOF

    echo "✅ Created .env.staging.example and .env.production.example"
    echo ""
}

# Main setup flow
main() {
    check_tools
    generate_secrets
    setup_vercel
    create_env_template
    environment_instructions
    
    echo "🎉 Environment setup preparation complete!"
    echo ""
    echo "📖 For detailed instructions, see: docs/ENVIRONMENT_SETUP.md"
    echo "🔧 To validate your setup: npm run env:check"
}

# Run main function
main "$@"
