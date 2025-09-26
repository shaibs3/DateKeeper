import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;

  try {
    const event = await prisma.dateEvent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.dateEvent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error(
      `Failed to delete event ${params.id} for user ${session.user.id}: ${error instanceof Error ? error.message : error}`
    );
    return NextResponse.json({ error: 'Failed to delete event', details: error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;

  try {
    const event = await prisma.dateEvent.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, date, category, color, recurrence, notes, reminders } = data;

    const updatedEvent = await prisma.dateEvent.update({
      where: { id: params.id },
      data: {
        name,
        date: new Date(date),
        category,
        color,
        recurrence,
        notes,
        reminders,
      },
    });

    return NextResponse.json({ message: `Event with ID ${params.id} updated successfully.` });
  } catch (error) {
    apiLogger.error(
      `Failed to update event ${params.id} for user ${session.user.id}: ${error instanceof Error ? error.message : error}`
    );
    return NextResponse.json({ error: 'Failed to update event', details: error }, { status: 500 });
  }
}
