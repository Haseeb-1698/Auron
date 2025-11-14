import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState, AppDispatch } from '../store';
import { updateProfile, changePassword, enable2FA, disable2FA, verify2FA } from '@features/auth/authSlice';
import { fetchUserProgress, fetchUserStats, fetchUserBadges } from '@features/progress/progressSlice';

export default function ProfilePage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { stats, badges } = useSelector((state: RootState) => state.progress);

  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
  });

  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserProgress(user.id));
      dispatch(fetchUserStats());
      dispatch(fetchUserBadges(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      setEditedProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(editedProfile)).unwrap();
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditedProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
    setEditMode(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();
      toast.success('Password changed successfully!');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
      console.error('Failed to change password:', error);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await dispatch(enable2FA()).unwrap();
      setQrCodeUrl(result.qrCodeUrl);
      setTwoFactorDialog(true);
    } catch (error) {
      toast.error('Failed to enable 2FA');
      console.error('Failed to enable 2FA:', error);
    }
  };

  const handleVerify2FA = async () => {
    try {
      await dispatch(verify2FA(twoFactorCode)).unwrap();
      toast.success('2FA enabled successfully!');
      setTwoFactorDialog(false);
      setTwoFactorCode('');
    } catch (error) {
      toast.error('Invalid 2FA code');
      console.error('Failed to verify 2FA:', error);
    }
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
      try {
        await dispatch(disable2FA()).unwrap();
        toast.success('2FA disabled successfully!');
      } catch (error) {
        toast.error('Failed to disable 2FA');
        console.error('Failed to disable 2FA:', error);
      }
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={8}>
          {/* Profile Information */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Profile Information
              </Typography>
              {!editMode ? (
                <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                  <Button startIcon={<CancelIcon />} variant="outlined" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                  mr: 3,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{user.username}</Typography>
                <Chip label={user.role} size="small" color="primary" />
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editedProfile.firstName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editedProfile.lastName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={editedProfile.username}
                  disabled
                  helperText="Username cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editedProfile.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Security Settings */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Security Settings
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Password"
                  secondary="Last changed recently"
                />
                <Button variant="outlined" onClick={() => setPasswordDialog(true)}>
                  Change Password
                </Button>
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  {user.twoFactorEnabled ? <CheckIcon color="success" /> : <SecurityIcon />}
                </ListItemIcon>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary={
                    user.twoFactorEnabled
                      ? 'Enabled - Your account is secured'
                      : 'Disabled - Enable for better security'
                  }
                />
                {user.twoFactorEnabled ? (
                  <Button variant="outlined" color="error" onClick={handleDisable2FA}>
                    Disable
                  </Button>
                ) : (
                  <Button variant="contained" color="success" onClick={handleEnable2FA}>
                    Enable
                  </Button>
                )}
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right Column - Stats & Badges */}
        <Grid item xs={12} md={4}>
          {/* Stats Card */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Your Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Labs Completed
                    </Typography>
                    <Typography variant="h6">{(stats as any)?.labsCompleted || 0}</Typography>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrophyIcon color="warning" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Points
                    </Typography>
                    <Typography variant="h6">{(stats as any)?.totalPoints || 0}</Typography>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="action" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                    <Typography variant="h6">
                      {Math.floor(((stats as any)?.totalTimeSpent || 0) / 3600)}h
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Achievements
              </Typography>
              {badges && Array.isArray(badges) && badges.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {badges.slice(0, 6).map((badge: any) => (
                    <Chip
                      key={badge.id}
                      icon={<TrophyIcon />}
                      label={badge.name}
                      color="warning"
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Complete labs to earn badges!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              helperText="At least 8 characters"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFactorDialog} onClose={() => setTwoFactorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </Typography>
            {qrCodeUrl && (
              <Box
                component="img"
                src={qrCodeUrl}
                alt="QR Code"
                sx={{ width: 200, height: 200, border: '1px solid', borderColor: 'divider' }}
              />
            )}
            <TextField
              fullWidth
              label="Verification Code"
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFactorDialog(false)}>Cancel</Button>
          <Button onClick={handleVerify2FA} variant="contained" disabled={twoFactorCode.length !== 6}>
            Verify & Enable
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
