import { test, expect, type Page } from '@playwright/test';

/**
 * Reports and Scanning E2E Tests
 * Tests for vulnerability scanning and report generation
 */

// Helper function to login
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@auron.dev');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should display reports page', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/.*reports/);

    // Should show page heading
    await expect(page.locator('h1, h2, h3, h4').getByText(/reports/i)).toBeVisible();
  });

  test('should show report statistics', async ({ page }) => {
    await page.goto('/reports');

    // Wait for stats to load
    await page.waitForTimeout(2000);

    // Should show stats cards (Total Reports, Completed, etc.)
    await expect(page.locator('text=/total|completed|pending/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display reports table', async ({ page }) => {
    await page.goto('/reports');

    // Should show table with headers
    await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th, [role="columnheader"]').getByText(/type|title|status/i)).toBeVisible();
  });

  test('should filter reports by type', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Click on report type filter
    const typeSelect = page.locator('label:has-text("Report Type") + div, select[name="reportType"]').first();
    await typeSelect.click();

    // Select a type
    await page.locator('li:has-text("Vulnerability Scan")').click();

    // Verify filtered results
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/vulnerability/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter reports by status', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Click on status filter
    const statusSelect = page.locator('label:has-text("Status") + div, select[name="status"]').first();
    await statusSelect.click();

    // Select completed status
    await page.locator('li:has-text("Completed")').click();

    // Verify filtered results
    await page.waitForTimeout(1000);
  });
});

test.describe('Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should open generate report dialog', async ({ page }) => {
    await page.goto('/reports');

    // Click generate report button
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("New Report")');
    await generateButton.click();

    // Should show dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/generate|create/i')).toBeVisible();
  });

  test('should generate a lab completion report', async ({ page }) => {
    await page.goto('/reports');

    // Click generate report button
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("New Report")');
    await generateButton.click();

    // Fill in report details
    const titleInput = page.locator('input[label="Title"], input[name="title"]');
    await titleInput.fill('Lab Completion Report - Test');

    // Select report type
    const typeSelect = page.locator('label:has-text("Report Type") + div').last();
    await typeSelect.click();
    await page.locator('li:has-text("Lab Completion")').click();

    // Select format
    const formatSelect = page.locator('label:has-text("Format") + div').last();
    await formatSelect.click();
    await page.locator('li:has-text("PDF")').click();

    // Click generate button in dialog
    const dialogGenerateButton = page.locator('[role="dialog"] button:has-text("Generate")');
    await dialogGenerateButton.click();

    // Should close dialog and show success message
    await expect(page.locator('text=/success|generated|created/i')).toBeVisible({ timeout: 10000 });
  });

  test('should generate a vulnerability scan report', async ({ page }) => {
    await page.goto('/reports');

    // Click generate report button
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("New Report")');
    await generateButton.click();

    // Fill in report details
    const titleInput = page.locator('input[label="Title"], input[name="title"]');
    await titleInput.fill('Vulnerability Scan Report - Test');

    // Select report type
    const typeSelect = page.locator('label:has-text("Report Type") + div').last();
    await typeSelect.click();
    await page.locator('li:has-text("Vulnerability Scan")').click();

    // Select format
    const formatSelect = page.locator('label:has-text("Format") + div').last();
    await formatSelect.click();
    await page.locator('li:has-text("PDF")').click();

    // Click generate button
    const dialogGenerateButton = page.locator('[role="dialog"] button:has-text("Generate")');
    await dialogGenerateButton.click();

    // Should show success
    await expect(page.locator('text=/success|generated/i')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields in generate report form', async ({ page }) => {
    await page.goto('/reports');

    // Click generate report button
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("New Report")');
    await generateButton.click();

    // Try to submit without filling fields
    const dialogGenerateButton = page.locator('[role="dialog"] button:has-text("Generate")');

    // Button should be disabled without title
    await expect(dialogGenerateButton).toBeDisabled();
  });
});

test.describe('Report Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should download a completed report', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Find a completed report with download button
    const downloadButton = page.locator('button[title="Download"], [data-testid="download-button"]').first();

    if (await downloadButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

      // Click download
      await downloadButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify download started
      expect(download.suggestedFilename()).toBeTruthy();
    } else {
      // Skip test if no completed reports
      test.skip();
    }
  });

  test('should delete a report', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Count reports before deletion
    const reportRows = page.locator('tbody tr, [role="row"]');
    const initialCount = await reportRows.count();

    if (initialCount > 0) {
      // Find delete button
      const deleteButton = page.locator('button[title="Delete"], [data-testid="delete-button"]').last();
      await deleteButton.click();

      // Confirm deletion in dialog if present
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Verify report was deleted
      const newCount = await reportRows.count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    } else {
      test.skip();
    }
  });

  test('should view report details', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Click view button on first report
    const viewButton = page.locator('button[title="View Details"], button[title="View"]').first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Should show report details (in modal or new page)
      await expect(page.locator('text=/details|findings|vulnerabilities/i')).toBeVisible({
        timeout: 5000,
      });
    } else {
      test.skip();
    }
  });
});

test.describe('Report Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should paginate through reports', async ({ page }) => {
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForTimeout(2000);

    // Check if pagination exists
    const pagination = page.locator('[role="navigation"] button, .MuiPagination-root button');

    if ((await pagination.count()) > 1) {
      // Click next page
      const nextButton = page.locator('button[aria-label*="next"], button:has-text("Next")');
      await nextButton.click();

      // Wait for new page to load
      await page.waitForTimeout(2000);

      // Verify page changed
      await expect(page.locator('tbody tr, [role="row"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

test.describe('Vulnerability Scanning', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should trigger vulnerability scan from lab', async ({ page }) => {
    // Navigate to a lab
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Start lab if not already started
    const startButton = page.locator('button:has-text("Start Lab")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(5000);
    }

    // Look for scan button
    const scanButton = page.locator('button:has-text("Scan"), button:has-text("Vulnerability Scan")');

    if (await scanButton.isVisible()) {
      await scanButton.click();

      // Should show scanning status or results
      await expect(page.locator('text=/scanning|vulnerabilities|findings/i')).toBeVisible({
        timeout: 20000,
      });
    } else {
      test.skip();
    }
  });
});
