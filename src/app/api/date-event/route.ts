import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { name, date, category, color, recurrence, notes, reminders } = data;

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const event = await prisma.dateEvent.create({
      data: {
        name,
        date: new Date(date),
        category,
        color,
        recurrence,
        notes,
        reminders,
        userId: user.id,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event', details: error }, { status: 500 });
  }
} 