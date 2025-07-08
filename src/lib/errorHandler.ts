// Centralized error handling for the application
export interface AppError {
  id: string;
  message: string;
  type: 'validation' | 'network' | 'auth' | 'database' | 'unknown';
  timestamp: number;
  userAgent?: string;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorHandler {
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep only last 100 errors in memory
  private isProduction = import.meta.env.PROD;

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeError(error: any): AppError {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();

    // Determine error type
    let type: AppError['type'] = 'unknown';
    if (error.message?.includes('validation')) type = 'validation';
    else if (error.message?.includes('network') || error.message?.includes('fetch')) type = 'network';
    else if (error.message?.includes('auth') || error.message?.includes('login')) type = 'auth';
    else if (error.message?.includes('database') || error.message?.includes('supabase')) type = 'database';

    // Sanitize error message for production
    let message = error.message || 'An unknown error occurred';
    if (this.isProduction && type === 'database') {
      message = 'A database error occurred. Please try again.';
    }

    return {
      id: errorId,
      message,
      type,
      timestamp,
      userAgent: navigator.userAgent,
      context: this.isProduction ? undefined : error.context,
      stack: this.isProduction ? undefined : error.stack
    };
  }

  captureError(error: any, context?: Record<string, any>): AppError {
    const appError = this.sanitizeError({
      ...error,
      context
    });

    // Add to errors array
    this.errors.push(appError);
    
    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('Error captured:', appError);
      if (context) {
        console.error('Error context:', context);
      }
    }

    // In production, you could send to error tracking service here
    // Example: Sentry.captureException(error, { extra: context });

    return appError;
  }

  captureAndThrow(error: any, context?: Record<string, any>): never {
    this.captureError(error, context);
    throw error;
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  getErrorsByType(type: AppError['type']): AppError[] {
    return this.errors.filter(error => error.type === type);
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Error recovery helpers
  isRetryableError(error: any): boolean {
    const retryableTypes = ['network', 'database'];
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'rate limit'
    ];

    if (retryableTypes.includes(error.type)) return true;
    
    const message = error.message?.toLowerCase() || '';
    return retryableMessages.some(keyword => message.includes(keyword));
  }

  getRetryDelay(error: any, attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay; // 10% jitter
    return delay + jitter;
  }

  // User-friendly error messages
  getUserFriendlyMessage(error: any): string {
    const message = error.message || 'An error occurred';

    if (this.isProduction) {
      // Return generic messages in production
      switch (error.type) {
        case 'validation':
          return 'Please check your input and try again.';
        case 'network':
          return 'Network error. Please check your connection and try again.';
        case 'auth':
          return 'Authentication error. Please log in again.';
        case 'database':
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return 'Something went wrong. Please try again.';
      }
    }

    return message;
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// React error boundary helper
export const captureReactError = (error: Error, errorInfo?: any) => {
  return errorHandler.captureError(error, {
    componentStack: errorInfo?.componentStack,
    errorBoundary: true
  });
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.captureError(error, context);
      throw error;
    }
  };
};

// Error boundary component props
export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
  onError?: (error: AppError) => void;
  children: React.ReactNode;
}

// Hook for components to capture errors
export const useErrorHandler = () => {
  return {
    captureError: errorHandler.captureError.bind(errorHandler),
    getUserFriendlyMessage: errorHandler.getUserFriendlyMessage.bind(errorHandler),
    isRetryableError: errorHandler.isRetryableError.bind(errorHandler)
  };
}; 