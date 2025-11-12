import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  CheckCircle,
  AccessTime,
  Lightbulb,
  Star,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProgress } from '@features/progress/progressSlice';
import type { RootState, AppDispatch } from '../../store';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary.main', subtitle }) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ backgroundColor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * ProgressDashboard Component
 * Displays user progress statistics and achievements
 */
export const ProgressDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, isLoading } = useSelector((state: RootState) => state.progress);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProgress(user.id));
    }
  }, [dispatch, user]);

  // Mock data for demonstration (stats is unknown type, so we provide defaults)
  const statsData = stats as { completedLabs?: number; totalPoints?: number; rank?: number; timeSpent?: number; hintsUsed?: number; streak?: number } | null;
  const completedLabs = statsData?.completedLabs || 8;
  const totalLabs = 25;
  const totalPoints = statsData?.totalPoints || 1250;
  const rank = statsData?.rank || 15;
  const timeSpent = statsData?.timeSpent || 3600; // in minutes
  const hintsUsed = statsData?.hintsUsed || 12;
  const streak = statsData?.streak || 5; // days

  const completionPercentage = (completedLabs / totalLabs) * 100;
  const hoursSpent = Math.floor(timeSpent / 60);

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Your Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning journey and achievements
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Points"
            value={totalPoints.toLocaleString()}
            icon={<EmojiEvents />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Labs Completed"
            value={completedLabs}
            subtitle={`of ${totalLabs} total`}
            icon={<CheckCircle />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Global Rank"
            value={`#${rank}`}
            icon={<TrendingUp />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Streak"
            value={`${streak} days`}
            icon={<Star />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      {/* Progress Overview */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Overall Progress
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Lab Completion
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completedLabs}/{totalLabs} ({completionPercentage.toFixed(0)}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: '#4caf50',
              },
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Time Spent
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {hoursSpent}h {timeSpent % 60}m
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Hints Used
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {hintsUsed}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Avg Points/Lab
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {completedLabs > 0 ? Math.round(totalPoints / completedLabs) : 0}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Activity */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Recent Activity
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Mock recent activities */}
          {[
            { lab: 'DVWA - SQL Injection', action: 'Completed', points: 150, time: '2 hours ago' },
            { lab: 'Juice Shop - XSS Challenge', action: 'Started', points: 0, time: '1 day ago' },
            { lab: 'Metasploitable - Port Scanning', action: 'Completed', points: 200, time: '3 days ago' },
          ].map((activity, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
                backgroundColor: 'grey.50',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {activity.lab}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activity.time}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={activity.action}
                  size="small"
                  color={activity.action === 'Completed' ? 'success' : 'primary'}
                  variant="outlined"
                />
                {activity.points > 0 && (
                  <Chip
                    icon={<EmojiEvents />}
                    label={`+${activity.points}`}
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Skills Breakdown */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Skills Breakdown
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[
            { skill: 'Web Security', level: 75, color: '#2196f3' },
            { skill: 'Network Security', level: 60, color: '#4caf50' },
            { skill: 'Cryptography', level: 45, color: '#ff9800' },
            { skill: 'Exploitation', level: 80, color: '#f44336' },
          ].map((skill) => (
            <Grid item xs={12} sm={6} key={skill.skill}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{skill.skill}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {skill.level}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={skill.level}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: skill.color,
                    },
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProgressDashboard;
