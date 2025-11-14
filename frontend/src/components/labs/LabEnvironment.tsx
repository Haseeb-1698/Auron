import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  EmojiEvents,
  Lightbulb,
  Terminal as TerminalIcon,
  Description,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchLabDetail, submitExercise, resetLab } from '@features/labs/labsSlice';
import { fetchUserProgress } from '@features/progress/progressSlice';
import { getHint } from '@features/ai/aiSlice';
import { LabInstanceControls } from './LabInstanceControls';
import { ProgressStatus } from '../../types';
import type { Lab, Exercise } from '../../types';
import type { RootState, AppDispatch } from '../../store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * LabEnvironment Component
 * Main lab interface with instructions, terminal, and instance controls
 */
export const LabEnvironment: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentLab, currentInstance, isLoading } = useSelector((state: RootState) => state.labs);
  const { progress: userProgress } = useSelector((state: RootState) => state.progress);
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentHint, isLoading: aiLoading } = useSelector((state: RootState) => state.ai);

  const [activeTab, setActiveTab] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | false>(false);
  const [solutionText, setSolutionText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hintDialog, setHintDialog] = useState(false);

  useEffect(() => {
    if (labId) {
      dispatch(fetchLabDetail(labId));
      if (user?.id) {
        dispatch(fetchUserProgress(user.id));
      }
    }
  }, [labId, dispatch, user]);

  if (isLoading || !currentLab) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const lab: Lab = currentLab;

  // Calculate completed exercises from progress
  const completedExercisesCount = Array.isArray(userProgress)
    ? userProgress.filter(
        (p) => p.labId === labId && p.status === ProgressStatus.COMPLETED
      ).length
    : 0;

  const totalExercises = lab.exercises?.length || 0;
  const progressPercentage =
    totalExercises > 0 ? (completedExercisesCount / totalExercises) * 100 : 0;

  // Check if an exercise is completed
  const isExerciseCompleted = (exerciseId: string): boolean => {
    if (!Array.isArray(userProgress)) return false;
    return userProgress.some(
      (p) =>
        p.labId === labId &&
        p.exerciseId === exerciseId &&
        p.status === ProgressStatus.COMPLETED
    );
  };

  const handleExerciseChange = (exerciseId: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedExercise(isExpanded ? exerciseId : false);
  };

  const handleRequestHint = async (exerciseId: string, context: string) => {
    if (!labId) return;

    try {
      await dispatch(getHint({ labId, exerciseId, context })).unwrap();
      setHintDialog(true);
    } catch (error) {
      toast.error('Failed to get hint. Please try again.');
      console.error('Failed to get hint:', error);
    }
  };

  const handleSubmitSolution = async (exerciseId: string) => {
    if (!labId || !solutionText[exerciseId]) {
      toast.warning('Please enter a solution before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        submitExercise({
          labId,
          exerciseId,
          solution: solutionText[exerciseId],
        })
      ).unwrap();

      toast.success('Solution submitted successfully!');

      // Refresh progress
      if (user?.id) {
        dispatch(fetchUserProgress(user.id));
      }

      // Clear solution text
      setSolutionText((prev) => ({ ...prev, [exerciseId]: '' }));
    } catch (error) {
      toast.error('Failed to submit solution. Please try again.');
      console.error('Failed to submit solution:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetLab = async () => {
    if (!currentInstance) return;

    try {
      await dispatch(resetLab(currentInstance.id)).unwrap();
      toast.success('Lab reset successfully!');
    } catch (error) {
      toast.error('Failed to reset lab. Please try again.');
      console.error('Failed to reset lab:', error);
    }
  };

  const handleDeleteLab = async () => {
    // For now, delete just stops the lab
    // In the future, this could call a dedicated delete endpoint
    if (!currentInstance) return;

    try {
      await dispatch(resetLab(currentInstance.id)).unwrap();
      toast.success('Lab instance deleted!');
    } catch (error) {
      toast.error('Failed to delete lab. Please try again.');
      console.error('Failed to delete lab:', error);
    }
  };

  return (
    <Box>
      {/* Lab Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {lab.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {lab.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={lab.category} size="small" color="primary" variant="outlined" />
              <Chip label={lab.difficulty} size="small" />
              <Chip icon={<EmojiEvents />} label={`${lab.points} points`} size="small" />
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Lab Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completedExercisesCount}/{totalExercises} exercises completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: progressPercentage === 100 ? '#4caf50' : '#2196f3',
              },
            }}
          />
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Panel - Instructions & Exercises */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2}>
            <Tabs
              value={activeTab}
              onChange={(_e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Description />} label="Overview" iconPosition="start" />
              <Tab icon={<TerminalIcon />} label="Exercises" iconPosition="start" />
            </Tabs>

            {/* Overview Tab */}
            <TabPanel value={activeTab} index={0}>
              {/* Learning Objectives */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Learning Objectives
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {lab.learningObjectives?.map((objective, index) => (
                    <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                      {objective}
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Prerequisites */}
              {lab.prerequisites && lab.prerequisites.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Prerequisites
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {lab.prerequisites.map((prereq, index) => (
                      <Chip key={index} label={prereq} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Tags */}
              {lab.tags && lab.tags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Topics Covered
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {lab.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
              )}
            </TabPanel>

            {/* Exercises Tab */}
            <TabPanel value={activeTab} index={1}>
              {lab.exercises && lab.exercises.length > 0 ? (
                <Box>
                  {lab.exercises
                    .sort((a, b) => a.order - b.order)
                    .map((exercise: Exercise) => (
                      <Accordion
                        key={exercise.id}
                        expanded={expandedExercise === exercise.id}
                        onChange={handleExerciseChange(exercise.id)}
                        sx={{ mb: 1 }}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <CheckCircle
                              sx={{
                                color: isExerciseCompleted(exercise.id) ? '#4caf50' : 'grey.300',
                                fontSize: 20,
                              }}
                            />
                            <Typography fontWeight="bold" sx={{ flex: 1 }}>
                              {exercise.order}. {exercise.title}
                            </Typography>
                            {isExerciseCompleted(exercise.id) && (
                              <Chip label="Completed" size="small" color="success" />
                            )}
                            <Chip
                              icon={<EmojiEvents />}
                              label={`${exercise.points} pts`}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          {/* Description */}
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {exercise.description}
                          </Typography>

                          {/* Instructions */}
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                              Instructions
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ whiteSpace: 'pre-wrap' }}
                              component="div"
                              dangerouslySetInnerHTML={{ __html: exercise.instructions }}
                            />
                          </Alert>

                          {/* Hints */}
                          {exercise.hints && exercise.hints.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                <Lightbulb fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                Hints Available ({exercise.hints.length})
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Lightbulb />}
                                onClick={() => handleRequestHint(exercise.id, exercise.description)}
                                disabled={aiLoading}
                              >
                                {aiLoading ? 'Loading...' : 'Request Hint'}
                              </Button>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                Costs points
                              </Typography>
                            </Box>
                          )}

                          {/* Solution Input */}
                          {!isExerciseCompleted(exercise.id) && (
                            <Box sx={{ mb: 2 }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Your Solution"
                                placeholder="Enter your solution, flag, or answer here..."
                                value={solutionText[exercise.id] || ''}
                                onChange={(e) =>
                                  setSolutionText((prev) => ({
                                    ...prev,
                                    [exercise.id]: e.target.value,
                                  }))
                                }
                              />
                            </Box>
                          )}

                          {/* Submit Button */}
                          {isExerciseCompleted(exercise.id) ? (
                            <Alert severity="success">
                              Exercise completed! Great work!
                            </Alert>
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              onClick={() => handleSubmitSolution(exercise.id)}
                              disabled={submitting || !solutionText[exercise.id]}
                            >
                              {submitting ? 'Submitting...' : 'Submit Solution'}
                            </Button>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                </Box>
              ) : (
                <Alert severity="info">No exercises available for this lab yet.</Alert>
              )}
            </TabPanel>
          </Paper>
        </Grid>

        {/* Right Panel - Instance Controls & Terminal */}
        <Grid item xs={12} md={6}>
          {/* Instance Controls */}
          <Box sx={{ mb: 3 }}>
            <LabInstanceControls
              labId={lab.id}
              instance={currentInstance}
              onReset={handleResetLab}
              onDelete={handleDeleteLab}
            />
          </Box>

          {/* Terminal/Console Area */}
          {currentInstance && currentInstance.status === 'running' && (
            <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', minHeight: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TerminalIcon />
                <Typography variant="subtitle2" fontWeight="bold">
                  Lab Terminal
                </Typography>
              </Box>
              <Box
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  color: 'grey.300',
                }}
              >
                {/* Terminal content would go here */}
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  $ Connected to lab environment
                  <br />$ Access URL: {currentInstance.accessUrl}
                  <br />$ Type &apos;help&apos; for available commands
                  <br />$
                </Typography>
              </Box>
            </Paper>
          )}

          {!currentInstance && (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Start the lab to access the environment
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* AI Hint Dialog */}
      <Dialog open={hintDialog} onClose={() => setHintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb color="primary" />
            AI Hint
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentHint && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Hint Cost:</strong> {currentHint.cost} points
                </Typography>
              </Alert>
              <Typography variant="body1">{currentHint.content}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHintDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabEnvironment;
