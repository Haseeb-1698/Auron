import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import type { RootState, AppDispatch } from '../store';
import { fetchLabs } from '@features/labs/labsSlice';
import { fetchUserProgress } from '@features/progress/progressSlice';
import { LabCard } from '@components/labs/LabCard';
import { LabCategory, LabDifficulty, ProgressStatus } from '../types';

export default function LabsPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { labs, isLoading, error } = useSelector((state: RootState) => state.labs);
  const { progress } = useSelector((state: RootState) => state.progress);
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchLabs());
    if (user?.id) {
      dispatch(fetchUserProgress(user.id));
    }
  }, [dispatch, user]);

  // Filter labs based on search and filters
  const filteredLabs = labs.filter((lab) => {
    const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || lab.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || lab.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get progress for each lab by aggregating exercise progress
  const getLabProgress = (labId: string): number => {
    if (!Array.isArray(progress)) return 0;

    // Find the lab to get total exercises
    const lab = labs.find((l) => l.id === labId);
    if (!lab || !lab.exercises || lab.exercises.length === 0) return 0;

    const totalExercises = lab.exercises.length;

    // Count completed exercises for this lab
    const completedExercises = progress.filter(
      (p) => p.labId === labId && p.status === ProgressStatus.COMPLETED
    ).length;

    return totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0;
  };

  // Stats - count labs where all exercises are completed
  const totalLabs = labs.length;
  const completedLabs = labs.filter((lab) => {
    if (!Array.isArray(progress) || !lab.exercises || lab.exercises.length === 0) return false;
    const totalExercises = lab.exercises.length;
    const completedExercises = progress.filter(
      (p) => p.labId === lab.id && p.status === ProgressStatus.COMPLETED
    ).length;
    return completedExercises === totalExercises;
  }).length;

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Cybersecurity Labs
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Hands-on training labs to develop your cybersecurity skills
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Chip
            label={`${totalLabs} Total Labs`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${completedLabs} Completed`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${filteredLabs.length} Showing`}
            color="default"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search labs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value={LabCategory.WEB_SECURITY}>Web Security</MenuItem>
              <MenuItem value={LabCategory.NETWORK_SECURITY}>Network Security</MenuItem>
              <MenuItem value={LabCategory.CRYPTOGRAPHY}>Cryptography</MenuItem>
              <MenuItem value={LabCategory.EXPLOITATION}>Exploitation</MenuItem>
              <MenuItem value={LabCategory.DEFENSIVE}>Defensive Security</MenuItem>
              <MenuItem value={LabCategory.FORENSICS}>Digital Forensics</MenuItem>
            </TextField>
          </Grid>

          {/* Difficulty Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value={LabDifficulty.BEGINNER}>Beginner</MenuItem>
              <MenuItem value={LabDifficulty.INTERMEDIATE}>Intermediate</MenuItem>
              <MenuItem value={LabDifficulty.ADVANCED}>Advanced</MenuItem>
              <MenuItem value={LabDifficulty.EXPERT}>Expert</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Labs Grid */}
      {!isLoading && filteredLabs.length > 0 && (
        <Grid container spacing={3}>
          {filteredLabs.map((lab) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={lab.id}>
              <LabCard
                lab={lab}
                progress={getLabProgress(lab.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && filteredLabs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No labs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}
    </Container>
  );
}
