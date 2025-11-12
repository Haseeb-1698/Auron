import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  VideocamOutlined,
  ScreenShare,
  StopScreenShare,
  PersonAdd,
  ExitToApp,
  Close,
  Chat,
  People,
} from '@mui/icons-material';
import { ChatPanel } from './ChatPanel';
import type { CollaborationSession, Participant } from '../../types';

interface CollaborationPanelProps {
  session: CollaborationSession | null;
  currentUserId: string;
  onStartSession?: (labId: string) => void;
  onJoinSession?: (sessionId: string) => void;
  onLeaveSession?: () => void;
  onStartScreenShare?: () => void;
  onStopScreenShare?: () => void;
  onSendMessage?: (message: string) => void;
  onInviteUser?: (username: string) => void;
}

/**
 * CollaborationPanel Component
 * Manages collaboration sessions with chat and screen sharing
 */
export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  session,
  currentUserId,
  onStartSession,
  onJoinSession,
  onLeaveSession,
  onStartScreenShare,
  onStopScreenShare,
  onSendMessage,
  onInviteUser,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [usernameToInvite, setUsernameToInvite] = useState('');

  const isHost = session?.hostId === currentUserId;
  const isScreenSharing = session?.sharedScreen || false;

  const handleInviteUser = () => {
    if (usernameToInvite.trim() && onInviteUser) {
      onInviteUser(usernameToInvite);
      setUsernameToInvite('');
      setInviteDialogOpen(false);
    }
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing && onStopScreenShare) {
      onStopScreenShare();
    } else if (!isScreenSharing && onStartScreenShare) {
      onStartScreenShare();
    }
  };

  // If no session, show start/join options
  if (!session) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Collaboration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Work together with other users on this lab
        </Typography>
        {onStartSession && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => onStartSession('current-lab-id')}
            sx={{ mr: 1 }}
          >
            Start Session
          </Button>
        )}
        {onJoinSession && (
          <Button variant="outlined" disabled>
            Join Session
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {session.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Session ID: {session.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isHost && (
            <Tooltip title="Invite participant">
              <IconButton size="small" onClick={() => setInviteDialogOpen(true)}>
                <PersonAdd />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Leave session">
            <IconButton size="small" color="error" onClick={onLeaveSession}>
              <ExitToApp />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Controls Bar */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        <Tooltip title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}>
          <Button
            variant={isScreenSharing ? 'contained' : 'outlined'}
            size="small"
            startIcon={isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            onClick={handleToggleScreenShare}
            color={isScreenSharing ? 'error' : 'primary'}
          >
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </Button>
        </Tooltip>
        <Tooltip title="Video call (coming soon)">
          <span>
            <Button variant="outlined" size="small" startIcon={<VideocamOutlined />} disabled>
              Video Call
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Chat />} label="Chat" iconPosition="start" />
        <Tab icon={<People />} label={`Participants (${session.participants.length})`} iconPosition="start" />
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <Box sx={{ height: '100%' }}>
            <ChatPanel
              sessionId={session.id}
              currentUserId={currentUserId}
              participants={session.participants}
              onSendMessage={onSendMessage || (() => {})}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
            <List>
              {session.participants.map((participant: Participant) => (
                <ListItem
                  key={participant.userId}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: participant.isActive ? 'transparent' : 'grey.100',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>{participant.username[0].toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {participant.username}
                          {participant.userId === currentUserId && ' (You)'}
                        </Typography>
                        {participant.role === 'host' && (
                          <Chip label="Host" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Joined {new Date(participant.joinedAt).toLocaleString()}
                      </Typography>
                    }
                  />
                  <Chip
                    label={participant.isActive ? 'Online' : 'Offline'}
                    size="small"
                    color={participant.isActive ? 'success' : 'default'}
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Invite to Session</Typography>
            <IconButton size="small" onClick={() => setInviteDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username or Email"
            placeholder="Enter username to invite"
            value={usernameToInvite}
            onChange={(e) => setUsernameToInvite(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInviteUser}
            disabled={!usernameToInvite.trim()}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CollaborationPanel;
