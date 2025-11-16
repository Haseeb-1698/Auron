import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  fetchReports,
  generateReport,
  downloadReport,
  deleteReport,
  fetchReportStats,
  clearError,
  type GenerateReportRequest,
  type Report,
} from '@features/reports/reportsSlice';
import { format } from 'date-fns';

export default function ReportsPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const {
    reports,
    stats,
    isLoading,
    isGenerating,
    isDownloading,
    error,
    pagination,
  } = useSelector((state: RootState) => state.reports);

  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newReport, setNewReport] = useState<GenerateReportRequest>({
    reportType: 'lab_completion',
    format: 'pdf',
    title: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchReports({ page: 1, limit: 20 }));
    dispatch(fetchReportStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error, dispatch]);

  const handleGenerateReport = async () => {
    await dispatch(generateReport(newReport));
    setOpenGenerateDialog(false);
    setNewReport({
      reportType: 'lab_completion',
      format: 'pdf',
      title: '',
      description: '',
    });
    dispatch(fetchReports({ page: pagination.page, limit: pagination.limit }));
  };

  const handleDownload = async (reportId: string, fileName: string) => {
    const result = await dispatch(downloadReport(reportId));
    if (result.type === 'reports/download/fulfilled' && result.payload) {
      const payload = result.payload as { data: BlobPart };
      const blob = new Blob([payload.data], {
        type: 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'report';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await dispatch(deleteReport(reportId));
      dispatch(fetchReports({ page: pagination.page, limit: pagination.limit }));
    }
  };

  const handleFilterChange = () => {
    const params: Record<string, string | number> = {
      page: 1,
      limit: pagination.limit,
    };
    if (filterType !== 'all') params.reportType = filterType;
    if (filterStatus !== 'all') params.status = filterStatus;
    dispatch(fetchReports(params));
  };

  useEffect(() => {
    handleFilterChange();
  }, [filterType, filterStatus]);

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
      pending: 'default',
      generating: 'primary',
      completed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  const getReportIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      lab_completion: <DescriptionIcon />,
      vulnerability_scan: <BugReportIcon />,
      progress_summary: <TimelineIcon />,
      custom: <AssessmentIcon />,
    };
    return icons[type] || <DescriptionIcon />;
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const params: Record<string, string | number> = {
      page,
      limit: pagination.limit,
    };
    if (filterType !== 'all') params.reportType = filterType;
    if (filterStatus !== 'all') params.status = filterStatus;
    dispatch(fetchReports(params));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenGenerateDialog(true)}
            disabled={isGenerating}
          >
            Generate Report
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Reports
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Failed
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.failed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={filterType}
              label="Report Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="lab_completion">Lab Completion</MenuItem>
              <MenuItem value="vulnerability_scan">Vulnerability Scan</MenuItem>
              <MenuItem value="progress_summary">Progress Summary</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="generating">Generating</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Reports Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Generated</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !reports || reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No reports found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report: Report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getReportIcon(report.reportType)}
                        <Typography variant="body2">
                          {report.reportType.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>
                      <Chip label={report.format.toUpperCase()} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        color={getStatusColor(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {report.generatedAt
                        ? format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {report.fileSize
                        ? `${(report.fileSize / 1024).toFixed(2)} KB`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {report.status === 'completed' && (
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleDownload(report.id, report.fileName || 'report')}
                              disabled={isDownloading}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(report.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Generate Report Dialog */}
      <Dialog
        open={openGenerateDialog}
        onClose={() => setOpenGenerateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={newReport.reportType}
                label="Report Type"
                onChange={(e) =>
                  setNewReport({ ...newReport, reportType: e.target.value as any })
                }
              >
                <MenuItem value="lab_completion">Lab Completion</MenuItem>
                <MenuItem value="vulnerability_scan">Vulnerability Scan</MenuItem>
                <MenuItem value="progress_summary">Progress Summary</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={newReport.format}
                label="Format"
                onChange={(e) => setNewReport({ ...newReport, format: e.target.value as any })}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Title"
              value={newReport.title}
              onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
              placeholder="Enter report title"
            />

            <TextField
              fullWidth
              label="Description"
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              multiline
              rows={3}
              placeholder="Enter report description (optional)"
            />

            {newReport.reportType === 'progress_summary' && (
              <>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={newReport.startDate || ''}
                  onChange={(e) => setNewReport({ ...newReport, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={newReport.endDate || ''}
                  onChange={(e) => setNewReport({ ...newReport, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={isGenerating || !newReport.title}
          >
            {isGenerating ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
