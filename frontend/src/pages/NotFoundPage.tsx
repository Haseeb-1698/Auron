import React from 'react';
import { Box, Typography, Button, Container, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';

/**
 * Modern 404 Not Found Page
 * Features: Cybersecurity-themed, animated, professional design
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px),
            linear-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        },
        '@keyframes gridMove': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Animated 404 */}
          <Box
            sx={{
              mb: 4,
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.05em',
                animation: 'glitch 3s infinite',
                '@keyframes glitch': {
                  '0%, 100%': { transform: 'translate(0)' },
                  '20%': { transform: 'translate(-2px, 2px)' },
                  '40%': { transform: 'translate(-2px, -2px)' },
                  '60%': { transform: 'translate(2px, 2px)' },
                  '80%': { transform: 'translate(2px, -2px)' },
                },
              }}
            >
              404
            </Typography>

            {/* Lock Icon Overlay */}
            <SecurityIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '4rem',
                color: alpha(theme.palette.primary.main, 0.1),
                animation: 'rotate 20s linear infinite',
                '@keyframes rotate': {
                  '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                },
              }}
            />
          </Box>

          {/* Error Message */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 2,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(90deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`
                : theme.palette.text.primary,
              WebkitBackgroundClip: theme.palette.mode === 'dark' ? 'text' : 'initial',
              WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'initial',
            }}
          >
            Access Denied
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
            }}
          >
            The page you're looking for has been classified or doesn't exist in our database.
            Our security systems have logged this attempt.
          </Typography>

          {/* Terminal-style code block */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.5)
                : alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              backdropFilter: 'blur(10px)',
              fontFamily: 'monospace',
              textAlign: 'left',
              maxWidth: 600,
              mx: 'auto',
              boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography
              component="pre"
              sx={{
                color: theme.palette.mode === 'dark' ? '#00ff41' : theme.palette.success.main,
                fontSize: '0.9rem',
                m: 0,
                whiteSpace: 'pre-wrap',
                animation: 'typing 2s steps(40, end)',
                overflow: 'hidden',
                '@keyframes typing': {
                  '0%': { maxWidth: 0 },
                  '100%': { maxWidth: '100%' },
                },
              }}
            >
              {`$ security-scan --status 404
>> ERROR: Resource not found
>> Possible causes:
   - Incorrect URL path
   - Resource moved or deleted
   - Access permissions required
>> Recommendation: Return to dashboard`}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 6px 30px ${alpha(theme.palette.primary.main, 0.5)}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Go Back
            </Button>

            <Button
              variant="text"
              size="large"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/labs')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: alpha(theme.palette.primary.main, 0.05),
                },
                transition: 'all 0.3s ease',
              }}
            >
              Browse Labs
            </Button>
          </Box>

          {/* Additional Help Text */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 4,
              fontStyle: 'italic',
            }}
          >
            Need help? Check our{' '}
            <Typography
              component="span"
              sx={{
                color: theme.palette.primary.main,
                cursor: 'pointer',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={() => navigate('/help')}
            >
              documentation
            </Typography>
            {' '}or contact support.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
