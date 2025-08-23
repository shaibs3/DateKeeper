import { NextResponse } from 'next/server';

export async function GET() {
  // Basic health check without database dependency
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || 'local',
    version: process.env.npm_package_version || 'unknown',
    uptime: process.uptime(),
  });
}
