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

export function calculateDateRange(daysFromNow: number): { start: Date; end: Date } {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysFromNow);
  targetDate.setHours(0, 0, 0, 0);

  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);

  return { start: targetDate, end: endDate };
}

export async function getEventsForReminder(
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

export async function sendNotificationEmail(
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

    // Process each reminder type
    for (const reminderConfig of REMINDER_CONFIGS) {
      // Step 1: Query users for this reminder type
      const users = await step.run(`query-${reminderConfig.type}-users`, async () => {
        inngestLogger.info(
          `🔍 Processing ${reminderConfig.type} reminders (${reminderConfig.displayName})`
        );

        const dateRange = calculateDateRange(reminderConfig.days);
        inngestLogger.info(
          `📅 Date range for ${reminderConfig.type}: ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}`
        );

        const queriedUsers = await getEventsForReminder(reminderConfig.type, dateRange);
        inngestLogger.info(`👥 Found ${queriedUsers.length} users with ${reminderConfig.type} reminders`);

        if (queriedUsers.length > 0) {
          queriedUsers.forEach((user, index) => {
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

        return queriedUsers;
      });

      // Step 2: Process each user individually
      for (const user of users) {
        await step.run(`notify-${user.id}-${reminderConfig.type}`, async () => {
          inngestLogger.info(`📧 Attempting to send email to: ${user.email} for ${reminderConfig.type}`);

          const result = await sendNotificationEmail(resend, user, reminderConfig);
          inngestLogger.info(`📧 Email result for ${user.email}: ${JSON.stringify(result)}`);

          if (result.success) {
            const eventsCount = user.dateEvents.length;
            inngestLogger.info(`✅ Successfully sent email to ${user.email} for ${eventsCount} events`);
            return {
              success: true,
              user: user.email,
              eventsNotified: eventsCount,
              reminderType: reminderConfig.type,
            };
          } else {
            inngestLogger.error(
              `❌ Failed to send email to ${user.email}: ${result.error || result.reason}`
            );
            return {
              success: false,
              user: user.email || 'unknown',
              error: result.error || result.reason || 'Unknown error',
              attempts: result.totalAttempts || 0,
              reminderType: reminderConfig.type,
            };
          }
        });
      }
    }

    // Log completion summary
    // Note: Individual step results are logged above. Final metrics will be available
    // in Inngest dashboard and logs. Each user notification is now processed as a separate,
    // recoverable step for better fault tolerance.

    const processedReminderTypes = REMINDER_CONFIGS.map(c => c.type);

    inngestLogger.info(
      `🏁 Inngest function completed - sendEventReminders. Processed reminder types: ${processedReminderTypes.join(', ')}`
    );
    inngestLogger.info(
      '📊 Individual notification results are logged above. Check Inngest dashboard for detailed step-by-step execution status.'
    );

    return {
      message: 'Email notifications processing completed',
      processedReminderTypes,
      processingApproach: 'granular-steps-per-user',
      note: 'Individual step results are available in logs and Inngest dashboard',
    };
  }
);
