import { Middleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import type { RootState } from '../index';

/**
 * Error Handling Middleware
 * Catches rejected actions and displays error notifications
 */
export const errorHandlingMiddleware: Middleware<object, RootState> =
  () => (next) => (action) => {
    // Check if action is a rejected async thunk
    if (action.type && action.type.endsWith('/rejected')) {
      const errorMessage = action.error?.message || 'An unexpected error occurred';

      // Don't show toast for auth check failures (silent failure)
      if (!action.type.includes('auth/checkAuth')) {
        toast.error(errorMessage);
      }

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Action Error:', {
          type: action.type,
          error: action.error,
          payload: action.payload,
        });
      }
    }

    return next(action);
  };
