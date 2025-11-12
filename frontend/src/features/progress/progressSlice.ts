import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';
import type { UserProgress } from '../../types';

export interface ProgressState {
  progress: UserProgress[];
  stats: unknown | null;
  badges: unknown[] | null;
  leaderboard: unknown[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  progress: [],
  stats: null,
  badges: null,
  leaderboard: null,
  isLoading: false,
  error: null,
};

export const fetchUserProgress = createAsyncThunk('progress/fetchUserProgress', async (_userId: string) => {
  return await api.get<UserProgress[]>(API_ENDPOINTS.PROGRESS.USER);
});

export const fetchUserBadges = createAsyncThunk('progress/fetchUserBadges', async (_userId: string) => {
  // This would connect to the gamification API
  return await api.get(API_ENDPOINTS.GAMIFICATION.USER_BADGES);
});

export const fetchLeaderboard = createAsyncThunk('progress/fetchLeaderboard', async () => {
  return await api.get(API_ENDPOINTS.PROGRESS.LEADERBOARD);
});

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.progress = action.payload;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch progress';
      });
  },
});

export default progressSlice.reducer;
