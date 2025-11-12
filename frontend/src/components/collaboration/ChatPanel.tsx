import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  AttachFile,
  Close,
} from '@mui/icons-material';
import type { Participant } from '../../types';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface ChatPanelProps {
  sessionId: string;
  currentUserId: string;
  participants: Participant[];
  onSendMessage: (message: string) => void;
  onClose?: () => void;
  messages?: ChatMessage[];
}

/**
 * ChatPanel Component
 * Real-time chat interface for collaboration sessions
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  sessionId: _sessionId,
  currentUserId,
  participants,
  onSendMessage,
  onClose,
  messages = [],
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, _setIsTyping] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getParticipantById = (userId: string) => {
    return participants.find((p) => p.userId === userId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const activeParticipants = participants.filter((p) => p.isActive);
  const typingUsers = Object.entries(isTyping)
    .filter(([_, typing]) => typing)
    .map(([userId]) => getParticipantById(userId)?.username)
    .filter(Boolean);

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
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
            Collaboration Chat
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeParticipants.length} participant{activeParticipants.length !== 1 ? 's' : ''} online
          </Typography>
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Participants List */}
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {activeParticipants.map((participant) => (
            <Chip
              key={participant.userId}
              avatar={<Avatar sx={{ width: 24, height: 24 }}>{participant.username[0]}</Avatar>}
              label={participant.username}
              size="small"
              color={participant.userId === currentUserId ? 'primary' : 'default'}
              variant={participant.role === 'host' ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">No messages yet. Start the conversation!</Typography>
          </Box>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.userId === currentUserId;
          const isSystemMessage = message.type === 'system';

          if (isSystemMessage) {
            return (
              <Box key={message.id} sx={{ textAlign: 'center', my: 1 }}>
                <Chip
                  label={message.content}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>
            );
          }

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                gap: 1,
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              {!isOwnMessage && (
                <Avatar sx={{ width: 32, height: 32 }}>
                  {message.username[0].toUpperCase()}
                </Avatar>
              )}

              {/* Message Bubble */}
              <Box sx={{ maxWidth: '75%' }}>
                {!isOwnMessage && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1, display: 'block', mb: 0.5 }}
                  >
                    {message.username}
                  </Typography>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: isOwnMessage ? 'primary.main' : 'white',
                    color: isOwnMessage ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      textAlign: 'right',
                      fontSize: '0.65rem',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24 }} />
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2, backgroundColor: 'white' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={3}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" disabled>
                  <EmojiEmotions fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled>
                  <AttachFile fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};

export default ChatPanel;
