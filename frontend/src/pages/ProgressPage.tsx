import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Schedule,
  EmojiEvents,
  Star,
  Assignment,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import type { UserProgress } from '../types';
import { ProgressStatus } from '../types';
import { ProgressDashboard } from '@components/progress/ProgressDashboard';
import { Leaderboard } from '@components/progress/Leaderboard';
import { BadgeDisplay } from '@components/progress/BadgeDisplay';
import { fetchUserProgress, fetchUserStats } from '@features/progress/progressSlice';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProgressPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { progress, isLoading } = useSelector((state: RootState) => state.progress);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchUserProgress(''));
    dispatch(fetchUserStats());
  }, [dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const completedLabs = progress.filter((p: UserProgress) => p.status === ProgressStatus.COMPLETED).length;
  const inProgressLabs = progress.filter((p: UserProgress) => p.status === ProgressStatus.IN_PROGRESS).length;
  const totalTimeSpent = progress.reduce((sum: number, p: UserProgress) => sum + (p.timeSpent || 0), 0);
  const averageScore = progress.length > 0
    ? progress.reduce((sum: number, p: UserProgress) => sum + (p.score || 0), 0) / progress.length
    : 0;

  // Calculate recent activity (labs completed in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCompletions = progress.filter((p: UserProgress) => {
    if (!p.completedAt) return false;
    return new Date(p.completedAt) >= sevenDaysAgo;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Progress
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Completed Labs
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {completedLabs}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.length > 0
                  ? `${((completedLabs / progress.length) * 100).toFixed(1)}% of enrolled labs`
                  : 'Start your first lab'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {inProgressLabs}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active lab sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Time
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {Math.floor(totalTimeSpent / 3600)}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.floor((totalTimeSpent % 3600) / 60)}m spent learning
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Star color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Score
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {averageScore.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across all labs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" icon={<Assignment />} iconPosition="start" />
          <Tab label="Achievements" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Leaderboard" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Main Dashboard */}
        <ProgressDashboard />

        {/* Lab Progress Details */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Lab Progress Details
            </Typography>

            {isLoading ? (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
              </Box>
            ) : progress.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No lab progress yet. Start a lab to begin!
              </Typography>
            ) : (
              <List>
                {progress.map((labProgress: UserProgress) => (
                  <ListItem
                    key={labProgress.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon>
                      {labProgress.status === ProgressStatus.COMPLETED ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Schedule color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            Lab {labProgress.labId}
                          </Typography>
                          {labProgress.status === ProgressStatus.COMPLETED && (
                            <Chip label="Completed" size="small" color="success" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Score: {labProgress.score || 0} • Time: {Math.floor((labProgress.timeSpent || 0) / 60)}m
                          </Typography>
                          {labProgress.completedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Completed: {format(new Date(labProgress.completedAt), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={labProgress.score}
                              color={labProgress.status === ProgressStatus.COMPLETED ? 'success' : 'primary'}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recentCompletions.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Activity (Last 7 Days)
              </Typography>
              <List>
                {recentCompletions.slice(0, 5).map((labProgress: UserProgress) => (
                  <ListItem key={labProgress.id}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Completed Lab ${labProgress.labId}`}
                      secondary={`Score: ${labProgress.score || 0} • ${format(
                        new Date(labProgress.completedAt || new Date()),
                        'MMM dd, yyyy HH:mm'
                      )}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Badges & Achievements
              </Typography>
              <BadgeDisplay />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Points Breakdown
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Lab Completions</Typography>
                    <Typography fontWeight="bold">{completedLabs * 100} pts</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Perfect Scores</Typography>
                    <Typography fontWeight="bold">
                      {progress.filter((p: UserProgress) => p.score === 100).length * 50} pts
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Speed Bonuses</Typography>
                    <Typography fontWeight="bold">0 pts</Typography>
                  </Box>
                  <Box sx={{ borderTop: 2, borderColor: 'divider', pt: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total Points</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {progress.reduce((sum: number, p: UserProgress) => sum + (p.score || 0), 0)} pts
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Next Milestones
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Complete 10 Labs"
                      secondary={`${completedLabs}/10 completed`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Earn 1000 Points"
                      secondary={`${progress.reduce((sum: number, p: UserProgress) => sum + (p.score || 0), 0)}/1000 points`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Achieve 5 Perfect Scores"
                      secondary={`${progress.filter((p: UserProgress) => p.score === 100).length}/5 perfect scores`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Leaderboard />
      </TabPanel>
    </Container>
  );
}
