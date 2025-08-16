/**
 * Environment-specific configuration
 * Centralizes all environment variables and provides type safety
 */

export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_ENV: process.env.APP_ENV || 'local',
  APP_URL: process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Authentication
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Database
  database: {
    url: process.env.DATABASE_URL!,
  },

  // Email
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@datekeeper.app',
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  },

  // Error Tracking
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  // Feature Flags (environment-specific)
  features: {
    enableAnalytics: process.env.APP_ENV === 'production',
    enableSentry: process.env.APP_ENV !== 'local',
    debugMode: process.env.NODE_ENV === 'development',
    enableTestNotifications: process.env.APP_ENV !== 'production',
  },
} as const;

// Environment validation
export function validateEnvironment() {
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Environment helpers
export const isLocal = () => config.APP_ENV === 'local';
export const isStaging = () => config.APP_ENV === 'staging';
export const isProduction = () => config.APP_ENV === 'production';
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isProductive = () => config.NODE_ENV === 'production';
