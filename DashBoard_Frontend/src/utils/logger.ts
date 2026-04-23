/**
 * Structured Logging Utility
 * Provides consistent logging with levels and context
 */

import { LogLevel, FEATURE_FLAGS } from '../constants/appConstants';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugEnabled = FEATURE_FLAGS.DEBUG_UI;

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: any) {
    if (this.isDevelopment && this.isDebugEnabled) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: any) {
    if (this.isDevelopment) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | any, context?: any) {
    const errorContext = {
      ...context,
      error: error?.message || error,
      stack: error?.stack,
    };
    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  // Performance logging
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API call logging
  apiCall(method: string, url: string, status?: number) {
    this.info(`API ${method} ${url}`, { status });
  }

  // Cache logging
  cacheHit(key: string) {
    this.debug(`Cache HIT: ${key}`);
  }

  cacheMiss(key: string) {
    this.debug(`Cache MISS: ${key}`);
  }

  // Firestore read tracking
  firestoreRead(collection: string, count: number = 1) {
    this.debug(`Firestore READ: ${collection}`, { count });
  }
}

export const logger = new Logger();
