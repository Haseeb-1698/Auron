import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close,
  Send,
  Lightbulb,
  Psychology,
  Person,
  ContentCopy,
  Check,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getHint, clearHint } from '@features/ai/aiSlice';
import type { RootState, AppDispatch } from '../../store';

interface HintModalProps {
  open: boolean;
  onClose: () => void;
  labId: string;
  exerciseId: string;
  hintCost: number;
  userPoints: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * HintModal Component
 * Modal dialog for AI-powered hint conversation
 */
export const HintModal: React.FC<HintModalProps> = ({
  open,
  onClose,
  labId,
  exerciseId,
  hintCost,
  userPoints,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentHint, isLoading, error } = useSelector((state: RootState) => state.ai);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentHint) {
      const assistantMessage: Message = {
        id: `hint-${Date.now()}`,
        role: 'assistant',
        content: typeof currentHint === 'string' ? currentHint : currentHint.hint || currentHint.content || 'No hint available',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      dispatch(clearHint());
    }
  }, [currentHint, dispatch]);

  const handleRequestHint = async () => {
    if (userPoints < hintCost) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput || 'Can you give me a hint for this exercise?',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');

    try {
      await dispatch(
        getHint({
          labId,
          exerciseId,
          context: userInput || 'Need help with this exercise',
          currentProgress: '',
          previousHints: messages.filter(m => m.role === 'assistant').map(m => m.content),
          userCode: '',
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to get hint:', err);
    }
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setUserInput('');
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '800px' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology color="primary" />
          <Typography variant="h6" fontWeight="bold">
            AI Assistant
          </Typography>
          <Chip
            label={`${hintCost} pts per hint`}
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
        <IconButton edge="end" onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            backgroundColor: 'grey.50',
          }}
        >
          {messages.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Lightbulb sx={{ fontSize: 64, mb: 2, color: 'warning.main' }} />
              <Typography variant="h6" gutterBottom>
                Need a Hint?
              </Typography>
              <Typography variant="body2">
                Ask the AI assistant for help with this exercise.
                <br />
                Each hint costs {hintCost} points.
              </Typography>
            </Box>
          )}

          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '80%',
                  p: 2,
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                {/* Message Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {message.role === 'assistant' ? (
                    <Psychology fontSize="small" color="primary" />
                  ) : (
                    <Person fontSize="small" sx={{ color: 'inherit' }} />
                  )}
                  <Typography variant="caption" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.7, color: 'inherit' }}>
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>

                {/* Message Content */}
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'inherit',
                  }}
                >
                  {message.content}
                </Typography>

                {/* Copy Button */}
                {message.role === 'assistant' && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyMessage(message)}
                      sx={{ color: 'text.secondary' }}
                    >
                      {copiedMessageId === message.id ? (
                        <Check fontSize="small" />
                      ) : (
                        <ContentCopy fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Psychology fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                AI is thinking...
              </Typography>
              <CircularProgress size={16} />
            </Box>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 2, backgroundColor: 'white' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>Current Points:</strong> {userPoints} |{' '}
              <strong>Cost per Hint:</strong> {hintCost} points
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask for a specific hint or press send for a general hint..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRequestHint();
                }
              }}
              multiline
              maxRows={3}
              disabled={isLoading || userPoints < hintCost}
            />
            <Button
              variant="contained"
              onClick={handleRequestHint}
              disabled={isLoading || userPoints < hintCost}
              endIcon={isLoading ? <CircularProgress size={16} /> : <Send />}
              sx={{ minWidth: 100 }}
            >
              Send
            </Button>
          </Box>

          {userPoints < hintCost && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Not enough points to request a hint. Complete exercises to earn more points.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HintModal;
