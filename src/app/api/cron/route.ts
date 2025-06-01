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

    // Get all users with their events
    const users = await prisma.user.findMany({
      include: {
        dateEvents: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1),
            },
          },
        },
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send emails to users with upcoming events
    for (const user of users) {
      if (user.dateEvents.length > 0 && user.email) {
        try {
          await resend.emails.send({
            from: 'DateKeeper <noreply@yourdomain.com>',
            to: user.email,
            subject: 'Your Upcoming Events',
            html: `
              <h1>Your Upcoming Events</h1>
              <p>Here are your events for next month:</p>
              <ul>
                ${user.dateEvents.map((event: DateEvent) => `
                  <li>
                    <strong>${event.name}</strong><br>
                    Date: ${new Date(event.date).toLocaleDateString()}<br>
                    ${event.notes ? `Notes: ${event.notes}` : ''}
                  </li>
                `).join('')}
              </ul>
            `,
          });
          console.log(`Email sent to ${user.email}`);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
        }
      }
    }

    return NextResponse.json({ message: 'Cron job executed successfully' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 