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
  inngestLogger.info(`📧 sendNotificationEmail called for ${user.email}`);
  inngestLogger.info(`📧 User has ${user.dateEvents.length} events`);

  if (!user.email || user.dateEvents.length === 0) {
    inngestLogger.warn(
      `📧 Skipping email - no email (${!!user.email}) or no events (${user.dateEvents.length})`
    );
    return { success: false, reason: 'No email or events' };
  }

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
  { cron: '0 0 * * *' }, // Daily at midnight UTC
  async ({ step }) => {
    inngestLogger.info('🚀 Inngest function started - sendEventReminders');

    // Check environment variables
    inngestLogger.info(`📧 RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
    if (process.env.RESEND_API_KEY) {
      inngestLogger.info(
        `📧 RESEND_API_KEY preview: ${process.env.RESEND_API_KEY.substring(0, 8)}...`
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    let totalNotificationsSent = 0;
    let totalFailures = 0;
    const failureDetails: Array<{ user: string; error: string; attempts: number }> = [];

    // Process each reminder type
    for (const reminderConfig of REMINDER_CONFIGS) {
      await step.run(`process-${reminderConfig.type}-reminders`, async () => {
        inngestLogger.info(
          `🔍 Processing ${reminderConfig.type} reminders (${reminderConfig.displayName})`
        );

        const dateRange = calculateDateRange(reminderConfig.days);
        inngestLogger.info(
          `📅 Date range for ${reminderConfig.type}: ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`
        );

        const users = await getEventsForReminder(reminderConfig.type, dateRange);
        inngestLogger.info(`👥 Found ${users.length} users with ${reminderConfig.type} reminders`);

        if (users.length > 0) {
          users.forEach((user, index) => {
            inngestLogger.info(
              `👤 User ${index + 1}: ${user.email} has ${user.dateEvents.length} events`
            );
            user.dateEvents.forEach((event, eventIndex) => {
              inngestLogger.info(
                `  📅 Event ${eventIndex + 1}: ${event.name} on ${event.date.toISOString()}`
              );
            });
          });
        }

        // Send notifications for this reminder type
        for (const user of users) {
          inngestLogger.info(`📧 Attempting to send email to: ${user.email}`);
          const result = await sendNotificationEmail(resend, user, reminderConfig);
          inngestLogger.info(`📧 Email result for ${user.email}: ${JSON.stringify(result)}`);

          if (result.success) {
            totalNotificationsSent += user.dateEvents.length;
            inngestLogger.info(`✅ Successfully sent email to ${user.email}`);
          } else {
            totalFailures++;
            inngestLogger.error(
              `❌ Failed to send email to ${user.email}: ${result.error || result.reason}`
            );
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

    inngestLogger.info(`📊 FINAL SUMMARY: ${JSON.stringify(summary, null, 2)}`);

    if (totalFailures > 0) {
      inngestLogger.warn(
        `Email notifications completed with failures: ${summary.totalNotificationsSent} sent, ${summary.totalFailures} failed`
      );
      inngestLogger.warn(`Failure details: ${JSON.stringify(failureDetails, null, 2)}`);
    } else {
      inngestLogger.info(
        `Email notifications completed successfully: ${summary.totalNotificationsSent} sent, ${summary.totalFailures} failed`
      );
    }

    inngestLogger.info('🏁 Inngest function completed - sendEventReminders');

    return {
      totalNotificationsSent,
      totalFailures,
      processedReminderTypes: REMINDER_CONFIGS.map(c => c.type),
      ...(totalFailures > 0 && { failureDetails }),
    };
  }
);
