import { Middleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

interface RejectedAction {
  type: string;
  error?: {
    message?: string;
  };
  payload?: unknown;
}

/**
 * Error Handling Middleware
 * Catches rejected actions and displays error notifications
 */
export const errorHandlingMiddleware: Middleware =
  () => (next) => (action: unknown) => {
    const rejectedAction = action as RejectedAction;
    // Check if action is a rejected async thunk
    if (rejectedAction.type && typeof rejectedAction.type === 'string' && rejectedAction.type.endsWith('/rejected')) {
      const errorMessage = rejectedAction.error?.message || 'An unexpected error occurred';

      // Don't show toast for auth check failures (silent failure)
      if (!rejectedAction.type.includes('auth/checkAuth')) {
        toast.error(errorMessage);
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Action Error:', {
          type: rejectedAction.type,
          error: rejectedAction.error,
          payload: rejectedAction.payload,
        });
      }
    }

    return next(action);
  };
