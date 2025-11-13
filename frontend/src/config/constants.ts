/**
 * Application Constants
 * Centralized configuration values
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Auron Security Platform';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    ME: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    ENABLE_2FA: '/auth/2fa/enable',
    VERIFY_2FA: '/auth/2fa/verify',
    DISABLE_2FA: '/auth/2fa/disable',
  },
  LABS: {
    LIST: '/labs',
    DETAIL: (id: string): string => `/labs/${id}`,
    START: (id: string): string => `/labs/${id}/start`,
    // Instance management endpoints
    STOP_INSTANCE: (instanceId: string): string => `/labs/instances/${instanceId}/stop`,
    RESTART_INSTANCE: (instanceId: string): string => `/labs/instances/${instanceId}/restart`,
    RESET_INSTANCE: (instanceId: string): string => `/labs/instances/${instanceId}/reset`,
    GET_INSTANCE: (instanceId: string): string => `/labs/instances/${instanceId}`,
    USER_INSTANCES: '/labs/instances/user',
    SUBMIT: (labId: string, exerciseId: string): string =>
      `/labs/${labId}/exercises/${exerciseId}/submit`,
  },
  PROGRESS: {
    USER: '/progress',
    LAB: (labId: string): string => `/progress/lab/${labId}`,
    STATS: '/progress/stats',
    LEADERBOARD: '/progress/leaderboard',
  },
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    DETAIL: (id: string): string => `/reports/${id}`,
    UPDATE: (id: string): string => `/reports/${id}`,
    DELETE: (id: string): string => `/reports/${id}`,
  },
  AI: {
    GET_HINT: '/ai/hint',
    EXPLAIN_VULNERABILITY: '/ai/explain',
    ANALYZE_CODE: '/ai/analyze-code',
    LEARNING_PATH: '/ai/learning-path',
  },
  COLLABORATION: {
    SESSIONS: '/collaboration/sessions',
    CREATE: '/collaboration/create',
    JOIN: (sessionId: string): string => `/collaboration/${sessionId}/join`,
    LEAVE: (sessionId: string): string => `/collaboration/${sessionId}/leave`,
  },
  GAMIFICATION: {
    USER_BADGES: '/gamification/user-badges',
    ALL_BADGES: '/gamification/badges',
    AWARD_BADGE: (badgeId: string): string => `/gamification/badges/${badgeId}/award`,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme_preference',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Time Limits (milliseconds)
export const LAB_DEFAULT_TIMEOUT = 3600000; // 1 hour
export const LAB_MAX_TIMEOUT = 14400000; // 4 hours
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Severity Colors
export const SEVERITY_COLORS = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
  info: '#1976d2',
} as const;

// Lab Difficulty Colors
export const DIFFICULTY_COLORS = {
  beginner: '#4caf50',
  intermediate: '#ff9800',
  advanced: '#f44336',
  expert: '#9c27b0',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  MESSAGE: 'message',
  LAB_STATUS: 'lab:status',
  PROGRESS_UPDATE: 'progress:update',
  COLLABORATION_INVITE: 'collaboration:invite',
  CHAT_MESSAGE: 'chat:message',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
} as const;

// Achievement Thresholds
export const ACHIEVEMENTS = {
  FIRST_LAB: 1,
  TEN_LABS: 10,
  FIFTY_LABS: 50,
  HUNDRED_LABS: 100,
  FIRST_REPORT: 1,
  PERFECT_SCORE: 100,
  SPEED_DEMON: 300000, // 5 minutes
} as const;

// Points System
export const POINTS = {
  LAB_COMPLETION: 100,
  EXERCISE_COMPLETION: 20,
  PERFECT_SCORE_BONUS: 50,
  SPEED_BONUS: 25,
  NO_HINTS_BONUS: 30,
  REPORT_SUBMISSION: 10,
} as const;
