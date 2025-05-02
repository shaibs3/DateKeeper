import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    console.error('Failed to delete event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const data = await req.json();
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

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error },
      { status: 500 }
    );
  }
} 