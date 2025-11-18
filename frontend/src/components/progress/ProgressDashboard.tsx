import React, { useEffect, useState } from 'react';
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
  Button,
  alpha,
  useTheme,
  Fade,
  Grow,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  CheckCircle,
  AccessTime,
  Lightbulb,
  Star,
  PlayArrow,
  Assessment,
  Speed,
  FireIcon,
  LocalFireDepartment,
  Explore,
  Settings,
  BookmarkBorder,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserProgress } from '@features/progress/progressSlice';
import { StatsCardSkeleton } from '@components/common/LoadingSkeleton';
import type { RootState, AppDispatch } from '../../store';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  gradient?: string;
  subtitle?: string;
  trend?: number;
  delay?: number;
}

/**
 * Modern Stat Card with Glassmorphism and Animations
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary.main',
  gradient,
  subtitle,
  trend,
  delay = 0,
}) => {
  const theme = useTheme();

  return (
    <Grow in timeout={500 + delay}>
      <Card
        sx={{
          height: '100%',
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                  theme.palette.background.default,
                  0.9
                )} 100%)`
              : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(color as string, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: `0 12px 30px ${alpha(color as string, 0.25)}, 0 0 15px ${alpha(
              color as string,
              0.15
            )}`,
            border: `1px solid ${alpha(color as string, 0.4)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: gradient || color,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                gutterBottom
                display="block"
                sx={{ fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}
              >
                {title}
              </Typography>
              <Typography
                variant="h3"
                fontWeight="800"
                sx={{
                  mb: 0.5,
                  background: gradient || color,
                  WebkitBackgroundClip: gradient ? 'text' : 'initial',
                  WebkitTextFillColor: gradient ? 'transparent' : 'initial',
                  backgroundClip: gradient ? 'text' : 'initial',
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <TrendingUp
                    sx={{
                      fontSize: 16,
                      color: trend > 0 ? 'success.main' : 'error.main',
                      transform: trend < 0 ? 'rotate(180deg)' : 'none',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: trend > 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {trend > 0 ? '+' : ''}
                    {trend}% this week
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar
              sx={{
                background: gradient || color,
                width: 56,
                height: 56,
                boxShadow: `0 8px 16px ${alpha(color as string, 0.3)}`,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-8px)' },
                },
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

/**
 * Quick Action Card Component
 */
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  onClick: () => void;
  delay?: number;
}

const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  color,
  onClick,
  delay = 0,
}) => {
  const theme = useTheme();

  return (
    <Fade in timeout={500 + delay}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
                  theme.palette.background.default,
                  0.8
                )} 100%)`
              : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(color, 0.2)}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 20px ${alpha(color, 0.25)}`,
            border: `1px solid ${alpha(color, 0.5)}`,
          },
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

/**
 * Modern ProgressDashboard Component
 * Enhanced with glassmorphism, animations, and modern widgets
 */
