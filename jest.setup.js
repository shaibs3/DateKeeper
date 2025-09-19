require('@testing-library/jest-dom');

// Suppress expected console errors in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // List of expected error messages that we want to suppress
  const expectedErrors = [
    'Failed to delete event:',
    'Failed to update event:',
    'Failed to fetch events:',
    'Failed to create event:',
    'Failed to delete all events:',
    'Cron job error:',
    'Attempt',
    'Notification summary:',
    'Failed notifications:',
  ];

  console.error = (...args) => {
    const message = args[0];
    const isExpectedError = expectedErrors.some(
      error => typeof message === 'string' && message.includes(error)
    );

    if (!isExpectedError) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args) => {
    // Suppress warnings too if needed
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
