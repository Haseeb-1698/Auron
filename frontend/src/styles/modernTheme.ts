import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Modern Cybersecurity-Themed Design System for Auron
 * Features: Terminal aesthetics, neon accents, glassmorphism, professional polish
 */

// Custom color palette - Cybersecurity themed
const colors = {
  // Primary - Electric Blue (cybersecurity brand color)
  electric: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Main
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },

  // Terminal Green (hacker aesthetic)
  terminal: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#00ff41', // Bright terminal green
    600: '#00e676',
    700: '#00c853',
    800: '#00b248',
    900: '#00962d',
  },

  // Neon Purple (accent)
  neon: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
  },

  // Cyber Dark (backgrounds)
  cyber: {
    900: '#0a0e27', // Darkest
    800: '#0f172a',
    700: '#1e293b',
    600: '#334155',
    500: '#475569',
    400: '#64748b',
    300: '#94a3b8',
    200: '#cbd5e1',
    100: '#e2e8f0',
    50: '#f8fafc',
  },

  // Status colors
  danger: '#ff3864',
  warning: '#ffb020',
  success: '#00ff88',
  info: '#00d4ff',
};

// Light Theme Options
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: colors.electric[600],
      light: colors.electric[400],
      dark: colors.electric[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.terminal[500],
      light: colors.terminal[400],
      dark: colors.terminal[700],
      contrastText: '#000000',
    },
    error: {
      main: colors.danger,
      light: '#ff6b8a',
      dark: '#cc2d50',
    },
    warning: {
      main: colors.warning,
      light: '#ffc14d',
      dark: '#cc8d1a',
    },
    info: {
      main: colors.info,
      light: '#33ddff',
      dark: '#00aacc',
    },
    success: {
      main: colors.success,
      light: '#33ffa0',
      dark: '#00cc6d',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: colors.cyber[900],
      secondary: colors.cyber[600],
      disabled: colors.cyber[400],
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    fontFamilyMonospace: [
      '"Fira Code"',
      '"JetBrains Mono"',
      'Monaco',
      'Consolas',
      '"Courier New"',
      'monospace',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.75,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      lineHeight: 2,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.25)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(33, 150, 243, 0.35)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.electric[600]} 0%, ${colors.electric[700]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.electric[700]} 0%, ${colors.electric[800]} 100%)`,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
};

// Dark Theme Options
const darkThemeOptions: ThemeOptions = {
  ...lightThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.electric[400],
      light: colors.electric[300],
      dark: colors.electric[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.terminal[500],
      light: colors.terminal[400],
      dark: colors.terminal[600],
      contrastText: '#000000',
    },
    error: {
      main: colors.danger,
      light: '#ff6b8a',
      dark: '#cc2d50',
    },
    warning: {
      main: colors.warning,
      light: '#ffc14d',
      dark: '#cc8d1a',
    },
    info: {
      main: colors.info,
      light: '#33ddff',
      dark: '#00aacc',
    },
    success: {
      main: colors.success,
      light: '#33ffa0',
      dark: '#00cc6d',
    },
    background: {
      default: colors.cyber[900],
      paper: colors.cyber[800],
    },
    text: {
      primary: '#ffffff',
      secondary: colors.cyber[300],
      disabled: colors.cyber[500],
    },
  },
  components: {
    ...lightThemeOptions.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(10, 14, 39, 0.8)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          background: `linear-gradient(135deg, ${colors.cyber[800]} 0%, ${colors.cyber[700]} 100%)`,
          border: `1px solid ${colors.cyber[600]}`,
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-4px)',
            border: `1px solid ${colors.electric[700]}`,
          },
        },
      },
    },
  },
};

// Export themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Export color palette for direct use
export { colors };

// Utility: Glassmorphism effect
export const glassmorphism = (opacity: number = 0.8) => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
});

// Utility: Glassmorphism dark
export const glassmorphismDark = (opacity: number = 0.8) => ({
  background: `rgba(10, 14, 39, ${opacity})`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
});

// Utility: Gradient text
export const gradientText = (color1: string = colors.electric[400], color2: string = colors.terminal[500]) => ({
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

// Utility: Neon glow
export const neonGlow = (color: string = colors.terminal[500]) => ({
  boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
});
