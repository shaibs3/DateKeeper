import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const baseResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || 'local',
    version: process.env.npm_package_version || 'unknown',
  };

  // If no DATABASE_URL is configured, return basic health check
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ...baseResponse,
      database: {
        connected: false,
        note: 'DATABASE_URL not configured - basic health check only',
      },
    });
  }

  try {
    // Test database connection
    await prisma.$connect();

    // Get database stats
    const userCount = await prisma.user.count();
    const eventCount = await prisma.dateEvent.count();

    return NextResponse.json({
      ...baseResponse,
      database: {
        connected: true,
        users: userCount,
        events: eventCount,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        ...baseResponse,
        status: 'degraded',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
