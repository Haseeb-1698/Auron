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
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccessTime,
  EmojiEvents,
  PlayArrow,
  Lock,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Lab, LabDifficulty } from '../../types';

interface LabCardProps {
  lab: Lab;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

const DIFFICULTY_COLORS: Record<LabDifficulty, string> = {
  beginner: '#00ff88',
  intermediate: '#ffb020',
  advanced: '#ff5f56',
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
 * Modern LabCard Component
 * Features: Glassmorphism, neon borders, smooth animations, professional design
 */
export const LabCard: React.FC<LabCardProps> = ({
  lab,
  progress = 0,
  isLocked = false,
  isNew = false,
  isFeatured = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleStartLab = () => {
    if (!isLocked) {
      navigate(`/labs/${lab.id}`);
    }
  };

  const difficultyColor = DIFFICULTY_COLORS[lab.difficulty];
  const categoryLabel = CATEGORY_LABELS[lab.category] || lab.category;
  const isCompleted = progress === 100;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        border: `2px solid ${isCompleted ? '#00ff88' : alpha(difficultyColor, 0.3)}`,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
                theme.palette.background.default,
                0.9
              )} 100%)`
            : theme.palette.background.paper,
        backdropFilter: 'blur(10px)',
        opacity: isLocked ? 0.6 : 1,
        '&:hover': {
          transform: isLocked ? 'none' : 'translateY(-8px) scale(1.02)',
          boxShadow: isLocked
            ? theme.shadows[2]
            : `0 12px 40px ${alpha(difficultyColor, 0.3)}, 0 0 20px ${alpha(difficultyColor, 0.2)}`,
          border: `2px solid ${isLocked ? alpha(difficultyColor, 0.3) : difficultyColor}`,
        },
        '&::before': !isLocked && {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${difficultyColor}, ${alpha(difficultyColor, 0.5)})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::before': !isLocked && {
          opacity: 1,
        },
      }}
      onClick={handleStartLab}
    >
      {/* Status Badges */}
      {(isNew || isFeatured || isCompleted) && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            display: 'flex',
            gap: 0.5,
          }}
        >
          {isNew && (
            <Chip
              label="NEW"
              size="small"
              sx={{
                background: `linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)`,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 22,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                },
              }}
            />
          )}
          {isFeatured && (
            <Chip
              label="⭐ FEATURED"
              size="small"
              sx={{
                background: `linear-gradient(135deg, #ffb020 0%, #ff8c00 100%)`,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 22,
              }}
            />
          )}
          {isCompleted && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14, color: 'white !important' }} />}
              label="COMPLETED"
              size="small"
              sx={{
                background: `linear-gradient(135deg, #00ff88 0%, #00cc6d 100%)`,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 22,
              }}
            />
          )}
        </Box>
      )}

      {/* Lab Image with Overlay Gradient */}
      <CardMedia
        component="div"
        sx={{
          height: 220,
          position: 'relative',
          backgroundImage: lab.imageUrl
            ? `url(${lab.imageUrl})`
            : `linear-gradient(135deg, ${alpha(difficultyColor, 0.8)} 0%, ${alpha(
                difficultyColor,
                0.4
              )} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: `linear-gradient(to top, ${theme.palette.background.paper}, transparent)`,
          },
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
            zIndex: 2,
            background: difficultyColor,
            color: theme.palette.mode === 'dark' ? '#000' : '#fff',
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            boxShadow: `0 4px 12px ${alpha(difficultyColor, 0.4)}`,
            border: `2px solid ${theme.palette.mode === 'dark' ? '#000' : '#fff'}`,
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 3,
            }}
          >
            <Lock sx={{ fontSize: 56, color: '#fff', mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
              Complete previous labs to unlock
            </Typography>
          </Box>
        )}
      </CardMedia>

      {/* Lab Info */}
      <CardContent sx={{ flexGrow: 1, pb: 1, pt: 2 }}>
        {/* Category Badge */}
        <Chip
          label={categoryLabel}
          size="small"
          variant="outlined"
          sx={{
            mb: 1.5,
            fontSize: '0.7rem',
            fontWeight: 600,
            borderColor: alpha(theme.palette.primary.main, 0.5),
            color: theme.palette.primary.main,
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        />

        {/* Lab Name */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            lineHeight: 1.3,
            mb: 1,
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(90deg, ${theme.palette.text.primary} 0%, ${alpha(
                    theme.palette.primary.light,
                    0.9
                  )} 100%)`
                : theme.palette.text.primary,
            WebkitBackgroundClip: theme.palette.mode === 'dark' ? 'text' : 'initial',
            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'initial',
            backgroundClip: theme.palette.mode === 'dark' ? 'text' : 'initial',
          }}
        >
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
            lineHeight: 1.4,
          }}
        >
          {lab.description}
        </Typography>

        {/* Metadata with Icons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              background: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <AccessTime fontSize="small" sx={{ color: theme.palette.info.main }} />
            <Typography variant="caption" fontWeight={600} color="info.main">
              {lab.estimatedTime}min
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              background: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <EmojiEvents fontSize="small" sx={{ color: theme.palette.warning.main }} />
            <Typography variant="caption" fontWeight={600} color="warning.main">
              {lab.points} pts
            </Typography>
          </Box>
          {progress > 0 && progress < 100 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                background: alpha(theme.palette.success.main, 0.1),
              }}
            >
              <TrendingUp fontSize="small" sx={{ color: theme.palette.success.main }} />
              <Typography variant="caption" fontWeight={600} color="success.main">
                {progress}% done
              </Typography>
            </Box>
          )}
        </Box>

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {lab.tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 22,
                background: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                fontWeight: 600,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.15),
                },
              }}
            />
          ))}
          {lab.tags.length > 3 && (
            <Chip
              label={`+${lab.tags.length - 3}`}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 22,
                background: alpha(theme.palette.text.secondary, 0.1),
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Progress
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={700}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                background: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
          variant={progress > 0 && progress < 100 ? 'outlined' : 'contained'}
          startIcon={isLocked ? <Lock /> : isCompleted ? <CheckCircle /> : <PlayArrow />}
          disabled={isLocked}
          sx={{
            py: 1.2,
            fontSize: '0.95rem',
            fontWeight: 700,
            borderWidth: 2,
            background:
              !isLocked && (progress === 0 || isCompleted)
                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                : 'transparent',
            '&:hover': {
              borderWidth: 2,
              transform: isLocked ? 'none' : 'translateY(-2px)',
              boxShadow: isLocked
                ? 'none'
                : `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLocked
            ? 'Locked'
            : isCompleted
            ? 'Review Lab'
            : progress > 0
            ? 'Continue Lab'
            : 'Start Lab'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default LabCard;
