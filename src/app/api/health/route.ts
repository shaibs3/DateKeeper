import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Get database stats
    const userCount = await prisma.user.count();
    const eventCount = await prisma.dateEvent.count();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        users: userCount,
        events: eventCount,
      },
      environment: process.env.APP_ENV || 'local',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        environment: process.env.APP_ENV || 'local',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
