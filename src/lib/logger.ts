import pino from 'pino';

// Configure Pino logger based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'warn' : isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined, // Production uses JSON format
  formatters: {
    level: label => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child loggers for different modules
export const authLogger = logger.child({ module: 'auth' });
export const inngestLogger = logger.child({ module: 'inngest' });
export const apiLogger = logger.child({ module: 'api' });
