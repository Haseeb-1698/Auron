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

export const fetchUserStats = createAsyncThunk('progress/fetchUserStats', async () => {
  return await api.get(API_ENDPOINTS.PROGRESS.STATS);
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
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchUserBadges.fulfilled, (state, action) => {
        state.badges = action.payload as unknown as unknown[];
      })
      .addCase(fetchUserBadges.rejected, (state) => {
        state.badges = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload as unknown as unknown[];
      })
      .addCase(fetchLeaderboard.rejected, (state) => {
        state.leaderboard = null;
      });
  },
});

export default progressSlice.reducer;
