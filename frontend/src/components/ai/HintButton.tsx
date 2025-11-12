import React, { useState } from 'react';
import {
  Button,
  Tooltip,
  Badge,
  Box,
  Typography,
} from '@mui/material';
import { Lightbulb, Stars } from '@mui/icons-material';
import { HintModal } from './HintModal';

interface HintButtonProps {
  labId: string;
  exerciseId: string;
  hintsUsed?: number;
  totalHints?: number;
  userPoints?: number;
  hintCost?: number;
  disabled?: boolean;
}

/**
 * HintButton Component
 * Button to request AI-powered hints with points cost display
 */
export const HintButton: React.FC<HintButtonProps> = ({
  labId,
  exerciseId,
  hintsUsed = 0,
  totalHints = 3,
  userPoints = 0,
  hintCost = 10,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const remainingHints = totalHints - hintsUsed;
  const canAffordHint = userPoints >= hintCost;
  const hasHintsLeft = remainingHints > 0;
  const isDisabled = disabled || !hasHintsLeft || !canAffordHint;

  const getTooltipText = () => {
    if (!hasHintsLeft) return 'No hints remaining for this exercise';
    if (!canAffordHint) return `Not enough points. Need ${hintCost} points`;
    return `Request AI hint (costs ${hintCost} points)`;
  };

  return (
    <>
      <Tooltip title={getTooltipText()} arrow>
        <span>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Lightbulb />}
            onClick={() => setModalOpen(true)}
            disabled={isDisabled}
            sx={{
              textTransform: 'none',
              borderColor: hasHintsLeft ? 'warning.main' : 'grey.400',
              color: hasHintsLeft ? 'warning.main' : 'text.disabled',
              '&:hover': {
                borderColor: hasHintsLeft ? 'warning.dark' : 'grey.400',
                backgroundColor: hasHintsLeft ? 'warning.50' : 'transparent',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="button">Get Hint</Typography>
              <Badge
                badgeContent={remainingHints}
                color="warning"
                max={9}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <Stars fontSize="small" />
              </Badge>
              <Typography
                variant="caption"
                sx={{
                  ml: 0.5,
                  color: canAffordHint ? 'text.secondary' : 'error.main',
                  fontWeight: canAffordHint ? 'normal' : 'bold',
                }}
              >
                -{hintCost} pts
              </Typography>
            </Box>
          </Button>
        </span>
      </Tooltip>

      <HintModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        labId={labId}
        exerciseId={exerciseId}
        hintCost={hintCost}
        userPoints={userPoints}
      />
    </>
  );
};

export default HintButton;
