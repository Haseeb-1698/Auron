import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@features/auth/authSlice';
import dashboardReducer from '@features/dashboard/dashboardSlice';
import labsReducer from '@features/labs/labsSlice';
import progressReducer from '@features/progress/progressSlice';
import collaborationReducer from '@features/collaboration/collaborationSlice';
import aiReducer from '@features/ai/aiSlice';

import { loggingMiddleware } from './middleware/logging';
import { errorHandlingMiddleware } from './middleware/errorHandling';

/**
 * Redux Store Configuration
 * Combines all feature slices and middleware
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    labs: labsReducer,
    progress: progressReducer,
    collaboration: collaborationReducer,
    ai: aiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: ['websocket/messageReceived'],
        ignoredPaths: ['socket.connection'],
      },
    })
      .concat(loggingMiddleware)
      .concat(errorHandlingMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
