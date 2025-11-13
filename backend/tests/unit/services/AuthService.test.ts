import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '@services/AuthService';
import { UserRepository } from '@repositories/UserRepository';
import speakeasy from 'speakeasy';

// Mock dependencies
jest.mock('@repositories/UserRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('speakeasy');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as any;

    // Inject mocked repository
    authService = new AuthService();
    (authService as any).userRepository = mockUserRepository;
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue({
        id: '123',
        ...registerData,
        passwordHash: 'hashedPassword',
        role: 'student',
        twoFactorEnabled: false,
      } as any);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('email', registerData.email);
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'SecurePass123!',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '123',
        email: registerData.email,
      } as any);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow('User already exists');
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: '123',
        email: loginData.email,
        passwordHash: 'hashedPassword',
        twoFactorEnabled: false,
        role: 'student',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mockAccessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        id: '123',
        email: loginData.email,
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should require 2FA code when enabled', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: '123',
        email: loginData.email,
        passwordHash: 'hashedPassword',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow('2FA code required');
    });

    it('should successfully login with valid 2FA code', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        twoFactorCode: '123456',
      };

      const mockUser = {
        id: '123',
        email: loginData.email,
        passwordHash: 'hashedPassword',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
        role: 'student',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: mockUser.twoFactorSecret,
        encoding: 'base32',
        token: loginData.twoFactorCode,
      });
      expect(result).toHaveProperty('accessToken', 'mockAccessToken');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      // Arrange
      const token = 'validToken';
      const decodedPayload = { userId: '123', email: 'test@example.com' };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      mockUserRepository.findById.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      } as any);

      // Act
      const result = await authService.verifyToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toHaveProperty('id', '123');
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const token = 'invalidToken';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const token = 'validToken';
      const decodedPayload = { userId: '123', email: 'test@example.com' };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.verifyToken(token)).rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    it('should successfully generate new access token', async () => {
      // Arrange
      const refreshToken = 'validRefreshToken';
      const decodedPayload = { userId: '123' };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      mockUserRepository.findById.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        role: 'student',
      } as any);
      (jwt.sign as jest.Mock).mockReturnValue('newAccessToken');

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, expect.any(String));
      expect(result).toHaveProperty('accessToken', 'newAccessToken');
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalidRefreshToken';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      // Arrange
      const userId = '123';
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass123!';

      const mockUser = {
        id: userId,
        passwordHash: 'oldHashedPassword',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUserRepository.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'newHashedPassword',
      } as any);

      // Act
      await authService.changePassword(userId, oldPassword, newPassword);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, mockUser.passwordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        passwordHash: 'newHashedPassword',
      });
    });

    it('should throw error for incorrect old password', async () => {
      // Arrange
      const userId = '123';
      const oldPassword = 'WrongOldPass123!';
      const newPassword = 'NewPass123!';

      const mockUser = {
        id: userId,
        passwordHash: 'oldHashedPassword',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.changePassword(userId, oldPassword, newPassword)
      ).rejects.toThrow('Incorrect old password');
    });
  });
});