export const ProgressDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, isLoading } = useSelector((state: RootState) => state.progress);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProgress(user.id));
    }
  }, [dispatch, user]);

  // Mock data for demonstration
  const statsData = stats as
    | {
        completedLabs?: number;
        totalPoints?: number;
        rank?: number;
        timeSpent?: number;
        hintsUsed?: number;
        streak?: number;
      }
    | null;
  const completedLabs = statsData?.completedLabs || 8;
  const totalLabs = 25;
  const totalPoints = statsData?.totalPoints || 1250;
  const rank = statsData?.rank || 15;
  const timeSpent = statsData?.timeSpent || 3600; // in minutes
  const hintsUsed = statsData?.hintsUsed || 12;
  const streak = statsData?.streak || 5; // days

  const completionPercentage = (completedLabs / totalLabs) * 100;
  const hoursSpent = Math.floor(timeSpent / 60);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  if (isLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatsCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Banner */}
      {showWelcome && (
        <Fade in timeout={800}>
          <Paper
            sx={{
              mb: 4,
              p: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              border: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${alpha('#ffffff', 0.1)} 0%, transparent 70%)`,
                animation: 'pulse 4s ease-in-out infinite',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h3" fontWeight="800" gutterBottom>
                    {greeting}, {user?.username || 'Hacker'}! 👋
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    Ready to level up your cybersecurity skills?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<LocalFireDepartment sx={{ color: 'white !important' }} />}
                      label={`${streak} Day Streak`}
                      sx={{
                        backgroundColor: alpha('#ffffff', 0.2),
                        color: 'white',
                        fontWeight: 700,
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                    <Chip
                      icon={<Star sx={{ color: 'white !important' }} />}
                      label={`Rank #${rank}`}
                      sx={{
                        backgroundColor: alpha('#ffffff', 0.2),
                        color: 'white',
                        fontWeight: 700,
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                    <Chip
                      icon={<EmojiEvents sx={{ color: 'white !important' }} />}
                      label={`${totalPoints.toLocaleString()} Points`}
                      sx={{
                        backgroundColor: alpha('#ffffff', 0.2),
                        color: 'white',
                        fontWeight: 700,
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Points"
            value={totalPoints.toLocaleString()}
            icon={<EmojiEvents sx={{ fontSize: 28 }} />}
            color="#ffb020"
            gradient="linear-gradient(135deg, #ffb020 0%, #ff8c00 100%)"
            trend={12}
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Labs Completed"
            value={completedLabs}
            subtitle={`of ${totalLabs} total`}
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            color="#00ff88"
            gradient="linear-gradient(135deg, #00ff88 0%, #00cc6d 100%)"
            trend={8}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Global Rank"
            value={`#${rank}`}
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            color="#42a5f5"
            gradient="linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)"
            trend={-2}
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Streak"
            value={`${streak}`}
            subtitle="days in a row"
            icon={<LocalFireDepartment sx={{ fontSize: 28 }} />}
            color="#ff3864"
            gradient="linear-gradient(135deg, #ff3864 0%, #cc2d50 100%)"
            trend={5}
            delay={300}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Fade in timeout={1000}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Browse Labs"
                description="Explore available challenges"
                icon={<Explore />}
                color={theme.palette.primary.main}
                onClick={() => navigate('/labs')}
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Continue Learning"
                description="Resume your last lab"
                icon={<PlayArrow />}
                color="#00ff88"
                onClick={() => navigate('/labs')}
                delay={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="View Reports"
                description="Check your scan results"
                icon={<Assessment />}
                color="#ffb020"
                onClick={() => navigate('/reports')}
                delay={200}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Settings"
                description="Customize your experience"
                icon={<Settings />}
                color="#9c27b0"
                onClick={() => navigate('/settings')}
                delay={300}
              />
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Progress Overview */}
      <Fade in timeout={1200}>
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                    theme.palette.background.default,
                    0.9
                  )} 100%)`
                : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight="700">
            Overall Progress
          </Typography>
          <Box sx={{ mb: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Lab Completion
              </Typography>
              <Typography variant="body2" fontWeight="700" color="primary.main">
                {completedLabs}/{totalLabs} ({completionPercentage.toFixed(0)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
              }}
            />
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.info.main, 0.15),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 40, height: 40 }}>
                  <AccessTime fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                    Time Spent
                  </Typography>
                  <Typography variant="h6" fontWeight="700">
                    {hoursSpent}h {timeSpent % 60}m
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.warning.main, 0.15),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 40, height: 40 }}>
                  <Lightbulb fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                    Hints Used
                  </Typography>
                  <Typography variant="h6" fontWeight="700">
                    {hintsUsed}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.success.main, 0.15),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 40, height: 40 }}>
                  <EmojiEvents fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                    Avg Points/Lab
                  </Typography>
                  <Typography variant="h6" fontWeight="700">
                    {completedLabs > 0 ? Math.round(totalPoints / completedLabs) : 0}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1400}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background:
                  theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                        theme.palette.background.default,
                        0.9
                      )} 100%)`
                    : theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="700">
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                {[
                  {
                    lab: 'DVWA - SQL Injection',
                    action: 'Completed',
                    points: 150,
                    time: '2 hours ago',
                    color: '#00ff88',
                  },
                  {
                    lab: 'Juice Shop - XSS Challenge',
                    action: 'Started',
                    points: 0,
                    time: '1 day ago',
                    color: '#42a5f5',
                  },
                  {
                    lab: 'Metasploitable - Port Scanning',
                    action: 'Completed',
                    points: 200,
                    time: '3 days ago',
                    color: '#00ff88',
                  },
                ].map((activity, index) => (
                  <Fade in timeout={1600 + index * 100} key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        background:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.5)
                            : alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(activity.color, 0.2)}`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          background: alpha(activity.color, 0.1),
                          transform: 'translateX(8px)',
                          border: `1px solid ${alpha(activity.color, 0.4)}`,
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="700">
                          {activity.lab}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {activity.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={activity.action}
                          size="small"
                          sx={{
                            bgcolor: activity.action === 'Completed' ? '#00ff88' : '#42a5f5',
                            color: theme.palette.mode === 'dark' ? '#000' : '#fff',
                            fontWeight: 700,
                          }}
                        />
                        {activity.points > 0 && (
                          <Chip
                            icon={<EmojiEvents sx={{ fontSize: 14, color: '#000 !important' }} />}
                            label={`+${activity.points}`}
                            size="small"
                            sx={{
                              bgcolor: '#ffb020',
                              color: '#000',
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Paper>
          </Fade>
        </Grid>

        {/* Skills Breakdown */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1600}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background:
                  theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                        theme.palette.background.default,
                        0.9
                      )} 100%)`
                    : theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="700">
                Skills Breakdown
              </Typography>
              <Box sx={{ mt: 3 }}>
                {[
                  { skill: 'Web Security', level: 75, color: '#42a5f5' },
                  { skill: 'Network Security', level: 60, color: '#00ff88' },
                  { skill: 'Cryptography', level: 45, color: '#ffb020' },
                  { skill: 'Exploitation', level: 80, color: '#ff3864' },
                ].map((skill, index) => (
                  <Fade in timeout={1800 + index * 100} key={skill.skill}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {skill.skill}
                        </Typography>
                        <Typography variant="body2" fontWeight="700" color="primary.main">
                          {skill.level}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.level}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: alpha(skill.color, 0.15),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            background: `linear-gradient(90deg, ${skill.color}, ${alpha(skill.color, 0.7)})`,
                            boxShadow: `0 0 8px ${alpha(skill.color, 0.5)}`,
                          },
                        }}
                      />
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgressDashboard;
