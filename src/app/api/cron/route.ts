import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { DateEvent, User } from '@prisma/client';

export const runtime = 'edge';

type ReminderType = '1_DAY' | '3_DAYS' | '1_WEEK' | '2_WEEKS' | '1_MONTH';

interface ReminderConfig {
  type: ReminderType;
  days: number;
  displayName: string;
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  { type: '1_DAY', days: 1, displayName: 'tomorrow' },
  { type: '3_DAYS', days: 3, displayName: 'in 3 days' },
  { type: '1_WEEK', days: 7, displayName: 'in 1 week' },
  { type: '2_WEEKS', days: 14, displayName: 'in 2 weeks' },
  { type: '1_MONTH', days: 30, displayName: 'in 1 month' },
];

function calculateDateRange(daysFromNow: number): { start: Date; end: Date } {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysFromNow);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  return { start: targetDate, end: endDate };
}

async function getEventsForReminder(
  reminderType: ReminderType,
  dateRange: { start: Date; end: Date }
) {
  return await prisma.user.findMany({
    include: {
      dateEvents: {
        where: {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          reminders: {
            has: reminderType,
          },
        },
      },
    },
    where: {
      dateEvents: {
        some: {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          reminders: {
            has: reminderType,
          },
        },
      },
    },
  });
}

async function sendNotificationEmail(
  resend: Resend,
  user: User & { dateEvents: DateEvent[] },
  reminderConfig: ReminderConfig
) {
  if (!user.email || user.dateEvents.length === 0) return;

  try {
    await resend.emails.send({
      from: 'DateKeeper <noreply@datekeeper.app>',
      to: user.email,
      subject: `Reminder: Your Event(s) ${reminderConfig.displayName}!`,
      html: `
        <h1>Upcoming Event Reminder</h1>
        <p>These events are happening <strong>${reminderConfig.displayName}</strong>:</p>
        <ul>
          ${user.dateEvents
            .map(
              (event: DateEvent) => `
            <li>
              <strong>${event.name}</strong><br>
              Date: ${new Date(event.date).toLocaleDateString()}<br>
              Category: ${event.category}<br>
              ${event.notes ? `Notes: ${event.notes}` : ''}
            </li>
          `
            )
            .join('')}
        </ul>
        <p>Don't forget to prepare for your special day!</p>
      `,
    });
  } catch (error) {
    console.error(`Error sending ${reminderConfig.type} email to ${user.email}:`, error);
  }
}

export async function POST(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let totalNotificationsSent = 0;

    // Process each reminder type
    for (const reminderConfig of REMINDER_CONFIGS) {
      const dateRange = calculateDateRange(reminderConfig.days);
      const users = await getEventsForReminder(reminderConfig.type, dateRange);

      // Send notifications for this reminder type
      for (const user of users) {
        await sendNotificationEmail(resend, user, reminderConfig);
        totalNotificationsSent += user.dateEvents.length;
      }
    }

    return NextResponse.json({
      message: 'Notifications processed successfully',
      totalNotificationsSent,
      processedReminderTypes: REMINDER_CONFIGS.map(c => c.type),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
