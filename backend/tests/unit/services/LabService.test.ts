import { LabService } from '@services/LabService';
import { LabRepository } from '@repositories/LabRepository';
import { LabInstanceRepository } from '@repositories/LabInstanceRepository';
import Dockerode from 'dockerode';

// Mock dependencies
jest.mock('@repositories/LabRepository');
jest.mock('@repositories/LabInstanceRepository');
jest.mock('dockerode');

describe('LabService', () => {
  let labService: LabService;
  let mockLabRepository: jest.Mocked<LabRepository>;
  let mockLabInstanceRepository: jest.Mocked<LabInstanceRepository>;
  let mockDocker: jest.Mocked<Dockerode>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
    mockLabRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockLabInstanceRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByLabId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockDocker = {
      createContainer: jest.fn(),
      getContainer: jest.fn(),
    } as any;

    labService = new LabService();
    (labService as any).labRepository = mockLabRepository;
    (labService as any).labInstanceRepository = mockLabInstanceRepository;
    (labService as any).docker = mockDocker;
  });

  describe('getAllLabs', () => {
    it('should return all labs', async () => {
      // Arrange
      const mockLabs = [
        {
          id: '1',
          name: 'SQL Injection Lab',
          category: 'web_security',
          difficulty: 'beginner',
          isActive: true,
        },
        {
          id: '2',
          name: 'XSS Lab',
          category: 'web_security',
          difficulty: 'intermediate',
          isActive: true,
        },
      ];

      mockLabRepository.findAll.mockResolvedValue(mockLabs as any);

      // Act
      const result = await labService.getAllLabs();

      // Assert
      expect(mockLabRepository.findAll).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual(mockLabs);
      expect(result).toHaveLength(2);
    });

    it('should filter labs by category', async () => {
      // Arrange
      const mockLabs = [
        {
          id: '1',
          name: 'SQL Injection Lab',
          category: 'web_security',
          difficulty: 'beginner',
          isActive: true,
        },
      ];

      mockLabRepository.findAll.mockResolvedValue(mockLabs as any);

      // Act
      const result = await labService.getAllLabs({ category: 'web_security' });

      // Assert
      expect(mockLabRepository.findAll).toHaveBeenCalledWith({
        where: { isActive: true, category: 'web_security' },
      });
      expect(result).toEqual(mockLabs);
    });

    it('should filter labs by difficulty', async () => {
      // Arrange
      const mockLabs = [
        {
          id: '1',
          name: 'Basic SQL Injection',
          difficulty: 'beginner',
          isActive: true,
        },
      ];

      mockLabRepository.findAll.mockResolvedValue(mockLabs as any);

      // Act
      const result = await labService.getAllLabs({ difficulty: 'beginner' });

      // Assert
      expect(mockLabRepository.findAll).toHaveBeenCalledWith({
        where: { isActive: true, difficulty: 'beginner' },
      });
      expect(result).toEqual(mockLabs);
    });
  });

  describe('getLabById', () => {
    it('should return lab by id', async () => {
      // Arrange
      const mockLab = {
        id: '1',
        name: 'SQL Injection Lab',
        description: 'Learn SQL injection',
        category: 'web_security',
        difficulty: 'beginner',
        exercises: [],
      };

      mockLabRepository.findById.mockResolvedValue(mockLab as any);

      // Act
      const result = await labService.getLabById('1');

      // Assert
      expect(mockLabRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockLab);
    });

    it('should throw error if lab not found', async () => {
      // Arrange
      mockLabRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(labService.getLabById('999')).rejects.toThrow('Lab not found');
    });
  });

  describe('startLab', () => {
    it('should successfully start a new lab instance', async () => {
      // Arrange
      const userId = 'user123';
      const labId = 'lab456';

      const mockLab = {
        id: labId,
        name: 'SQL Injection Lab',
        containerConfig: {
          image: 'dvwa:latest',
          ports: [{ container: 80, host: null }],
          environment: { MYSQL_PASSWORD: 'password' },
        },
      };

      const mockContainer = {
        id: 'container789',
        start: jest.fn().mockResolvedValue(undefined),
        inspect: jest.fn().mockResolvedValue({
          NetworkSettings: {
            Ports: { '80/tcp': [{ HostPort: '8080' }] },
          },
        }),
      };

      mockLabRepository.findById.mockResolvedValue(mockLab as any);
      mockLabInstanceRepository.findByUserId.mockResolvedValue([]);
      mockDocker.createContainer.mockResolvedValue(mockContainer as any);
      mockLabInstanceRepository.create.mockResolvedValue({
        id: 'instance123',
        userId,
        labId,
        containerId: 'container789',
        status: 'running',
        accessUrl: 'http://localhost:8080',
      } as any);

      // Act
      const result = await labService.startLab(userId, labId);

      // Assert
      expect(mockLabRepository.findById).toHaveBeenCalledWith(labId);
      expect(mockDocker.createContainer).toHaveBeenCalled();
      expect(mockContainer.start).toHaveBeenCalled();
      expect(mockLabInstanceRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'instance123');
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('accessUrl');
    });

    it('should throw error if lab not found', async () => {
      // Arrange
      mockLabRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(labService.startLab('user123', 'nonexistent')).rejects.toThrow(
        'Lab not found'
      );
    });

    it('should throw error if user already has active instance', async () => {
      // Arrange
      const userId = 'user123';
      const labId = 'lab456';

      const mockLab = { id: labId, name: 'SQL Lab' };
      const activeInstance = {
        id: 'instance789',
        userId,
        labId,
        status: 'running',
      };

      mockLabRepository.findById.mockResolvedValue(mockLab as any);
      mockLabInstanceRepository.findByUserId.mockResolvedValue([activeInstance] as any);

      // Act & Assert
      await expect(labService.startLab(userId, labId)).rejects.toThrow(
        'User already has an active instance of this lab'
      );
    });

    it('should handle container creation failure', async () => {
      // Arrange
      const userId = 'user123';
      const labId = 'lab456';

      const mockLab = {
        id: labId,
        containerConfig: { image: 'dvwa:latest', ports: [] },
      };

      mockLabRepository.findById.mockResolvedValue(mockLab as any);
      mockLabInstanceRepository.findByUserId.mockResolvedValue([]);
      mockDocker.createContainer.mockRejectedValue(new Error('Docker error'));

      // Act & Assert
      await expect(labService.startLab(userId, labId)).rejects.toThrow('Docker error');
    });
  });

  describe('stopLab', () => {
    it('should successfully stop a running lab instance', async () => {
      // Arrange
      const instanceId = 'instance123';
      const mockInstance = {
        id: instanceId,
        containerId: 'container789',
        status: 'running',
      };

      const mockContainer = {
        stop: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockLabInstanceRepository.findById.mockResolvedValue(mockInstance as any);
      mockDocker.getContainer.mockReturnValue(mockContainer as any);
      mockLabInstanceRepository.update.mockResolvedValue({
        ...mockInstance,
        status: 'stopped',
      } as any);

      // Act
      await labService.stopLab(instanceId);

      // Assert
      expect(mockLabInstanceRepository.findById).toHaveBeenCalledWith(instanceId);
      expect(mockDocker.getContainer).toHaveBeenCalledWith('container789');
      expect(mockContainer.stop).toHaveBeenCalled();
      expect(mockContainer.remove).toHaveBeenCalled();
      expect(mockLabInstanceRepository.update).toHaveBeenCalledWith(instanceId, {
        status: 'stopped',
      });
    });

    it('should throw error if instance not found', async () => {
      // Arrange
      mockLabInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(labService.stopLab('nonexistent')).rejects.toThrow('Instance not found');
    });

    it('should handle container stop failure gracefully', async () => {
      // Arrange
      const instanceId = 'instance123';
      const mockInstance = {
        id: instanceId,
        containerId: 'container789',
        status: 'running',
      };

      const mockContainer = {
        stop: jest.fn().mockRejectedValue(new Error('Container not running')),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockLabInstanceRepository.findById.mockResolvedValue(mockInstance as any);
      mockDocker.getContainer.mockReturnValue(mockContainer as any);
      mockLabInstanceRepository.update.mockResolvedValue({
        ...mockInstance,
        status: 'stopped',
      } as any);

      // Act
      await labService.stopLab(instanceId);

      // Assert - should still try to remove and update
      expect(mockContainer.remove).toHaveBeenCalled();
      expect(mockLabInstanceRepository.update).toHaveBeenCalled();
    });
  });

  describe('getUserInstances', () => {
    it('should return all instances for a user', async () => {
      // Arrange
      const userId = 'user123';
      const mockInstances = [
        {
          id: 'instance1',
          userId,
          labId: 'lab1',
          status: 'running',
        },
        {
          id: 'instance2',
          userId,
          labId: 'lab2',
          status: 'stopped',
        },
      ];

      mockLabInstanceRepository.findByUserId.mockResolvedValue(mockInstances as any);

      // Act
      const result = await labService.getUserInstances(userId);

      // Assert
      expect(mockLabInstanceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockInstances);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if user has no instances', async () => {
      // Arrange
      mockLabInstanceRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await labService.getUserInstances('user123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('resetLab', () => {
    it('should successfully reset a lab instance', async () => {
      // Arrange
      const instanceId = 'instance123';
      const mockInstance = {
        id: instanceId,
        userId: 'user123',
        labId: 'lab456',
        containerId: 'container789',
        status: 'running',
      };

      const mockLab = {
        id: 'lab456',
        containerConfig: { image: 'dvwa:latest', ports: [] },
      };

      const mockOldContainer = {
        stop: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      const mockNewContainer = {
        id: 'newContainer123',
        start: jest.fn().mockResolvedValue(undefined),
        inspect: jest.fn().mockResolvedValue({
          NetworkSettings: { Ports: {} },
        }),
      };

      mockLabInstanceRepository.findById.mockResolvedValue(mockInstance as any);
      mockLabRepository.findById.mockResolvedValue(mockLab as any);
      mockDocker.getContainer.mockReturnValue(mockOldContainer as any);
      mockDocker.createContainer.mockResolvedValue(mockNewContainer as any);
      mockLabInstanceRepository.update.mockResolvedValue({
        ...mockInstance,
        containerId: 'newContainer123',
      } as any);

      // Act
      const result = await labService.resetLab(instanceId);

      // Assert
      expect(mockOldContainer.stop).toHaveBeenCalled();
      expect(mockOldContainer.remove).toHaveBeenCalled();
      expect(mockDocker.createContainer).toHaveBeenCalled();
      expect(mockNewContainer.start).toHaveBeenCalled();
      expect(result).toHaveProperty('containerId', 'newContainer123');
    });

    it('should throw error if instance not found', async () => {
      // Arrange
      mockLabInstanceRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(labService.resetLab('nonexistent')).rejects.toThrow('Instance not found');
    });
  });
});
