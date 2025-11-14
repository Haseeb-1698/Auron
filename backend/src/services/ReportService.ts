import { Report, ReportType, ReportFormat, ReportStatus, ReportData } from '@models/Report';
import { User } from '@models/User';
import { Lab } from '@models/Lab';
import { UserProgress, ProgressStatus } from '@models/UserProgress';
import { Scan } from '@models/Scan';
import { logger } from '@utils/logger';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

/**
 * ReportService
 * Handles generation of various types of reports
 *
 * Supports:
 * - Lab completion reports
 * - Vulnerability scan reports
 * - Progress summary reports
 * - Export in multiple formats (PDF, JSON, CSV, HTML)
 */
export class ReportService {
  private static readonly REPORTS_DIR = path.join(process.cwd(), 'storage', 'reports');
  private static readonly REPORT_EXPIRY_DAYS = 30; // Reports expire after 30 days

  /**
   * Initialize reports directory
   */
  static async initialize(): Promise<void> {
    try {
      if (!fs.existsSync(this.REPORTS_DIR)) {
        fs.mkdirSync(this.REPORTS_DIR, { recursive: true });
        logger.info('Reports directory created', { path: this.REPORTS_DIR });
      }
    } catch (error) {
      logger.error('Failed to initialize reports directory:', error);
      throw error;
    }
  }

