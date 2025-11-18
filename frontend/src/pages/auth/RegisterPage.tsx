import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  alpha,
  useTheme,
  Fade,
  Zoom,
  InputAdornment,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Person,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { register as registerUser } from '@features/auth/authSlice';
import { VALIDATION } from '@config/constants';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(VALIDATION.USERNAME_MIN_LENGTH, `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`)
      .max(VALIDATION.USERNAME_MAX_LENGTH, `Username must be at most ${VALIDATION.USERNAME_MAX_LENGTH} characters`)
      .regex(VALIDATION.USERNAME_REGEX, 'Username can only contain letters, numbers, _ and -'),
    password: z
      .string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Modern Register Page
 * Features: Glassmorphism, animated background, smooth transitions, password strength indicator
 */
export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    const { confirmPassword, ...registerData } = data;
    await dispatch(registerUser(registerData));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return theme.palette.error.main;
    if (passwordStrength < 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
                theme.palette.secondary.dark,
                0.3
              )} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.1)} 0%, ${alpha(
                theme.palette.primary.light,
                0.1
              )} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 70%)`,
          animation: 'float 20s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          animation: 'float 25s ease-in-out infinite reverse',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -20px) scale(1.1)' },
        },
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Zoom in timeout={600}>
          <Box>
            {/* Logo and Branding */}
            <Fade in timeout={800}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                    mb: 2,
                    animation: 'pulse-glow 3s ease-in-out infinite',
                    '@keyframes pulse-glow': {
                      '0%, 100%': {
                        boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                        transform: 'scale(1)',
                      },
                      '50%': {
                        boxShadow: `0 8px 48px ${alpha(theme.palette.secondary.main, 0.6)}`,
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <Security sx={{ fontSize: 48, color: 'white' }} />
                </Box>
                <Typography
                  variant="h3"
                  fontWeight="800"
                  gutterBottom
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Auron Security
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  Join Our Cybersecurity Community
                </Typography>
              </Box>
            </Fade>

            {/* Register Form Card */}
            <Fade in timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  borderRadius: 4,
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha('#ffffff', 0.9),
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 12px 48px ${alpha(theme.palette.secondary.main, 0.15)}`,
                  },
                }}
              >
                <Typography
                  component="h1"
                  variant="h4"
                  align="center"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mb: 1 }}
                >
                  Create Account
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
                  Start your journey to becoming a security expert
                </Typography>

                {error && (
                  <Fade in>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        animation: 'shake 0.5s ease',
                        '@keyframes shake': {
                          '0%, 100%': { transform: 'translateX(0)' },
                          '25%': { transform: 'translateX(-10px)' },
                          '75%': { transform: 'translateX(10px)' },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Email Address"
                    autoComplete="email"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="secondary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                        },
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    fullWidth
                    label="Username"
                    autoComplete="username"
                    {...register('username')}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="secondary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                        },
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="secondary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                        },
                      },
                    }}
                  />

                  {/* Password Strength Indicator */}
                  {password && (
                    <Fade in>
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Password Strength
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color={getPasswordStrengthColor()}>
                            {getPasswordStrengthLabel()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={passwordStrength}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(getPasswordStrengthColor(), 0.15),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getPasswordStrengthColor(),
                              transition: 'all 0.5s ease',
                            },
                          }}
                        />
                      </Box>
                    </Fade>
                  )}

                  <TextField
                    margin="normal"
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CheckCircle color="secondary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                        },
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                    sx={{
                      mt: 4,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.5)}`,
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Already have an account?{' '}
                    </Typography>
                    <Link
                      component={RouterLink}
                      to="/login"
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        textDecoration: 'none',
                        color: theme.palette.secondary.main,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: theme.palette.secondary.dark,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Sign In
                    </Link>
                  </Box>
                </Box>
              </Paper>
            </Fade>

            {/* Footer */}
            <Fade in timeout={1200}>
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  &copy; 2025 Auron Security Platform. All rights reserved.
                </Typography>
              </Box>
            </Fade>
          </Box>
        </Zoom>
      </Container>
    </Box>
  );
}
