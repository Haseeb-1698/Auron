import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  alpha,
  useTheme,
  Fade,
  Slide,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { logout } from '@features/auth/authSlice';

interface AppBarProps {
  drawerWidth: number;
  handleDrawerToggle: () => void;
}

/**
 * Modern AppBar Component
 * Features: Glassmorphism, scroll elevation, smooth animations
 */
export default function AppBar({ drawerWidth, handleDrawerToggle }: AppBarProps): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const handleProfile = (): void => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = (): void => {
    navigate('/settings');
    handleClose();
  };

  return (
    <Slide in direction="down" timeout={500}>
      <MuiAppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background:
            theme.palette.mode === 'dark'
              ? `${alpha(theme.palette.background.paper, scrolled ? 0.95 : 0.85)}`
              : `${alpha('#ffffff', scrolled ? 0.95 : 0.85)}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, scrolled ? 0.2 : 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: scrolled
            ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
            : 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'rotate(90deg)',
                background: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo and Title */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexGrow: 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'white',
                fontSize: '1.2rem',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                animation: 'pulse-glow 3s ease-in-out infinite',
                '@keyframes pulse-glow': {
                  '0%, 100%': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  '50%': {
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                },
              }}
            >
              A
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                background:
                  theme.palette.mode === 'dark'
                    ? `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`
                    : theme.palette.text.primary,
                WebkitBackgroundClip: theme.palette.mode === 'dark' ? 'text' : 'initial',
                WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'initial',
                backgroundClip: theme.palette.mode === 'dark' ? 'text' : 'initial',
              }}
            >
              Auron Security
            </Typography>
          </Box>

          {/* Action Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton
              color="inherit"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* User Menu */}
            <IconButton
              color="inherit"
              onClick={handleMenu}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.1)',
                },
              }}
            >
              {user?.avatar ? (
                <Avatar
                  src={user.avatar}
                  alt={user.username}
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.palette.primary.main}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                  }}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              TransitionComponent={Fade}
              sx={{
                '& .MuiPaper-root': {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.95)
                      : alpha('#ffffff', 0.95),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
                },
              }}
            >
              <MenuItem
                onClick={handleProfile}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <AccountCircleIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Profile
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View your profile
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem
                onClick={handleSettings}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.info.main, 0.1),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <SettingsIcon sx={{ mr: 1.5, color: theme.palette.info.main }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Settings
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage preferences
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  mt: 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.error.main, 0.1),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <LogoutIcon sx={{ mr: 1.5, color: theme.palette.error.main }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Logout
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sign out of your account
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </MuiAppBar>
    </Slide>
  );
}
