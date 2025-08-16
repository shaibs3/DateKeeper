import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { DateEvent } from '@prisma/client';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate tomorrow's date range
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Get all users with events tomorrow and "1 day before" reminder
    const users = await prisma.user.findMany({
      include: {
        dateEvents: {
          where: {
            date: {
              gte: tomorrow,
              lte: tomorrowEnd,
            },
            reminders: {
              has: '1 day before',
            },
          },
        },
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send emails to users with events tomorrow
    for (const user of users) {
      if (user.dateEvents.length > 0 && user.email) {
        try {
          await resend.emails.send({
            from: 'DateKeeper <noreply@yourdomain.com>',
            to: user.email,
            subject: 'Reminder: Your Event(s) Tomorrow!',
            html: `
              <h1>Upcoming Event Reminder</h1>
              <p>These events are happening <strong>tomorrow</strong>:</p>
              <ul>
                ${user.dateEvents
                  .map(
                    (event: DateEvent) => `
                  <li>
                    <strong>${event.name}</strong><br>
                    Date: ${new Date(event.date).toLocaleDateString()}<br>
                    ${event.notes ? `Notes: ${event.notes}` : ''}
                  </li>
                `
                  )
                  .join('')}
              </ul>
            `,
          });
          // console.log(`1-day-before email sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
        }
      }
    }

    return NextResponse.json({ message: '1-day-before notifications sent' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
