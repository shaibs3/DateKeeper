import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        dateEvents: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.dateEvents);
  } catch (error) {
    apiLogger.error(`Failed to fetch events for user ${session.user.id}: ${error instanceof Error ? error.message : error}`);
    return NextResponse.json({ error: 'Failed to fetch events', details: error }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await prisma.dateEvent.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error(`Failed to delete all events for user ${session.user.id}: ${error instanceof Error ? error.message : error}`);
    return NextResponse.json(
      { error: 'Failed to delete all events', details: error },
      { status: 500 }
    );
  }
}
