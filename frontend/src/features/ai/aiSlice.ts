import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';
import type { AIHint, VulnerabilityExplanation } from '@types/index';

interface AIState {
  currentHint: AIHint | null;
  explanation: VulnerabilityExplanation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AIState = {
  currentHint: null,
  explanation: null,
  isLoading: false,
  error: null,
};

export const getHint = createAsyncThunk(
  'ai/getHint',
  async (data: { labId: string; exerciseId: string; context: string }) => {
    return await api.post<AIHint>(API_ENDPOINTS.AI.GET_HINT, data);
  }
);

export const explainVulnerability = createAsyncThunk(
  'ai/explainVulnerability',
  async (vulnerabilityType: string) => {
    return await api.post<VulnerabilityExplanation>(API_ENDPOINTS.AI.EXPLAIN_VULNERABILITY, {
      vulnerabilityType,
    });
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearHint: (state) => {
      state.currentHint = null;
    },
    clearExplanation: (state) => {
      state.explanation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHint.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getHint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHint = action.payload;
      })
      .addCase(getHint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to get hint';
      })
      .addCase(explainVulnerability.fulfilled, (state, action) => {
        state.explanation = action.payload;
      });
  },
});

export const { clearHint, clearExplanation } = aiSlice.actions;
export default aiSlice.reducer;
