import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid, useTheme, alpha } from '@mui/material';

/**
 * Professional Loading Skeleton Components
 * Provides smooth loading states instead of spinners
 */

// Lab Card Skeleton
export const LabCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        animation: 'pulse 1.5s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      }}
    >
      <Skeleton
        variant="rectangular"
        height={200}
        animation="wave"
        sx={{
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.primary.main,
            0.2
          )} 50%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
        }}
      />
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} animation="wave" />
        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} animation="wave" />
        <Skeleton variant="text" width="100%" height={20} sx={{ mt: 2 }} animation="wave" />
        <Skeleton variant="text" width="90%" height={20} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rounded" width={60} height={24} animation="wave" />
          <Skeleton variant="rounded" width={80} height={24} animation="wave" />
          <Skeleton variant="rounded" width={70} height={24} animation="wave" />
        </Box>
      </CardContent>
    </Card>
  );
};

// Lab Grid Skeleton
export const LabGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <LabCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

// Dashboard Widget Skeleton
export const DashboardWidgetSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="50%" height={28} animation="wave" />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 2 }} animation="wave" />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="text" width="30%" animation="wave" />
          <Skeleton variant="text" width="30%" animation="wave" />
        </Box>
      </CardContent>
    </Card>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={`${100 / columns}%`}
          height={24}
          animation="wave"
        />
      ))}
    </Box>
  );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={80} height={80} animation="wave" />
          <Box sx={{ ml: 3, flex: 1 }}>
            <Skeleton variant="text" width="40%" height={32} animation="wave" />
            <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} animation="wave" />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} animation="wave" />
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="text" width="30%" height={24} animation="wave" />
          <Skeleton variant="text" width="100%" height={48} sx={{ mt: 1 }} animation="wave" />
          <Skeleton variant="text" width="100%" height={48} sx={{ mt: 1 }} animation="wave" />
        </Box>
      </CardContent>
    </Card>
  );
};

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        p: 3,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.secondary.main,
            0.1
          )} 100%)`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} animation="wave" />
          <Skeleton variant="text" width="40%" height={48} sx={{ mt: 1 }} animation="wave" />
        </Box>
        <Skeleton variant="circular" width={48} height={48} animation="wave" />
      </Box>
      <Skeleton variant="text" width="50%" height={20} sx={{ mt: 2 }} animation="wave" />
    </Card>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC<{ avatar?: boolean }> = ({ avatar = true }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {avatar && <Skeleton variant="circular" width={40} height={40} animation="wave" />}
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="70%" height={20} animation="wave" />
        <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} animation="wave" />
      </Box>
      <Skeleton variant="rounded" width={80} height={32} animation="wave" />
    </Box>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={32} animation="wave" sx={{ mb: 3 }} />
        {Array.from({ length: fields }).map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Skeleton variant="text" width="30%" height={20} animation="wave" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} animation="wave" />
          </Box>
        ))}
        <Skeleton variant="rounded" width={120} height={42} animation="wave" sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
};

// Progress Bar Skeleton
export const ProgressSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width="40%" height={20} animation="wave" sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} animation="wave" />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Skeleton variant="text" width="20%" height={16} animation="wave" />
        <Skeleton variant="text" width="15%" height={16} animation="wave" />
      </Box>
    </Box>
  );
};

// Full Page Skeleton (combines multiple skeletons)
export const PageSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="30%" height={48} animation="wave" sx={{ mb: 3 }} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <StatsCardSkeleton />
          </Grid>
        ))}
      </Grid>
      <LabGridSkeleton count={6} />
    </Box>
  );
};

// Export all as a single object for convenience
export const LoadingSkeletons = {
  LabCard: LabCardSkeleton,
  LabGrid: LabGridSkeleton,
  DashboardWidget: DashboardWidgetSkeleton,
  TableRow: TableRowSkeleton,
  Profile: ProfileSkeleton,
  StatsCard: StatsCardSkeleton,
  ListItem: ListItemSkeleton,
  Form: FormSkeleton,
  Progress: ProgressSkeleton,
  Page: PageSkeleton,
};

export default LoadingSkeletons;
