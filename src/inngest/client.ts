import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'datekeeper-app',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
