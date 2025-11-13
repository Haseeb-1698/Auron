import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';
import type { CollaborationSession } from '../../types';

export interface CollaborationState {
  sessions: CollaborationSession[];
  currentSession: CollaborationSession | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CollaborationState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
};

export const fetchSessions = createAsyncThunk('collaboration/fetchSessions', async () => {
  return await api.get<CollaborationSession[]>(API_ENDPOINTS.COLLABORATION.SESSIONS);
});

export const createSession = createAsyncThunk(
  'collaboration/createSession',
  async (data: { name: string; labId?: string }) => {
    return await api.post<CollaborationSession>(API_ENDPOINTS.COLLABORATION.CREATE, data);
  }
);

export const joinSession = createAsyncThunk(
  'collaboration/joinSession',
  async (sessionId: string) => {
    return await api.post<CollaborationSession>(API_ENDPOINTS.COLLABORATION.JOIN(sessionId));
  }
);

export const leaveSession = createAsyncThunk(
  'collaboration/leaveSession',
  async (sessionId: string) => {
    await api.post(API_ENDPOINTS.COLLABORATION.LEAVE(sessionId));
    return sessionId;
  }
);

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      })
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        state.sessions.push(action.payload);
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create session';
      })
      .addCase(joinSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
      })
      .addCase(joinSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to join session';
      })
      .addCase(leaveSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(leaveSession.fulfilled, (state) => {
        state.isLoading = false;
        state.currentSession = null;
      })
      .addCase(leaveSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to leave session';
      });
  },
});

export default collaborationSlice.reducer;
