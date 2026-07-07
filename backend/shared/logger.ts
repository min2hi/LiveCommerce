/**
 * Structured Logger
 * Automatically prefixes every log line with:
 *   [LEVEL] [ISO timestamp] [TraceId:xxx] message
 *
 * Usage:
 *   const log = createLogger('CheckoutService');
 *   log.info('Order placed', { orderId, traceId });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  traceId?: string;
  [key: string]: unknown;
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext,
): string {
  const ts = new Date().toISOString();
  const traceTag = context?.traceId ? `[TraceId:${context.traceId}]` : '';
  const extras = context
    ? JSON.stringify(Object.fromEntries(Object.entries(context).filter(([k]) => k !== 'traceId')))
    : '';

  return `[${level.toUpperCase()}] ${ts} [${module}]${traceTag} ${message} ${extras}`.trim();
}

export interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
}

export function createLogger(module: string): Logger {
  return {
    debug: (msg: string, ctx?: LogContext): void => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatMessage('debug', module, msg, ctx));
      }
    },
    info: (msg: string, ctx?: LogContext): void =>
      console.info(formatMessage('info', module, msg, ctx)),
    warn: (msg: string, ctx?: LogContext): void =>
      console.warn(formatMessage('warn', module, msg, ctx)),
    error: (msg: string, ctx?: LogContext): void =>
      console.error(formatMessage('error', module, msg, ctx)),
  };
}
