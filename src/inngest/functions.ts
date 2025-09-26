import { inngest } from './client';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { DateEvent, User } from '@prisma/client';
import { inngestLogger } from '@/lib/logger';

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
  reminderConfig: ReminderConfig,
  maxRetries = 3
) {
  if (!user.email || user.dateEvents.length === 0)
    return { success: false, reason: 'No email or events' };

  const emailTemplate = `
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
  `;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const emailResult = await resend.emails.send({
        from: 'DateKeeper <noreply@resend.dev>',
        to: user.email,
        subject: `Reminder: Your Event(s) ${reminderConfig.displayName}!`,
        html: emailTemplate,
      });

      if (emailResult.error) {
        throw new Error(`Resend API error: ${emailResult.error.message}`);
      }

      return {
        success: true,
        emailId: emailResult.data?.id,
        attempt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      inngestLogger.warn(
        `Email sending failed for ${user.email} (attempt ${attempt}/${maxRetries}): ${errorMessage}`
      );

      if (attempt === maxRetries) {
        return {
          success: false,
          error: errorMessage,
          totalAttempts: maxRetries,
        };
      }

      const delayMs = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success: false, error: 'Unexpected end of retry loop' };
}

export const sendEventReminders = inngest.createFunction(
  {
    id: 'send-event-reminders',
    retries: 3,
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes for testing
  async ({ step }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    let totalNotificationsSent = 0;
    let totalFailures = 0;
    const failureDetails: Array<{ user: string; error: string; attempts: number }> = [];

    // Process each reminder type
    for (const reminderConfig of REMINDER_CONFIGS) {
      await step.run(`process-${reminderConfig.type}-reminders`, async () => {
        const dateRange = calculateDateRange(reminderConfig.days);
        const users = await getEventsForReminder(reminderConfig.type, dateRange);

        // Send notifications for this reminder type
        for (const user of users) {
          const result = await sendNotificationEmail(resend, user, reminderConfig);

          if (result.success) {
            totalNotificationsSent += user.dateEvents.length;
          } else {
            totalFailures++;
            failureDetails.push({
              user: user.email || 'unknown',
              error: result.error || result.reason || 'Unknown error',
              attempts: result.totalAttempts || 0,
            });
          }
        }
      });
    }

    // Log summary for monitoring
    const summary = {
      totalNotificationsSent,
      totalFailures,
      processedReminderTypes: REMINDER_CONFIGS.map(c => c.type),
      ...(totalFailures > 0 && { failureDetails }),
    };

    if (totalFailures > 0) {
      inngestLogger.warn(
        `Email notifications completed with failures: ${summary.totalNotificationsSent} sent, ${summary.totalFailures} failed`
      );
    } else {
      inngestLogger.info(
        `Email notifications completed successfully: ${summary.totalNotificationsSent} sent, ${summary.totalFailures} failed`
      );
    }

    return {
      totalNotificationsSent,
      totalFailures,
      processedReminderTypes: REMINDER_CONFIGS.map(c => c.type),
      ...(totalFailures > 0 && { failureDetails }),
    };
  }
);
