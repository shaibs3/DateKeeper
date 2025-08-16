#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Validates that all required environment variables are set
 */

const requiredVars = {
  development: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
  ],
  staging: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
    'RESEND_API_KEY',
  ],
  production: [
    'NEXTAUTH_SECRET', 
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
    'RESEND_API_KEY',
    'GOOGLE_ANALYTICS_ID',
    'SENTRY_DSN',
  ],
};

const optionalVars = [
  'RESEND_API_KEY',
  'GOOGLE_ANALYTICS_ID', 
  'SENTRY_DSN',
  'EMAIL_FROM',
];

function checkEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const appEnv = process.env.APP_ENV || 'local';
  
  console.log(`🔍 Checking environment variables for: ${env} (${appEnv})`);
  console.log('================================================');
  
  const requiredForEnv = requiredVars[env] || requiredVars.development;
  const missing = [];
  const present = [];
  
  requiredForEnv.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName}`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName} - MISSING`);
    }
  });
  
  console.log('\n📋 Optional variables:');
  console.log('======================');
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`⚪ ${varName} - not set (optional)`);
    }
  });
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`✅ Required present: ${present.length}/${requiredForEnv.length}`);
  console.log(`❌ Required missing: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log('\n🚨 Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Copy .env.example to .env.local and fill in the values');
    process.exit(1);
  }
  
  console.log('\n🎉 All required environment variables are set!');
  
  // Environment-specific warnings
  if (env === 'production') {
    if (!process.env.GOOGLE_ANALYTICS_ID) {
      console.log('⚠️  Consider setting GOOGLE_ANALYTICS_ID for production');
    }
    if (!process.env.SENTRY_DSN) {
      console.log('⚠️  Consider setting SENTRY_DSN for error tracking');
    }
  }
}

if (require.main === module) {
  checkEnvironment();
}

module.exports = { checkEnvironment };
