import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@services/api';
import { API_ENDPOINTS } from '@config/constants';

export interface Report {
  id: string;
  userId: string;
  labId?: string;
  title: string;
  description?: string;
  reportType: 'lab_completion' | 'vulnerability_scan' | 'progress_summary' | 'custom';
  format: 'pdf' | 'json' | 'csv' | 'html';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  data?: Record<string, unknown>;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  generatedAt?: string;
  errorMessage?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateReportRequest {
  reportType: 'lab_completion' | 'vulnerability_scan' | 'progress_summary' | 'custom';
  format?: 'pdf' | 'json' | 'csv' | 'html';
  labId?: string;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
}

export interface ReportStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  recent: Report[];
}

export interface ReportsState {
  reports: Report[];
  currentReport: Report | null;
  stats: ReportStats | null;
  isLoading: boolean;
  isGenerating: boolean;
  isDownloading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ReportsState = {
  reports: [],
  currentReport: null,
  stats: null,
  isLoading: false,
  isGenerating: false,
  isDownloading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Thunks
export const generateReport = createAsyncThunk(
  'reports/generate',
  async (data: GenerateReportRequest) => {
    const response = await api.post<{ success: boolean; data: Report }>(
      API_ENDPOINTS.REPORTS.CREATE,
      data
    );
    return response.data;
  }
);

export const fetchReports = createAsyncThunk(
  'reports/fetchList',
  async (params?: { page?: number; limit?: number; reportType?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.reportType) queryParams.append('reportType', params.reportType);
    if (params?.status) queryParams.append('status', params.status);

    const response = await api.get<{
      success: boolean;
      data: Report[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${API_ENDPOINTS.REPORTS.LIST}/user?${queryParams.toString()}`);

    return response;
  }
);

export const fetchReportDetails = createAsyncThunk(
  'reports/fetchDetails',
  async (reportId: string) => {
    const response = await api.get<{ success: boolean; data: Report }>(
      API_ENDPOINTS.REPORTS.DETAIL(reportId)
    );
    return response.data;
  }
);

export const downloadReport = createAsyncThunk(
  'reports/download',
  async (reportId: string) => {
    const response = await api.get(`${API_ENDPOINTS.REPORTS.DETAIL(reportId)}/download`, {
      responseType: 'blob',
    });
    return { data: response, reportId };
  }
);

export const deleteReport = createAsyncThunk(
  'reports/delete',
  async (reportId: string) => {
    await api.delete(API_ENDPOINTS.REPORTS.DELETE(reportId));
    return reportId;
  }
);

export const fetchReportStats = createAsyncThunk(
  'reports/fetchStats',
  async () => {
    const response = await api.get<{ success: boolean; data: ReportStats }>(
      `${API_ENDPOINTS.REPORTS.LIST}/stats`
    );
    return response.data;
  }
);

// Slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate report
      .addCase(generateReport.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action: PayloadAction<Report>) => {
        state.isGenerating = false;
        state.reports.unshift(action.payload);
        state.currentReport = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.error.message || 'Failed to generate report';
      })

      // Fetch reports
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch reports';
      })

      // Fetch report details
      .addCase(fetchReportDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReportDetails.fulfilled, (state, action: PayloadAction<Report>) => {
        state.isLoading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchReportDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch report details';
      })

      // Download report
      .addCase(downloadReport.pending, (state) => {
        state.isDownloading = true;
      })
      .addCase(downloadReport.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = action.error.message || 'Failed to download report';
      })

      // Delete report
      .addCase(deleteReport.fulfilled, (state, action: PayloadAction<string>) => {
        state.reports = state.reports.filter(report => report.id !== action.payload);
        if (state.currentReport?.id === action.payload) {
          state.currentReport = null;
        }
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete report';
      })

      // Fetch stats
      .addCase(fetchReportStats.fulfilled, (state, action: PayloadAction<ReportStats>) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentReport, clearError } = reportsSlice.actions;
export default reportsSlice.reducer;
