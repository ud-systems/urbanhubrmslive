// Centralized logging service to replace console statements
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const isDevelopment = import.meta.env.MODE === 'development';

class Logger {
  private shouldLog(level: keyof LogLevel): boolean {
    // In production, only log errors and warnings
    if (!isDevelopment) {
      return level === 'ERROR' || level === 'WARN';
    }
    return true;
  }

  private formatMessage(level: string, context: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level} [${context}]: ${message}`;
    
    if (data) {
      return `${baseMessage} ${JSON.stringify(data)}`;
    }
    return baseMessage;
  }

  error(context: string, message: string, error?: any): void {
    if (this.shouldLog('ERROR')) {
      const formattedMessage = this.formatMessage('ERROR', context, message, error);
      console.error(formattedMessage);
      
      // In production, you could send to external logging service
      if (!isDevelopment && error) {
        // Example: sendToExternalLogging(formattedMessage);
      }
    }
  }

  warn(context: string, message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      const formattedMessage = this.formatMessage('WARN', context, message, data);
      console.warn(formattedMessage);
    }
  }

  info(context: string, message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      const formattedMessage = this.formatMessage('INFO', context, message, data);
      console.info(formattedMessage);
    }
  }

  debug(context: string, message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      const formattedMessage = this.formatMessage('DEBUG', context, message, data);
      console.log(formattedMessage);
    }
  }

  // Performance logging
  performanceStart(context: string, operation: string): string {
    const marker = `${context}-${operation}-${Date.now()}`;
    if (isDevelopment) {
      console.time(marker);
    }
    return marker;
  }

  performanceEnd(marker: string, context: string, operation: string): void {
    if (isDevelopment) {
      console.timeEnd(marker);
      this.debug(context, `Performance: ${operation} completed`);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience methods for common use cases
export const logError = (context: string, message: string, error?: any) => 
  logger.error(context, message, error);

export const logWarn = (context: string, message: string, data?: any) => 
  logger.warn(context, message, data);

export const logInfo = (context: string, message: string, data?: any) => 
  logger.info(context, message, data);

export const logDebug = (context: string, message: string, data?: any) => 
  logger.debug(context, message, data);

export const logPerformance = {
  start: (context: string, operation: string) => logger.performanceStart(context, operation),
  end: (marker: string, context: string, operation: string) => logger.performanceEnd(marker, context, operation)
}; 