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
  async (data: { name: string; labId: string }) => {
    return await api.post<CollaborationSession>(API_ENDPOINTS.COLLABORATION.CREATE, data);
  }
);

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
        state.sessions.push(action.payload);
      });
  },
});

export default collaborationSlice.reducer;
