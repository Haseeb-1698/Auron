import { Middleware } from '@reduxjs/toolkit';

interface Action {
  type: string;
  [key: string]: unknown;
}

/**
 * Logging Middleware
 * Logs all Redux actions and state changes in development
 */
export const loggingMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const typedAction = action as Action;
  if (process.env.NODE_ENV === 'development') {
    console.group(`Action: ${typedAction.type}`);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);
    const result = next(action);
    console.log('Next State:', store.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};
