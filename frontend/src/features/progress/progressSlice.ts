import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';
import type { UserProgress } from '../../types';

export interface ProgressState {
  progress: UserProgress[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  progress: [],
  isLoading: false,
  error: null,
};

export const fetchUserProgress = createAsyncThunk('progress/fetchUserProgress', async () => {
  return await api.get<UserProgress[]>(API_ENDPOINTS.PROGRESS.USER);
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
