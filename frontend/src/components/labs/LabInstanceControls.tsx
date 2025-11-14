import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Delete,
  OpenInNew,
  AccessTime,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { startLab, stopLab } from '@features/labs/labsSlice';
import type { LabInstance, LabInstanceStatus } from '../../types';
import type { AppDispatch } from '../../store';

interface LabInstanceControlsProps {
  labId: string;
  instance: LabInstance | null;
  onReset?: () => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<
  LabInstanceStatus,
  { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning'; icon: React.ReactElement }
> = {
  starting: {
    label: 'Starting...',
    color: 'warning',
    icon: <CircularProgress size={16} />,
  },
  running: {
    label: 'Running',
    color: 'success',
    icon: <CheckCircle fontSize="small" />,
  },
  stopping: {
    label: 'Stopping...',
    color: 'warning',
    icon: <CircularProgress size={16} />,
  },
  stopped: {
    label: 'Stopped',
    color: 'default',
    icon: <Stop fontSize="small" />,
  },
  error: {
    label: 'Error',
    color: 'error',
    icon: <ErrorIcon fontSize="small" />,
  },
};

/**
 * LabInstanceControls Component
 * Provides controls for managing lab instances (start, stop, reset, delete)
 */
export const LabInstanceControls: React.FC<LabInstanceControlsProps> = ({
  labId,
  instance,
  onReset,
  onDelete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<'stop' | 'reset' | 'delete' | null>(null);

  const handleStartLab = async () => {
    setIsLoading(true);
    try {
      await dispatch(startLab(labId)).unwrap();
    } catch (error) {
      console.error('Failed to start lab:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopLab = async () => {
    if (!instance) return;

    setIsLoading(true);
    try {
      await dispatch(stopLab(instance.id)).unwrap();
      setConfirmDialog(null);
    } catch (error) {
      console.error('Failed to stop lab:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLab = async () => {
    if (onReset) {
      setIsLoading(true);
      try {
        await onReset();
        setConfirmDialog(null);
      } catch (error) {
        console.error('Failed to reset lab:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteLab = async () => {
    if (onDelete) {
      setIsLoading(true);
      try {
        await onDelete();
        setConfirmDialog(null);
      } catch (error) {
        console.error('Failed to delete lab:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m remaining`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m remaining`;
  };

  const statusConfig = instance ? STATUS_CONFIG[instance.status] : null;
  const isRunning = instance?.status === 'running';
  const isStopped = !instance || instance.status === 'stopped';
  const isTransitioning = instance?.status === 'starting' || instance?.status === 'stopping';

  return (
    <Box>
      {/* Status Card */}
      {instance && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Instance Status
            </Typography>
            {statusConfig && (
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                color={statusConfig.color}
                size="small"
              />
            )}
          </Box>

          {/* Time Remaining */}
          {isRunning && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatTimeRemaining(instance.expiresAt)}
              </Typography>
            </Box>
          )}

          {/* Access URL */}
          {isRunning && instance.accessUrl && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Access URL:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  component="a"
                  href={instance.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                    wordBreak: 'break-all',
                  }}
                >
                  {instance.accessUrl}
                </Typography>
                <IconButton
                  size="small"
                  component="a"
                  href={instance.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Box>
            </Alert>
          )}

          {/* Port Mappings */}
          {isRunning && instance.ports && instance.ports.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Port Mappings:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {instance.ports.map((port, index) => (
                  <Chip
                    key={index}
                    label={`${port.container}${port.host ? ` → ${port.host}` : ''}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Control Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {isStopped ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={handleStartLab}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Starting...' : 'Start Lab'}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={() => setConfirmDialog('stop')}
              disabled={isTransitioning || isLoading}
              sx={{ flex: 1 }}
            >
              Stop
            </Button>

            {onReset && (
              <Tooltip title="Reset lab to initial state">
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => setConfirmDialog('reset')}
                  disabled={isTransitioning || isLoading}
                  sx={{ flex: 1 }}
                >
                  Reset
                </Button>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip title="Delete this instance">
                <IconButton
                  color="error"
                  onClick={() => setConfirmDialog('delete')}
                  disabled={isTransitioning || isLoading}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog === 'stop'} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Stop Lab Instance?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to stop this lab? Your progress will be saved, but you&apos;ll need to
            start the lab again to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button onClick={handleStopLab} color="error" variant="contained">
            Stop Lab
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog === 'reset'} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Reset Lab Instance?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reset the lab to its initial state. All changes made in the environment will
            be lost. Your progress tracking will not be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button onClick={handleResetLab} color="warning" variant="contained">
            Reset Lab
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog === 'delete'} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>Delete Lab Instance?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the lab instance. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button onClick={handleDeleteLab} color="error" variant="contained">
            Delete Instance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabInstanceControls;
