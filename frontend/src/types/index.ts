/**
 * Core Type Definitions
 * Shared types used throughout the frontend application
 */

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

// Authentication Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Lab Types
export interface Lab {
  id: string;
  name: string;
  description: string;
  category: LabCategory;
  difficulty: LabDifficulty;
  estimatedTime: number;
  points: number;
  tags: string[];
  imageUrl?: string;
  containerConfig: ContainerConfig;
  exercises: Exercise[];
  prerequisites: string[];
  learningObjectives: string[];
  isActive: boolean;
}

export enum LabCategory {
  WEB_SECURITY = 'web_security',
  NETWORK_SECURITY = 'network_security',
  CRYPTOGRAPHY = 'cryptography',
  EXPLOITATION = 'exploitation',
  DEFENSIVE = 'defensive',
  FORENSICS = 'forensics',
}

export enum LabDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface ContainerConfig {
  image: string;
  ports: PortMapping[];
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  memoryLimit?: string;
  cpuLimit?: string;
}

export interface PortMapping {
  container: number;
  host?: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  hints: Hint[];
  solution?: string;
  points: number;
  order: number;
}

export interface Hint {
  id: string;
  content: string;
  cost: number;
  unlocked: boolean;
}

// Lab Instance Types
export interface LabInstance {
  id: string;
  labId: string;
  userId: string;
  containerId: string;
  status: LabInstanceStatus;
  accessUrl: string;
  createdAt: string;
  expiresAt: string;
  ports: PortMapping[];
}

export enum LabInstanceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

// Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  labId: string;
  exerciseId?: string;
  status: ProgressStatus;
  score: number;
  completedAt?: string;
  timeSpent: number;
  hintsUsed: number;
  attempts: number;
  lastActivityAt: string;
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Report Types
export interface SecurityReport {
  id: string;
  userId: string;
  labId?: string;
  title: string;
  description: string;
  findings: Finding[];
  severity: Severity;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  cvss?: number;
  cwe?: string;
  recommendations: string[];
  evidence?: Evidence[];
}

export interface Evidence {
  type: 'screenshot' | 'code' | 'log' | 'network';
  content: string;
  timestamp: string;
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// AI Types
export interface AIHint {
  id: string;
  content: string;
  context: string;
  confidence: number;
  cost: number;
}

export interface VulnerabilityExplanation {
  vulnerability: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
}

// Collaboration Types
export interface CollaborationSession {
  id: string;
  name: string;
  labId: string;
  hostId: string;
  participants: Participant[];
  status: SessionStatus;
  createdAt: string;
  sharedScreen?: boolean;
}

export interface Participant {
  userId: string;
  username: string;
  role: 'host' | 'participant';
  joinedAt: string;
  isActive: boolean;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

// WebSocket Types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

export enum WebSocketMessageType {
  LAB_STATUS_CHANGED = 'lab_status_changed',
  PROGRESS_UPDATED = 'progress_updated',
  HINT_UNLOCKED = 'hint_unlocked',
  COLLABORATION_INVITE = 'collaboration_invite',
  CHAT_MESSAGE = 'chat_message',
  SCREEN_SHARE = 'screen_share',
}

// Statistics Types
export interface DashboardStats {
  totalLabs: number;
  completedLabs: number;
  inProgressLabs: number;
  totalPoints: number;
  ranking: number;
  averageScore: number;
  timeSpent: number;
  achievements: Achievement[];
  recentActivity: Activity[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export enum ActivityType {
  LAB_STARTED = 'lab_started',
  LAB_COMPLETED = 'lab_completed',
  EXERCISE_COMPLETED = 'exercise_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  REPORT_CREATED = 'report_created',
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface ValidationError {
  field: string;
  message: string;
}
