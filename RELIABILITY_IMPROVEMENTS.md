# Inngest Email Notification Reliability Improvements

## Current Issues
1. **No Idempotency**: Function can send duplicate emails if restarted
2. **No State Persistence**: If function crashes mid-execution, progress is lost
3. **All-or-Nothing**: Partial failures affect all users
4. **No Dead Letter Handling**: Failed notifications are only logged

## Recommended Solutions

### 1. Add Notification Tracking Table
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  notification_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'sent', 'failed'
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  error_message TEXT,
  email_id TEXT, -- Resend email ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, event_id, reminder_type, notification_date)
);
```

### 2. Implement Idempotent Processing
- Check notification_logs before sending
- Use database transactions for atomic updates
- Include date in idempotency key

### 3. Granular Step Processing
```typescript
// Process each user individually in separate steps
for (const user of users) {
  await step.run(`send-notification-${user.id}-${reminderType}`, async () => {
    // Atomic: check + send + record
    return await sendNotificationWithTracking(user, reminderType);
  });
}
```

### 4. Dead Letter Queue Pattern
- Implement exponential backoff with max attempts
- Move failed notifications to separate processing queue
- Manual retry mechanism for persistent failures

### 5. Monitoring & Alerting
- Track notification success rates
- Alert on high failure rates
- Dashboard for notification status

### 6. Database-Driven Scheduling
Instead of cron-based approach:
- Pre-generate notification jobs in database
- Process pending notifications from queue
- Mark as processed atomically

## Implementation Priority
1. **High**: Add notification tracking table
2. **High**: Implement idempotency checks
3. **Medium**: Granular step processing
4. **Medium**: Dead letter queue handling
5. **Low**: Enhanced monitoring dashboard