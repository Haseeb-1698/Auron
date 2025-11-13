import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import type { CollaborationSession } from '../types';
import { CollaborationPanel } from '@components/collaboration/CollaborationPanel';
import {
  fetchSessions,
  createSession,
  joinSession,
  leaveSession,
} from '@features/collaboration/collaborationSlice';

export default function CollaborationPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, currentSession, isLoading, error } = useSelector(
    (state: RootState) => state.collaboration
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [labId, setLabId] = useState('');

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleCreateSession = async () => {
    if (sessionName.trim()) {
      await dispatch(
        createSession({
          name: sessionName,
          labId: labId || undefined,
        })
      );
      setOpenCreateDialog(false);
      setSessionName('');
      setLabId('');
    }
  };

  const handleJoinSession = (sessionId: string) => {
    dispatch(joinSession(sessionId));
  };

  const handleLeaveSession = () => {
    if (currentSession) {
      dispatch(leaveSession(currentSession.id));
    }
  };

  const activeSessions = sessions.filter((s: CollaborationSession) => s.status === 'active');
  const mySessions = sessions.filter((s: CollaborationSession) => s.hostId === user?.id);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Collaboration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          disabled={isLoading}
        >
          Create Session
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {currentSession ? (
        /* Active Collaboration Session */
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {currentSession.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentSession.participants.length} participant(s)
                  </Typography>
                </Box>
                <Button variant="outlined" color="error" onClick={handleLeaveSession}>
                  Leave Session
                </Button>
              </Box>
            </CardContent>
          </Card>

          <CollaborationPanel
            session={currentSession}
            currentUserId={user?.id || ''}
            onStartSession={() => {}}
            onLeaveSession={handleLeaveSession}
          />
        </Box>
      ) : (
        /* Session Browser */
        <Grid container spacing={3}>
          {/* Active Sessions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VideoCallIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Active Sessions ({activeSessions.length})
                  </Typography>
                </Box>

                {activeSessions.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No active sessions available
                  </Typography>
                ) : (
                  <List>
                    {activeSessions.map((session: CollaborationSession) => (
                      <ListItem
                        key={session.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <ListItemIcon>
                          <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {session.name}
                              </Typography>
                              <Chip
                                label={`${session.participants.length} ${
                                  session.participants.length === 1 ? 'user' : 'users'
                                }`}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={
                            session.labId ? `Lab: ${session.labId}` : 'General collaboration'
                          }
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleJoinSession(session.id)}
                        >
                          Join
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* My Sessions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    My Sessions ({mySessions.length})
                  </Typography>
                </Box>

                {mySessions.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    You haven't created any sessions yet
                  </Typography>
                ) : (
                  <List>
                    {mySessions.map((session: CollaborationSession) => (
                      <ListItem
                        key={session.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <ListItemIcon>
                          <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {session.name}
                              </Typography>
                              <Chip
                                label={session.status}
                                size="small"
                                color={session.status === 'active' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={`${session.participants.length} participants`}
                        />
                        {session.status === 'active' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleJoinSession(session.id)}
                          >
                            Rejoin
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Info Cards */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  About Collaboration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Collaboration sessions allow you to work together with other users in real-time.
                  You can:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Real-time Chat"
                      secondary="Communicate with team members instantly"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Screen Sharing"
                      secondary="Share your lab environment with others"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Participant Management"
                      secondary="Invite users and manage session permissions"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create Session Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Collaboration Session</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              required
            />
            <TextField
              fullWidth
              label="Lab ID (Optional)"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              placeholder="Link to a specific lab"
              helperText="Leave empty for general collaboration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!sessionName.trim() || isLoading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
