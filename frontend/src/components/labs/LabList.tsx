import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabs } from '@features/labs/labsSlice';
import { LabCard } from './LabCard';
import type { Lab, LabCategory, LabDifficulty } from '../../types';
import type { RootState, AppDispatch } from '../../store';

/**
 * LabList Component
 * Displays all available labs with filtering and search functionality
 */
export const LabList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { labs, isLoading, error } = useSelector((state: RootState) => state.labs);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LabCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<LabDifficulty | 'all'>('all');

  useEffect(() => {
    dispatch(fetchLabs());
  }, [dispatch]);

  // Filter labs based on search and filters
  const filteredLabs = labs.filter((lab: Lab) => {
    const matchesSearch =
      searchQuery === '' ||
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || lab.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || lab.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Count labs by category
  const categoryCounts = labs.reduce((acc: Record<string, number>, lab: Lab) => {
    acc[lab.category] = (acc[lab.category] || 0) + 1;
    return acc;
  }, {});

  // Count labs by difficulty
  const difficultyCounts = labs.reduce((acc: Record<string, number>, lab: Lab) => {
    acc[lab.difficulty] = (acc[lab.difficulty] || 0) + 1;
    return acc;
  }, {});

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || categoryFilter !== 'all' || difficultyFilter !== 'all';

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Cybersecurity Labs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose from {labs.length} hands-on labs to improve your security skills
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search labs by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value as LabCategory | 'all')}
              >
                <MenuItem value="all">
                  All Categories ({labs.length})
                </MenuItem>
                <MenuItem value="web_security">
                  Web Security {categoryCounts.web_security && `(${categoryCounts.web_security})`}
                </MenuItem>
                <MenuItem value="network_security">
                  Network Security {categoryCounts.network_security && `(${categoryCounts.network_security})`}
                </MenuItem>
                <MenuItem value="cryptography">
                  Cryptography {categoryCounts.cryptography && `(${categoryCounts.cryptography})`}
                </MenuItem>
                <MenuItem value="exploitation">
                  Exploitation {categoryCounts.exploitation && `(${categoryCounts.exploitation})`}
                </MenuItem>
                <MenuItem value="defensive">
                  Defensive {categoryCounts.defensive && `(${categoryCounts.defensive})`}
                </MenuItem>
                <MenuItem value="forensics">
                  Forensics {categoryCounts.forensics && `(${categoryCounts.forensics})`}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Difficulty Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficultyFilter}
                label="Difficulty"
                onChange={(e) => setDifficultyFilter(e.target.value as LabDifficulty | 'all')}
              >
                <MenuItem value="all">All Levels ({labs.length})</MenuItem>
                <MenuItem value="beginner">
                  Beginner {difficultyCounts.beginner && `(${difficultyCounts.beginner})`}
                </MenuItem>
                <MenuItem value="intermediate">
                  Intermediate {difficultyCounts.intermediate && `(${difficultyCounts.intermediate})`}
                </MenuItem>
                <MenuItem value="advanced">
                  Advanced {difficultyCounts.advanced && `(${difficultyCounts.advanced})`}
                </MenuItem>
                <MenuItem value="expert">
                  Expert {difficultyCounts.expert && `(${difficultyCounts.expert})`}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterList fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                size="small"
                onDelete={() => setSearchQuery('')}
              />
            )}
            {categoryFilter !== 'all' && (
              <Chip
                label={`Category: ${categoryFilter}`}
                size="small"
                onDelete={() => setCategoryFilter('all')}
              />
            )}
            {difficultyFilter !== 'all' && (
              <Chip
                label={`Difficulty: ${difficultyFilter}`}
                size="small"
                onDelete={() => setDifficultyFilter('all')}
              />
            )}
            <Chip
              label="Clear all"
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
            />
          </Box>
        )}
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredLabs.length} {filteredLabs.length === 1 ? 'lab' : 'labs'}
      </Typography>

      {/* Labs Grid */}
      {filteredLabs.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No labs found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredLabs.map((lab: Lab) => (
            <Grid item xs={12} sm={6} md={4} key={lab.id}>
              <LabCard lab={lab} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LabList;
