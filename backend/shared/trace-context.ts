import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage instance to store traceId
export const traceStore = new AsyncLocalStorage<string>();

/**
 * Returns the current trace ID from the active async context if present.
 */
export function getTraceId(): string | undefined {
  return traceStore.getStore();
}
