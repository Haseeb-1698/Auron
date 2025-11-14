import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';
import type { Lab, LabInstance } from '../../types';
import { LabInstanceStatus } from '../../types';

export interface LabsState {
  labs: Lab[];
  currentLab: Lab | null;
  currentInstance: LabInstance | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LabsState = {
  labs: [],
  currentLab: null,
  currentInstance: null,
  isLoading: false,
  error: null,
};

export const fetchLabs = createAsyncThunk('labs/fetchLabs', async () => {
  return await api.get<Lab[]>(API_ENDPOINTS.LABS.LIST);
});

export const fetchLabDetail = createAsyncThunk('labs/fetchLabDetail', async (labId: string) => {
  return await api.get<Lab>(API_ENDPOINTS.LABS.DETAIL(labId));
});

export const startLab = createAsyncThunk('labs/startLab', async (labId: string) => {
  return await api.post<LabInstance>(API_ENDPOINTS.LABS.START(labId));
});

export const stopLab = createAsyncThunk('labs/stopLab', async (instanceId: string) => {
  return await api.post<{ success: boolean }>(API_ENDPOINTS.LABS.STOP_INSTANCE(instanceId));
});

export const restartLab = createAsyncThunk('labs/restartLab', async (instanceId: string) => {
  return await api.post<LabInstance>(API_ENDPOINTS.LABS.RESTART_INSTANCE(instanceId));
});

export const resetLab = createAsyncThunk('labs/resetLab', async (instanceId: string) => {
  return await api.post<LabInstance>(API_ENDPOINTS.LABS.RESET_INSTANCE(instanceId));
});

export const submitExercise = createAsyncThunk(
  'labs/submitExercise',
  async ({ labId, exerciseId, solution }: { labId: string; exerciseId: string; solution: string }) => {
    return await api.post(API_ENDPOINTS.LABS.SUBMIT(labId, exerciseId), { solution });
  }
);

const labsSlice = createSlice({
  name: 'labs',
  initialState,
  reducers: {
    clearCurrentLab: (state) => {
      state.currentLab = null;
      state.currentInstance = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLabs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.labs = action.payload;
      })
      .addCase(fetchLabs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch labs';
      })
      .addCase(fetchLabDetail.fulfilled, (state, action) => {
        state.currentLab = action.payload;
      })
      .addCase(startLab.fulfilled, (state, action) => {
        state.currentInstance = action.payload;
      })
      .addCase(stopLab.fulfilled, (state) => {
        if (state.currentInstance) {
          state.currentInstance.status = LabInstanceStatus.STOPPED;
        }
      })
      .addCase(restartLab.fulfilled, (state, action) => {
        state.currentInstance = action.payload;
      })
      .addCase(resetLab.fulfilled, (state, action) => {
        state.currentInstance = action.payload;
      });
  },
});

export const { clearCurrentLab } = labsSlice.actions;
export default labsSlice.reducer;
