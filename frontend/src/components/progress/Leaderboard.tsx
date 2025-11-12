import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Remove,
  Stars,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '@features/progress/progressSlice';
import type { RootState, AppDispatch } from '../../store';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  labsCompleted: number;
  rankChange?: number;
  streak?: number;
}

const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

/**
 * Leaderboard Component
 * Displays global and weekly leaderboards with rankings
 */
export const Leaderboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaderboard: _leaderboard, isLoading } = useSelector((state: RootState) => state.progress);
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  // Mock leaderboard data
  const mockGlobalLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: '1', username: 'CyberNinja', totalPoints: 5200, labsCompleted: 24, rankChange: 0, streak: 15 },
    { rank: 2, userId: '2', username: 'SecurityPro', totalPoints: 4850, labsCompleted: 23, rankChange: 2, streak: 12 },
    { rank: 3, userId: '3', username: 'HackMaster', totalPoints: 4720, labsCompleted: 22, rankChange: -1, streak: 8 },
    { rank: 4, userId: '4', username: 'PenTester99', totalPoints: 4100, labsCompleted: 20, rankChange: 1, streak: 10 },
    { rank: 5, userId: '5', username: 'WhiteHat', totalPoints: 3950, labsCompleted: 19, rankChange: -2, streak: 7 },
    { rank: 6, userId: '6', username: 'BugHunter', totalPoints: 3800, labsCompleted: 18, rankChange: 0, streak: 5 },
    { rank: 7, userId: '7', username: 'RedTeamer', totalPoints: 3650, labsCompleted: 17, rankChange: 3, streak: 9 },
    { rank: 8, userId: '8', username: 'SecAnalyst', totalPoints: 3500, labsCompleted: 16, rankChange: -1, streak: 6 },
    { rank: 9, userId: '9', username: 'CryptoKing', totalPoints: 3350, labsCompleted: 15, rankChange: 1, streak: 11 },
    { rank: 10, userId: '10', username: 'NetDefender', totalPoints: 3200, labsCompleted: 14, rankChange: -2, streak: 4 },
  ];

  const mockWeeklyLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: '7', username: 'RedTeamer', totalPoints: 850, labsCompleted: 4, rankChange: 5 },
    { rank: 2, userId: '2', username: 'SecurityPro', totalPoints: 720, labsCompleted: 3, rankChange: 1 },
    { rank: 3, userId: '9', username: 'CryptoKing', totalPoints: 680, labsCompleted: 3, rankChange: 3 },
  ];

  const currentLeaderboard = activeTab === 0 ? mockGlobalLeaderboard : mockWeeklyLeaderboard;
  const currentUserRank = currentLeaderboard.find((entry) => entry.userId === user?.id);

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <EmojiEvents
          sx={{
            color: MEDAL_COLORS[rank as keyof typeof MEDAL_COLORS],
            fontSize: 28,
          }}
        />
      );
    }
    return (
      <Typography variant="h6" fontWeight="bold" color="text.secondary">
        #{rank}
      </Typography>
    );
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Remove fontSize="small" color="disabled" />;
    if (change > 0)
      return (
        <Tooltip title={`Up ${change} ${change === 1 ? 'place' : 'places'}`}>
          <TrendingUp fontSize="small" color="success" />
        </Tooltip>
      );
    return (
      <Tooltip title={`Down ${Math.abs(change)} ${Math.abs(change) === 1 ? 'place' : 'places'}`}>
        <TrendingDown fontSize="small" color="error" />
      </Tooltip>
    );
  };

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Leaderboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compete with other learners and climb the ranks
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Global Rankings" />
          <Tab label="This Week" />
        </Tabs>

        {/* Current User Rank Card */}
        {currentUserRank && (
          <Box sx={{ p: 2, backgroundColor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Your Rank
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getRankIcon(currentUserRank.rank)}
                <Avatar sx={{ width: 36, height: 36 }}>
                  {currentUserRank.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {currentUserRank.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentUserRank.totalPoints.toLocaleString()} points • {currentUserRank.labsCompleted} labs
                  </Typography>
                </Box>
              </Box>
              {getRankChangeIcon(currentUserRank.rankChange)}
            </Box>
          </Box>
        )}

        {/* Leaderboard Table */}
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width="10%">Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Points</TableCell>
                <TableCell align="right">Labs</TableCell>
                <TableCell align="right">Streak</TableCell>
                <TableCell align="right">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentLeaderboard.map((entry) => {
                const isCurrentUser = entry.userId === user?.id;
                return (
                  <TableRow
                    key={entry.userId}
                    sx={{
                      backgroundColor: isCurrentUser ? 'primary.50' : 'transparent',
                      '&:hover': { backgroundColor: isCurrentUser ? 'primary.100' : 'grey.50' },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getRankIcon(entry.rank)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {entry.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={isCurrentUser ? 'bold' : 'normal'}>
                            {entry.username}
                            {isCurrentUser && (
                              <Chip label="You" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<EmojiEvents />}
                        label={entry.totalPoints.toLocaleString()}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {entry.labsCompleted}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {entry.streak && entry.streak > 0 ? (
                        <Chip
                          icon={<Stars />}
                          label={`${entry.streak} days`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{getRankChangeIcon(entry.rankChange)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Leaderboard;
