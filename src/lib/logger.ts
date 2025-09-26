import winston from 'winston';

// Configure Winston logger based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const logLevel = isTest ? 'warn' : isDevelopment ? 'debug' : 'info';

// Create base logger
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              const moduleStr = module ? `[${module}] ` : '';
              return `${timestamp} ${level}: ${moduleStr}${message} ${metaStr}`;
            })
          )
        : winston.format.json(),
    }),
  ],
  // Prevent crashes on unhandled exceptions
  exitOnError: false,
});

// Create child loggers for different modules
export const authLogger = logger.child({ module: 'auth' });
export const inngestLogger = logger.child({ module: 'inngest' });
export const apiLogger = logger.child({ module: 'api' });
