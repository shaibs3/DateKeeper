/**
 * Client-side logger - lightweight logging for browser environment
 * Only logs errors in production to avoid console spam
 */
class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  error(message: string, error?: Error | unknown): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[CLIENT ERROR] ${message}`, error);
    }
    // In production, you could send to error tracking service like Sentry
  }

  warn(message: string): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[CLIENT WARN] ${message}`);
    }
  }

  info(message: string): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(`[CLIENT INFO] ${message}`);
    }
  }
}

export const clientLogger = new ClientLogger();
