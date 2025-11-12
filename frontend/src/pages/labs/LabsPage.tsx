import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Chip, Button, Box } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { fetchLabs } from '@features/labs/labsSlice';
import { DIFFICULTY_COLORS } from '@config/constants';
import type { Lab } from '../../types';

export default function LabsPage(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { labs, isLoading } = useAppSelector((state) => state.labs);

  useEffect(() => {
    dispatch(fetchLabs());
  }, [dispatch]);

  if (isLoading) {
    return <Typography>Loading labs...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Available Labs
      </Typography>
      <Grid container spacing={3}>
        {labs.map((lab: Lab) => (
          <Grid item xs={12} sm={6} md={4} key={lab.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {lab.name}
                </Typography>
                <Chip
                  label={lab.difficulty}
                  size="small"
                  sx={{
                    backgroundColor: DIFFICULTY_COLORS[lab.difficulty as keyof typeof DIFFICULTY_COLORS],
                    color: 'white',
                    mb: 2,
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {lab.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/labs/${lab.id}`)}
                >
                  Start Lab
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
