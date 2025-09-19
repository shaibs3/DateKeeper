// Setup for Node.js environment tests (API routes, server-side code)
const { TextEncoder, TextDecoder } = require('util');

// Setup globals for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only show console.error in tests if it's not from our expected error handling
  if (!args.some(arg =>
    typeof arg === 'string' && (
      arg.includes('Attempt') ||
      arg.includes('Notification summary') ||
      arg.includes('Failed notifications')
    )
  )) {
    originalConsoleError(...args);
  }
};