import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { sendEventReminders } from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendEventReminders],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
