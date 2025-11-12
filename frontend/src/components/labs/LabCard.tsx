import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  AccessTime,
  EmojiEvents,
  PlayArrow,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Lab, LabDifficulty } from '../../types';

interface LabCardProps {
  lab: Lab;
  progress?: number;
  isLocked?: boolean;
}

const DIFFICULTY_COLORS: Record<LabDifficulty, string> = {
  beginner: '#4caf50',
  intermediate: '#ff9800',
  advanced: '#f44336',
  expert: '#9c27b0',
};

const CATEGORY_LABELS: Record<string, string> = {
  web_security: 'Web Security',
  network_security: 'Network Security',
  cryptography: 'Cryptography',
  exploitation: 'Exploitation',
  defensive: 'Defensive Security',
  forensics: 'Digital Forensics',
};

/**
 * LabCard Component
 * Displays individual lab information with progress and actions
 */
export const LabCard: React.FC<LabCardProps> = ({ lab, progress = 0, isLocked = false }) => {
  const navigate = useNavigate();

  const handleStartLab = () => {
    navigate(`/labs/${lab.id}`);
  };

  const difficultyColor = DIFFICULTY_COLORS[lab.difficulty];
  const categoryLabel = CATEGORY_LABELS[lab.category] || lab.category;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: isLocked ? 'none' : 'translateY(-4px)',
          boxShadow: isLocked ? 1 : 8,
        },
        opacity: isLocked ? 0.7 : 1,
      }}
    >
      {/* Lab Image */}
      <CardMedia
        component="div"
        sx={{
          height: 200,
          backgroundColor: 'grey.300',
          backgroundImage: lab.imageUrl
            ? `url(${lab.imageUrl})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Difficulty Badge */}
        <Chip
          label={lab.difficulty.toUpperCase()}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: difficultyColor,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
          }}
        />

        {/* Lock Overlay */}
        {isLocked && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            <Lock sx={{ fontSize: 48, color: 'white' }} />
          </Box>
        )}
      </CardMedia>

      {/* Lab Info */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Category */}
        <Chip
          label={categoryLabel}
          size="small"
          variant="outlined"
          sx={{ mb: 1, fontSize: '0.7rem' }}
        />

        {/* Lab Name */}
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {lab.name}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.8em',
          }}
        >
          {lab.description}
        </Typography>

        {/* Metadata */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {lab.estimatedTime}min
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmojiEvents fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {lab.points} pts
            </Typography>
          </Box>
        </Box>

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {lab.tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          ))}
          {lab.tags.length > 3 && (
            <Chip
              label={`+${lab.tags.length - 3}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
        </Box>

        {/* Progress Bar */}
        {progress > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
                },
              }}
            />
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={progress > 0 ? 'outlined' : 'contained'}
          startIcon={isLocked ? <Lock /> : <PlayArrow />}
          onClick={handleStartLab}
          disabled={isLocked}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {isLocked
            ? 'Locked'
            : progress === 100
            ? 'Review Lab'
            : progress > 0
            ? 'Continue'
            : 'Start Lab'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default LabCard;
