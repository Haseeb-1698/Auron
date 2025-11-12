import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Lock,
  CheckCircle,
  EmojiEvents,
  Star,
  WorkspacePremium,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBadges } from '@features/progress/progressSlice';
import type { RootState, AppDispatch } from '../../store';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsReward: number;
  isUnlocked: boolean;
  progress: number;
  earnedAt?: string;
}

const RARITY_COLORS = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

const RARITY_ICONS = {
  common: Star,
  rare: EmojiEvents,
  epic: WorkspacePremium,
  legendary: WorkspacePremium,
};

/**
 * BadgeDisplay Component
 * Shows user badges and achievements with unlock progress
 */
export const BadgeDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { badges, isLoading } = useSelector((state: RootState) => state.progress);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserBadges(user.id));
    }
  }, [dispatch, user]);

  // Mock badges data
  const mockBadges: Badge[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first lab',
      category: 'completion',
      rarity: 'common',
      pointsReward: 10,
      isUnlocked: true,
      progress: 100,
      earnedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Lab Enthusiast',
      description: 'Complete 5 labs',
      category: 'completion',
      rarity: 'rare',
      pointsReward: 50,
      isUnlocked: true,
      progress: 100,
      earnedAt: '2024-02-20',
    },
    {
      id: '3',
      name: 'Lab Master',
      description: 'Complete all labs',
      category: 'completion',
      rarity: 'epic',
      pointsReward: 250,
      isUnlocked: false,
      progress: 32,
    },
    {
      id: '4',
      name: 'Point Hunter',
      description: 'Earn 500 total points',
      category: 'points',
      rarity: 'common',
      pointsReward: 25,
      isUnlocked: true,
      progress: 100,
      earnedAt: '2024-01-25',
    },
    {
      id: '5',
      name: 'Point Collector',
      description: 'Earn 1000 total points',
      category: 'points',
      rarity: 'rare',
      pointsReward: 75,
      isUnlocked: false,
      progress: 75,
    },
    {
      id: '6',
      name: 'Legend',
      description: 'Earn 5000 total points',
      category: 'points',
      rarity: 'legendary',
      pointsReward: 500,
      isUnlocked: false,
      progress: 15,
    },
    {
      id: '7',
      name: 'Web Security Expert',
      description: 'Complete the DVWA lab',
      category: 'special',
      rarity: 'epic',
      pointsReward: 100,
      isUnlocked: true,
      progress: 100,
      earnedAt: '2024-02-10',
    },
    {
      id: '8',
      name: 'API Security Specialist',
      description: 'Complete the Juice Shop lab',
      category: 'special',
      rarity: 'epic',
      pointsReward: 100,
      isUnlocked: false,
      progress: 60,
    },
  ];

  const allBadges: Badge[] = (badges as Badge[] | null) || mockBadges;
  const unlockedCount = allBadges.filter((b: Badge) => b.isUnlocked).length;
  const totalCount = allBadges.length;

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
          Achievements & Badges
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Unlock badges by completing challenges and reaching milestones
        </Typography>
      </Box>

      {/* Progress Overview */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Collection Progress
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {unlockedCount}/{totalCount}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(unlockedCount / totalCount) * 100}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: 'linear-gradient(90deg, #2196f3 0%, #9c27b0 50%, #ff9800 100%)',
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {((unlockedCount / totalCount) * 100).toFixed(0)}% Complete
        </Typography>
      </Paper>

      {/* Badges Grid */}
      <Grid container spacing={3}>
        {allBadges.map((badge: Badge) => {
          const RarityIcon = RARITY_ICONS[badge.rarity as keyof typeof RARITY_ICONS];
          const rarityColor = RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS];

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
              <Card
                elevation={badge.isUnlocked ? 3 : 1}
                sx={{
                  height: '100%',
                  position: 'relative',
                  opacity: badge.isUnlocked ? 1 : 0.7,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: badge.isUnlocked ? 'translateY(-4px)' : 'none',
                    boxShadow: badge.isUnlocked ? 8 : 1,
                  },
                }}
              >
                {/* Rarity Banner */}
                <Box
                  sx={{
                    height: 6,
                    background: `linear-gradient(90deg, ${rarityColor}99, ${rarityColor})`,
                  }}
                />

                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  {/* Badge Icon */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    {badge.isUnlocked ? (
                      <Box
                        sx={{
                          position: 'relative',
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: `${rarityColor}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RarityIcon
                          sx={{
                            fontSize: 48,
                            color: rarityColor,
                          }}
                        />
                        <CheckCircle
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            fontSize: 24,
                            color: 'success.main',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          backgroundColor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Lock sx={{ fontSize: 40, color: 'grey.400' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Badge Info */}
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {badge.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ minHeight: 40 }}>
                    {badge.description}
                  </Typography>

                  {/* Rarity & Points */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      label={badge.rarity.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: `${rarityColor}22`,
                        color: rarityColor,
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                      }}
                    />
                    <Chip
                      icon={<EmojiEvents />}
                      label={`+${badge.pointsReward}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>

                  {/* Progress Bar for Locked Badges */}
                  {!badge.isUnlocked && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Progress: {badge.progress}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={badge.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: rarityColor,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Earned Date */}
                  {badge.isUnlocked && badge.earnedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BadgeDisplay;
