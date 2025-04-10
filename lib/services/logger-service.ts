import { LoggerService } from '../interfaces/services';
import { createLogger as createPinoLogger } from '../logger';

/**
 * Implementation of LoggerService using Pino
 */
export class PinoLoggerService implements LoggerService {
  private logger;

  constructor(context: string) {
    this.logger = createPinoLogger(context);
  }

  info(obj: object | string, msg?: string): void {
    this.logger.info(obj, msg);
  }

  error(obj: object | string, msg?: string): void {
    this.logger.error(obj, msg);
  }

  warn(obj: object | string, msg?: string): void {
    this.logger.warn(obj, msg);
  }

  debug(obj: object | string, msg?: string): void {
    this.logger.debug(obj, msg);
  }
}

/**
 * Factory function to create a LoggerService instance
 */
export function createLoggerService(context: string): LoggerService {
  return new PinoLoggerService(context);
}
