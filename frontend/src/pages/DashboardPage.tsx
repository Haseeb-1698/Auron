import { useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, LinearProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { fetchDashboardStats } from '@features/dashboard/dashboardSlice';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScienceIcon from '@mui/icons-material/Science';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';

export default function DashboardPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { stats, isLoading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (isLoading || !stats) {
    return <Box><LinearProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Completed Labs</Typography>
              </Box>
              <Typography variant="h4">{stats.completedLabs}</Typography>
              <Typography variant="body2" color="text.secondary">
                of {stats.totalLabs} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmojiEventsIcon color="warning" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Total Points</Typography>
              </Box>
              <Typography variant="h4">{stats.totalPoints}</Typography>
              <Typography variant="body2" color="text.secondary">
                Rank #{stats.ranking}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Average Score</Typography>
              </Box>
              <Typography variant="h4">{stats.averageScore}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon color="info" sx={{ mr: 1 }} />
                <Typography color="text.secondary">Time Spent</Typography>
              </Box>
              <Typography variant="h4">{Math.round(stats.timeSpent / 3600)}h</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
