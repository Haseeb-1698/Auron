import { ScanService } from '@services/ScanService';
import { ScanRepository } from '@repositories/ScanRepository';
import { VulnerabilityRepository } from '@repositories/VulnerabilityRepository';
import axios from 'axios';

// Mock dependencies
jest.mock('@repositories/ScanRepository');
jest.mock('@repositories/VulnerabilityRepository');
jest.mock('axios');

describe('ScanService', () => {
  let scanService: ScanService;
  let mockScanRepository: jest.Mocked<ScanRepository>;
  let mockVulnerabilityRepository: jest.Mocked<VulnerabilityRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockScanRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByLabId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockVulnerabilityRepository = {
      findAll: jest.fn(),
      findByScanId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    scanService = new ScanService();
    (scanService as any).scanRepository = mockScanRepository;
    (scanService as any).vulnerabilityRepository = mockVulnerabilityRepository;
  });

  describe('startScan', () => {
    it('should successfully create and start a vulnerability scan', async () => {
      // Arrange
      const userId = 'user123';
      const targetUrl = 'http://dvwa.local';
      const scanType = 'basic';

      const mockScan = {
        id: 'scan123',
        userId,
        targetUrl,
        scanType,
        status: 'pending',
        createdAt: new Date(),
      };

      mockScanRepository.create.mockResolvedValue(mockScan as any);

      // Act
      const result = await scanService.startScan(userId, targetUrl, scanType);

      // Assert
      expect(mockScanRepository.create).toHaveBeenCalledWith({
        userId,
        targetUrl,
        scanType,
        status: 'pending',
      });
      expect(result).toHaveProperty('id', 'scan123');
      expect(result).toHaveProperty('status', 'pending');
    });

    it('should validate target URL format', async () => {
      // Arrange
      const userId = 'user123';
      const invalidUrl = 'not-a-url';
      const scanType = 'basic';

      // Act & Assert
      await expect(
        scanService.startScan(userId, invalidUrl, scanType)
      ).rejects.toThrow('Invalid URL format');
    });

    it('should throw error for unsupported scan type', async () => {
      // Arrange
      const userId = 'user123';
      const targetUrl = 'http://dvwa.local';
      const invalidScanType = 'invalid' as any;

      // Act & Assert
      await expect(
        scanService.startScan(userId, targetUrl, invalidScanType)
      ).rejects.toThrow('Unsupported scan type');
    });
  });

  describe('getScanById', () => {
    it('should return scan with vulnerabilities', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        targetUrl: 'http://dvwa.local',
        status: 'completed',
      };

      const mockVulnerabilities = [
        {
          id: 'vuln1',
          scanId,
          title: 'SQL Injection',
          severity: 'high',
          cvss: 8.5,
        },
        {
          id: 'vuln2',
          scanId,
          title: 'XSS',
          severity: 'medium',
          cvss: 6.1,
        },
      ];

      mockScanRepository.findById.mockResolvedValue(mockScan as any);
      mockVulnerabilityRepository.findByScanId.mockResolvedValue(mockVulnerabilities as any);

      // Act
      const result = await scanService.getScanById(scanId);

      // Assert
      expect(mockScanRepository.findById).toHaveBeenCalledWith(scanId);
      expect(mockVulnerabilityRepository.findByScanId).toHaveBeenCalledWith(scanId);
      expect(result).toHaveProperty('vulnerabilities');
      expect(result.vulnerabilities).toHaveLength(2);
    });

    it('should throw error if scan not found', async () => {
      // Arrange
      mockScanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(scanService.getScanById('nonexistent')).rejects.toThrow('Scan not found');
    });
  });

  describe('getUserScans', () => {
    it('should return all scans for a user', async () => {
      // Arrange
      const userId = 'user123';
      const mockScans = [
        {
          id: 'scan1',
          userId,
          targetUrl: 'http://dvwa.local',
          status: 'completed',
        },
        {
          id: 'scan2',
          userId,
          targetUrl: 'http://juiceshop.local',
          status: 'running',
        },
      ];

      mockScanRepository.findByUserId.mockResolvedValue(mockScans as any);

      // Act
      const result = await scanService.getUserScans(userId);

      // Assert
      expect(mockScanRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockScans);
      expect(result).toHaveLength(2);
    });

    it('should filter scans by status', async () => {
      // Arrange
      const userId = 'user123';
      const mockScans = [
        {
          id: 'scan1',
          userId,
          status: 'completed',
        },
      ];

      mockScanRepository.findByUserId.mockResolvedValue(mockScans as any);

      // Act
      const result = await scanService.getUserScans(userId, { status: 'completed' });

      // Assert
      expect(mockScanRepository.findByUserId).toHaveBeenCalledWith(userId, {
        where: { status: 'completed' },
      });
      expect(result).toEqual(mockScans);
    });
  });

  describe('processScan', () => {
    it('should successfully process a basic scan', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        targetUrl: 'http://dvwa.local',
        scanType: 'basic',
        status: 'pending',
      };

      mockScanRepository.findById.mockResolvedValue(mockScan as any);
      mockScanRepository.update.mockResolvedValue({
        ...mockScan,
        status: 'completed',
      } as any);

      // Mock vulnerability detection
      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html><title>DVWA</title></html>',
        headers: { 'x-powered-by': 'PHP/7.4' },
      });

      mockVulnerabilityRepository.create.mockResolvedValue({
        id: 'vuln1',
        scanId,
        title: 'Information Disclosure',
        severity: 'low',
      } as any);

      // Act
      await scanService.processScan(scanId);

      // Assert
      expect(mockScanRepository.update).toHaveBeenCalledWith(scanId, {
        status: 'running',
      });
      expect(axios.get).toHaveBeenCalledWith(mockScan.targetUrl, expect.any(Object));
      expect(mockScanRepository.update).toHaveBeenCalledWith(scanId, {
        status: 'completed',
        completedAt: expect.any(Date),
      });
    });

    it('should handle scan failures', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        targetUrl: 'http://unreachable.local',
        scanType: 'basic',
        status: 'pending',
      };

      mockScanRepository.findById.mockResolvedValue(mockScan as any);
      (axios.get as jest.Mock).mockRejectedValue(new Error('Connection refused'));
      mockScanRepository.update.mockResolvedValue({
        ...mockScan,
        status: 'failed',
      } as any);

      // Act
      await scanService.processScan(scanId);

      // Assert
      expect(mockScanRepository.update).toHaveBeenCalledWith(scanId, {
        status: 'failed',
        error: 'Connection refused',
      });
    });

    it('should throw error if scan not found', async () => {
      // Arrange
      mockScanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(scanService.processScan('nonexistent')).rejects.toThrow('Scan not found');
    });
  });

  describe('detectVulnerabilities', () => {
    it('should detect SQL injection vulnerability', async () => {
      // Arrange
      const scanId = 'scan123';
      const targetUrl = 'http://dvwa.local/vulnerabilities/sqli/?id=1';

      // Mock SQL injection detection
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({
          data: 'First name: admin',
          status: 200,
        })
        .mockResolvedValueOnce({
          data: "You have an error in your SQL syntax",
          status: 200,
        });

      mockVulnerabilityRepository.create.mockResolvedValue({
        id: 'vuln1',
        scanId,
        title: 'SQL Injection',
        severity: 'high',
      } as any);

      // Act
      const vulnerabilities = await scanService.detectVulnerabilities(scanId, targetUrl);

      // Assert
      expect(vulnerabilities.length).toBeGreaterThan(0);
      expect(mockVulnerabilityRepository.create).toHaveBeenCalled();
    });

    it('should detect XSS vulnerability', async () => {
      // Arrange
      const scanId = 'scan123';
      const targetUrl = 'http://dvwa.local/vulnerabilities/xss_r/';

      (axios.get as jest.Mock).mockResolvedValue({
        data: '<script>alert("XSS")</script>',
        status: 200,
      });

      mockVulnerabilityRepository.create.mockResolvedValue({
        id: 'vuln1',
        scanId,
        title: 'Cross-Site Scripting (XSS)',
        severity: 'high',
      } as any);

      // Act
      const vulnerabilities = await scanService.detectVulnerabilities(scanId, targetUrl);

      // Assert
      expect(vulnerabilities.length).toBeGreaterThan(0);
      expect(mockVulnerabilityRepository.create).toHaveBeenCalled();
    });

    it('should detect insecure headers', async () => {
      // Arrange
      const scanId = 'scan123';
      const targetUrl = 'http://dvwa.local';

      (axios.get as jest.Mock).mockResolvedValue({
        data: '<html></html>',
        status: 200,
        headers: {
          'x-powered-by': 'PHP/7.4',
          // Missing security headers
        },
      });

      mockVulnerabilityRepository.create.mockResolvedValue({
        id: 'vuln1',
        scanId,
        title: 'Missing Security Headers',
        severity: 'medium',
      } as any);

      // Act
      const vulnerabilities = await scanService.detectVulnerabilities(scanId, targetUrl);

      // Assert
      expect(vulnerabilities.length).toBeGreaterThan(0);
    });
  });

  describe('cancelScan', () => {
    it('should successfully cancel a running scan', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        status: 'running',
      };

      mockScanRepository.findById.mockResolvedValue(mockScan as any);
      mockScanRepository.update.mockResolvedValue({
        ...mockScan,
        status: 'cancelled',
      } as any);

      // Act
      await scanService.cancelScan(scanId);

      // Assert
      expect(mockScanRepository.update).toHaveBeenCalledWith(scanId, {
        status: 'cancelled',
      });
    });

    it('should throw error if scan is already completed', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        status: 'completed',
      };

      mockScanRepository.findById.mockResolvedValue(mockScan as any);

      // Act & Assert
      await expect(scanService.cancelScan(scanId)).rejects.toThrow(
        'Cannot cancel completed scan'
      );
    });
  });

  describe('deleteScan', () => {
    it('should successfully delete a scan and its vulnerabilities', async () => {
      // Arrange
      const scanId = 'scan123';
      const mockScan = {
        id: scanId,
        status: 'completed',
      };

      mockScanRepository.findById.mockResolvedValue(mockScan as any);
      mockVulnerabilityRepository.findByScanId.mockResolvedValue([
        { id: 'vuln1' },
        { id: 'vuln2' },
      ] as any);
      mockVulnerabilityRepository.delete.mockResolvedValue(undefined);
      mockScanRepository.delete.mockResolvedValue(undefined);

      // Act
      await scanService.deleteScan(scanId);

      // Assert
      expect(mockVulnerabilityRepository.findByScanId).toHaveBeenCalledWith(scanId);
      expect(mockVulnerabilityRepository.delete).toHaveBeenCalledTimes(2);
      expect(mockScanRepository.delete).toHaveBeenCalledWith(scanId);
    });

    it('should throw error if scan not found', async () => {
      // Arrange
      mockScanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(scanService.deleteScan('nonexistent')).rejects.toThrow('Scan not found');
    });
  });
});