  /**
   * Generate a new report
   */
  static async generateReport(
    userId: string,
    reportType: ReportType,
    format: ReportFormat = ReportFormat.PDF,
    options?: {
      labId?: string;
      startDate?: Date;
      endDate?: Date;
      title?: string;
      description?: string;
    }
  ): Promise<Report> {
    try {
      // Validate user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create report record
      const report = await Report.create({
        userId,
        labId: options?.labId,
        title: options?.title || this.getDefaultTitle(reportType),
        description: options?.description,
        reportType,
        format,
        status: ReportStatus.PENDING,
        expiresAt: new Date(Date.now() + this.REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      });

      // Generate report in background
      this.executeReportGeneration(report.id, options).catch((error) => {
        logger.error('Background report generation failed:', error);
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Execute report generation
   */
  private static async executeReportGeneration(
    reportId: string,
    options?: {
      labId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<void> {
    const report = await Report.findByPk(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    try {
      // Update status
      await report.update({ status: ReportStatus.GENERATING });

      logger.info(`Generating report ${reportId}`, {
        type: report.reportType,
        format: report.format,
      });

      // Collect data based on report type
      let data: ReportData;
      switch (report.reportType) {
        case ReportType.LAB_COMPLETION:
          data = await this.generateLabCompletionData(report.userId, options?.labId);
          break;
        case ReportType.VULNERABILITY_SCAN:
          data = await this.generateVulnerabilityScanData(report.userId, options?.labId);
          break;
        case ReportType.PROGRESS_SUMMARY:
          data = await this.generateProgressSummaryData(
            report.userId,
            options?.startDate,
            options?.endDate
          );
          break;
        default:
          throw new Error(`Unsupported report type: ${report.reportType}`);
      }

      // Save data to report
      await report.update({ data });

      // Generate file based on format
      let filePath: string;
      let fileName: string;
      let fileSize: number;

      switch (report.format) {
        case ReportFormat.JSON:
          ({ filePath, fileName, fileSize } = await this.generateJSON(report, data));
          break;
        case ReportFormat.CSV:
          ({ filePath, fileName, fileSize } = await this.generateCSV(report, data));
          break;
        case ReportFormat.HTML:
          ({ filePath, fileName, fileSize } = await this.generateHTML(report, data));
          break;
        case ReportFormat.PDF:
          ({ filePath, fileName, fileSize } = await this.generatePDF(report, data));
          break;
        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }

      // Update report with file info
      await report.update({
        status: ReportStatus.COMPLETED,
        filePath,
        fileName,
        fileSize,
        generatedAt: new Date(),
      });

      logger.info(`Report generated successfully ${reportId}`, {
        fileName,
        fileSize,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await report.update({
        status: ReportStatus.FAILED,
        errorMessage,
      });
      logger.error('Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate lab completion report data
   */
  private static async generateLabCompletionData(
    userId: string,
    labId?: string
  ): Promise<ReportData> {
    const whereClause: { userId: string; labId?: string } = { userId };
    if (labId) {
      whereClause.labId = labId;
    }

    const progressRecords = await UserProgress.findAll({
      where: whereClause,
      include: [{ model: Lab, as: 'lab' }],
    });

    const completedLabs = progressRecords.filter((p) => p.status === ProgressStatus.COMPLETED);
    const totalPoints = progressRecords.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTime = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    return {
      summary: {
        totalLabs: progressRecords.length,
        completedLabs: completedLabs.length,
        totalPoints,
        timeSpent: totalTime,
      },
      labs: progressRecords.map((p) => ({
        id: p.labId,
        name: p.lab?.name || 'Unknown Lab',
        completed: p.status === ProgressStatus.COMPLETED,
        score: p.score,
        timeSpent: p.timeSpent,
        completedAt: p.completedAt?.toISOString(),
      })),
    };
  }

  /**
   * Generate vulnerability scan report data
   */
  private static async generateVulnerabilityScanData(
    userId: string,
    labId?: string
  ): Promise<ReportData> {
    const whereClause: { userId: string; labId?: string; status: string } = {
      userId,
      status: 'completed',
    };
    if (labId) {
      whereClause.labId = labId;
    }

    const scans = await Scan.findAll({
      where: whereClause,
      include: [{ model: Lab, as: 'lab' }],
      order: [['createdAt', 'DESC']],
    });

    const allVulnerabilities = scans.flatMap((scan) => scan.results?.vulnerabilities || []);
    const criticalCount = allVulnerabilities.filter((v) => v.severity === 'critical').length;
    const highCount = allVulnerabilities.filter((v) => v.severity === 'high').length;
    const mediumCount = allVulnerabilities.filter((v) => v.severity === 'medium').length;
    const lowCount = allVulnerabilities.filter((v) => v.severity === 'low').length;

    return {
      summary: {
        totalScans: scans.length,
        totalVulnerabilities: allVulnerabilities.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      scans: scans.map((scan) => ({
        id: scan.id,
        labName: scan.lab?.name || 'Unknown Lab',
        scanType: scan.scanType,
        vulnerabilitiesFound: scan.results?.summary.total || 0,
        completedAt: scan.completedAt?.toISOString(),
      })),
      vulnerabilities: allVulnerabilities.slice(0, 50), // Limit to top 50
    };
  }

  /**
   * Generate progress summary report data
   */
  private static async generateProgressSummaryData(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReportData> {
    const user = await User.findByPk(userId);
    const progressRecords = await UserProgress.findAll({
      where: { userId },
      include: [{ model: Lab, as: 'lab' }],
    });

    const completedLabs = progressRecords.filter((p) => {
      if (p.status !== ProgressStatus.COMPLETED || !p.completedAt) return false;
      if (startDate && p.completedAt < startDate) return false;
      if (endDate && p.completedAt > endDate) return false;
      return true;
    });

    const totalPoints = completedLabs.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTime = completedLabs.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    return {
      summary: {
        userName: user?.username,
        email: user?.email,
        completedLabs: completedLabs.length,
        totalPoints,
        timeSpent: totalTime,
        averageScore: completedLabs.length > 0 ? totalPoints / completedLabs.length : 0,
        period: {
          start: startDate?.toISOString(),
          end: endDate?.toISOString(),
        },
      },
      labs: completedLabs.map((p) => ({
        id: p.labId,
        name: p.lab?.name || 'Unknown Lab',
        score: p.score,
        timeSpent: p.timeSpent,
        completedAt: p.completedAt?.toISOString(),
      })),
    };
  }

  /**
   * Generate JSON file
   */
  private static async generateJSON(
    report: Report,
    data: ReportData
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `report_${report.id}.json`;
    const filePath = path.join(this.REPORTS_DIR, fileName);

    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');

    return {
      filePath,
      fileName,
      fileSize: Buffer.byteLength(content, 'utf-8'),
    };
  }

  /**
   * Generate CSV file
   */
  private static async generateCSV(
    report: Report,
    data: ReportData
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `report_${report.id}.csv`;
    const filePath = path.join(this.REPORTS_DIR, fileName);

    let csvContent = '';

    // Generate CSV based on report type
    if (report.reportType === ReportType.LAB_COMPLETION && data.labs) {
      csvContent = 'Lab ID,Lab Name,Completed,Score,Time Spent,Completed At\n';
      csvContent += data.labs
        .map(
          (lab: any) =>
            `${lab.id},"${lab.name}",${lab.completed},${lab.score || 0},${lab.timeSpent || 0},${lab.completedAt || ''}`
        )
        .join('\n');
    } else if (report.reportType === ReportType.VULNERABILITY_SCAN && data.vulnerabilities) {
      csvContent = 'ID,Name,Severity,Description\n';
      csvContent += data.vulnerabilities
        .map((vuln: any) => `${vuln.id},"${vuln.name}",${vuln.severity},"${vuln.description}"`)
        .join('\n');
    }

    fs.writeFileSync(filePath, csvContent, 'utf-8');

    return {
      filePath,
      fileName,
      fileSize: Buffer.byteLength(csvContent, 'utf-8'),
    };
  }

  /**
   * Generate HTML file
   */
  private static async generateHTML(
    report: Report,
    data: ReportData
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `report_${report.id}.html`;
    const filePath = path.join(this.REPORTS_DIR, fileName);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p>${report.description || ''}</p>
  <div class="summary">
    <h2>Summary</h2>
    <pre>${JSON.stringify(data.summary, null, 2)}</pre>
  </div>
  <h2>Details</h2>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>
    `.trim();

    fs.writeFileSync(filePath, htmlContent, 'utf-8');

    return {
      filePath,
      fileName,
      fileSize: Buffer.byteLength(htmlContent, 'utf-8'),
    };
  }

  /**
   * Generate PDF file (placeholder - requires PDF library)
   */
  private static async generatePDF(
    report: Report,
    data: ReportData
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `report_${report.id}.pdf`;
    const filePath = path.join(this.REPORTS_DIR, fileName);

    try {
      // Generate HTML content for PDF
      const htmlContent = this.generatePDFHTML(report, data);

      // Launch headless browser and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with proper formatting
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();

      const stats = fs.statSync(filePath);

      return {
        filePath,
        fileName,
        fileSize: stats.size,
      };
    } catch (error) {
      logger.error('Failed to generate PDF with Puppeteer:', error);
      throw new Error('PDF generation failed');
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private static generatePDFHTML(report: Report, data: ReportData): string {
    const { summary } = data;
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let detailsHTML = '';

    // Format different report types
    if (report.reportType === ReportType.VULNERABILITY_SCAN && data.vulnerabilities) {
      const vulnsBySeverity = {
        critical: data.vulnerabilities.filter((v: any) => v.severity === 'critical'),
        high: data.vulnerabilities.filter((v: any) => v.severity === 'high'),
        medium: data.vulnerabilities.filter((v: any) => v.severity === 'medium'),
        low: data.vulnerabilities.filter((v: any) => v.severity === 'low'),
        info: data.vulnerabilities.filter((v: any) => v.severity === 'info'),
      };

      detailsHTML = `
        <h2>Vulnerability Details</h2>
        <div class="vuln-stats">
          <div class="stat-item critical">
            <span class="stat-number">${vulnsBySeverity.critical.length}</span>
            <span class="stat-label">Critical</span>
          </div>
          <div class="stat-item high">
            <span class="stat-number">${vulnsBySeverity.high.length}</span>
            <span class="stat-label">High</span>
          </div>
          <div class="stat-item medium">
            <span class="stat-number">${vulnsBySeverity.medium.length}</span>
            <span class="stat-label">Medium</span>
          </div>
          <div class="stat-item low">
            <span class="stat-number">${vulnsBySeverity.low.length}</span>
            <span class="stat-label">Low</span>
          </div>
          <div class="stat-item info">
            <span class="stat-number">${vulnsBySeverity.info.length}</span>
            <span class="stat-label">Info</span>
          </div>
        </div>

        ${Object.entries(vulnsBySeverity)
          .filter(([, vulns]) => vulns.length > 0)
          .map(
            ([severity, vulns]) => `
          <div class="severity-section">
            <h3 class="${severity}">${severity.charAt(0).toUpperCase() + severity.slice(1)} Vulnerabilities</h3>
            ${(vulns as any[])
              .map(
                (v) => `
              <div class="vulnerability">
                <h4>${v.name}</h4>
                <p><strong>Description:</strong> ${v.description || 'N/A'}</p>
                ${v.location ? `<p><strong>Location:</strong> ${v.location}</p>` : ''}
                ${v.solution ? `<p><strong>Solution:</strong> ${v.solution}</p>` : ''}
                ${v.references && v.references.length > 0 ? `<p><strong>References:</strong> ${v.references.join(', ')}</p>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        `
          )
          .join('')}
      `;
    } else if (data.labs) {
      detailsHTML = `
        <h2>Lab Details</h2>
        <table>
          <thead>
            <tr>
              <th>Lab Name</th>
              <th>Status</th>
              <th>Score</th>
              <th>Time Spent</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            ${data.labs
              .map(
                (lab: any) => `
              <tr>
                <td>${lab.name}</td>
                <td>${lab.completed ? '✓ Completed' : '○ In Progress'}</td>
                <td>${lab.score || 0}</td>
                <td>${Math.floor((lab.timeSpent || 0) / 60)} min</td>
                <td>${lab.completedAt ? new Date(lab.completedAt).toLocaleDateString() : '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .meta {
      color: #7f8c8d;
      font-size: 14px;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #4CAF50;
    }
    .summary h2 {
      color: #2c3e50;
      font-size: 20px;
      margin-bottom: 15px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .summary-item {
      padding: 10px;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #4CAF50;
    }
    .summary-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
      margin-top: 5px;
    }
    .vuln-stats {
      display: flex;
      gap: 15px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    .stat-item {
      flex: 1;
      min-width: 100px;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      color: white;
    }
    .stat-item.critical { background-color: #e74c3c; }
    .stat-item.high { background-color: #e67e22; }
    .stat-item.medium { background-color: #f39c12; }
    .stat-item.low { background-color: #3498db; }
    .stat-item.info { background-color: #95a5a6; }
    .stat-number {
      display: block;
      font-size: 32px;
      font-weight: bold;
    }
    .stat-label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      margin-top: 5px;
    }
    h2, h3, h4 {
      color: #2c3e50;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3.critical { color: #e74c3c; }
    h3.high { color: #e67e22; }
    h3.medium { color: #f39c12; }
    h3.low { color: #3498db; }
    h3.info { color: #95a5a6; }
    .vulnerability {
      background: #fff;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #e74c3c;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .vulnerability h4 {
      margin-top: 0;
      color: #2c3e50;
    }
    .vulnerability p {
      margin: 8px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <div class="meta">
      <div>Generated: ${date}</div>
      ${report.description ? `<div>${report.description}</div>` : ''}
    </div>
  </div>

  ${
    summary
      ? `
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      ${Object.entries(summary)
        .map(
          ([key, value]) => `
        <div class="summary-item">
          <div class="summary-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
          <div class="summary-value">${value}</div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
  `
      : ''
  }

  ${detailsHTML}

  <div class="footer">
    <p>Auron Cybersecurity Training Platform</p>
    <p>This report was automatically generated by the Auron platform.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get default title for report type
   */
  private static getDefaultTitle(reportType: ReportType): string {
    const titles: Record<ReportType, string> = {
      [ReportType.LAB_COMPLETION]: 'Lab Completion Report',
      [ReportType.VULNERABILITY_SCAN]: 'Vulnerability Scan Report',
      [ReportType.PROGRESS_SUMMARY]: 'Progress Summary Report',
      [ReportType.CUSTOM]: 'Custom Report',
    };
    return titles[reportType] || 'Report';
  }

  /**
   * Delete expired reports
   */
  static async cleanupExpiredReports(): Promise<number> {
    try {
      const expiredReports = await Report.findAll({
        where: {
          expiresAt: {
            $lt: new Date(),
          },
        },
      });

      for (const report of expiredReports) {
        // Delete file if exists
        if (report.filePath && fs.existsSync(report.filePath)) {
          fs.unlinkSync(report.filePath);
        }
        await report.destroy();
      }

      logger.info('Cleaned up expired reports', { count: expiredReports.length });
      return expiredReports.length;
    } catch (error) {
      logger.error('Failed to cleanup expired reports:', error);
      return 0;
    }
  }
}
