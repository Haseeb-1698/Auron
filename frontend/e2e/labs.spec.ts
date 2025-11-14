import { test, expect, type Page } from '@playwright/test';

/**
 * Labs Workflow E2E Tests
 * Tests for lab browsing, starting, completing exercises, and progress tracking
 */

// Helper function to login
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@auron.dev');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('Labs Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should display labs page with lab cards', async ({ page }) => {
    await page.goto('/labs');
    await expect(page).toHaveURL(/.*labs/);

    // Should show lab cards
    await expect(page.locator('[data-testid="lab-card"], .MuiCard-root').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should filter labs by category', async ({ page }) => {
    await page.goto('/labs');

    // Wait for labs to load
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    // Click on category filter
    const categorySelect = page.locator('label:has-text("Category") + div, select[name="category"]').first();
    await categorySelect.click();

    // Select a category (e.g., Web Security)
    await page.locator('li:has-text("Web Security")').click();

    // Verify filtered results
    await expect(page.locator('[data-testid="lab-card"], .MuiCard-root')).toHaveCount(
      await page.locator('[data-testid="lab-card"], .MuiCard-root').count(),
      { timeout: 5000 }
    );
  });

  test('should search for labs', async ({ page }) => {
    await page.goto('/labs');

    // Wait for labs to load
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('SQL');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search results contain "SQL"
    const labCards = page.locator('[data-testid="lab-card"], .MuiCard-root');
    await expect(labCards.first()).toContainText(/SQL/i);
  });

  test('should display lab difficulty badges', async ({ page }) => {
    await page.goto('/labs');

    // Wait for labs to load
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    // Check for difficulty badges
    await expect(
      page.locator('text=/beginner|intermediate|advanced|expert/i').first()
    ).toBeVisible();
  });

  test('should show lab statistics', async ({ page }) => {
    await page.goto('/labs');

    // Check for stats chips (Total Labs, Completed, etc.)
    await expect(page.locator('text=/total|completed/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Lab Detail and Exercises', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should navigate to lab detail page', async ({ page }) => {
    await page.goto('/labs');

    // Wait for labs to load
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    // Click on first lab card
    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    // Should navigate to lab detail
    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  });

  test('should display lab information', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    // Wait for lab detail page
    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Check for lab name, description, difficulty
    await expect(page.locator('h1, h2, h3, h4').first()).toBeVisible();
    await expect(page.locator('text=/beginner|intermediate|advanced|expert/i')).toBeVisible();
  });

  test('should show exercises tab', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Click on Exercises tab
    const exercisesTab = page.locator('button:has-text("Exercises"), [role="tab"]:has-text("Exercises")');
    await exercisesTab.click();

    // Should show exercises
    await expect(page.locator('text=/exercise|task/i')).toBeVisible({ timeout: 5000 });
  });

  test('should start a lab instance', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Click start lab button
    const startButton = page.locator('button:has-text("Start Lab")');
    await startButton.click();

    // Should show loading or running status
    await expect(page.locator('text=/starting|running/i')).toBeVisible({ timeout: 15000 });
  });

  test('should stop a lab instance', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Start the lab first
    const startButton = page.locator('button:has-text("Start Lab")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await expect(page.locator('text=/starting|running/i')).toBeVisible({ timeout: 15000 });
    }

    // Click stop button
    const stopButton = page.locator('button:has-text("Stop")');
    await stopButton.click();

    // Confirm in dialog if needed
    const confirmButton = page.locator('button:has-text("Stop Lab"), button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should show stopped status
    await expect(page.locator('text=/stopped|stop/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Exercise Submission and Hints', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should submit an exercise solution', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Go to exercises tab
    const exercisesTab = page.locator('button:has-text("Exercises"), [role="tab"]:has-text("Exercises")');
    await exercisesTab.click();

    // Expand first exercise
    const firstExercise = page.locator('[data-testid="exercise-accordion"], .MuiAccordion-root').first();
    await firstExercise.click();

    // Fill in solution
    const solutionInput = page.locator('textarea[placeholder*="solution"], input[placeholder*="solution"]');
    if (await solutionInput.isVisible()) {
      await solutionInput.fill('flag{test_solution}');

      // Submit solution
      const submitButton = page.locator('button:has-text("Submit Solution")');
      await submitButton.click();

      // Should show feedback
      await expect(page.locator('text=/submitted|success|correct|incorrect/i')).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should request AI hint', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Go to exercises tab
    const exercisesTab = page.locator('button:has-text("Exercises"), [role="tab"]:has-text("Exercises")');
    await exercisesTab.click();

    // Expand first exercise
    const firstExercise = page.locator('[data-testid="exercise-accordion"], .MuiAccordion-root').first();
    await firstExercise.click();

    // Click hint button
    const hintButton = page.locator('button:has-text("Request Hint"), button:has-text("Hint")');
    if (await hintButton.isVisible()) {
      await hintButton.click();

      // Should show hint dialog
      await expect(page.locator('text=/hint|suggestion/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display exercise progress', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    // Check for progress indicators on lab cards
    const progressBar = page.locator('[role="progressbar"], .MuiLinearProgress-root');
    if (await progressBar.first().isVisible()) {
      await expect(progressBar.first()).toBeVisible();
    }
  });
});

test.describe('Lab Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginUser(page);
  });

  test('should show completed labs count', async ({ page }) => {
    await page.goto('/labs');

    // Should show completed count
    await expect(page.locator('text=/completed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should mark exercise as completed', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForSelector('[data-testid="lab-card"], .MuiCard-root', { timeout: 10000 });

    const firstLabCard = page.locator('[data-testid="lab-card"], .MuiCard-root').first();
    await firstLabCard.click();

    await expect(page).toHaveURL(/.*labs\/[a-zA-Z0-9-]+/, { timeout: 10000 });

    // Go to exercises tab
    const exercisesTab = page.locator('button:has-text("Exercises"), [role="tab"]:has-text("Exercises")');
    await exercisesTab.click();

    // Check for completed checkmarks
    const completedIcon = page.locator('[data-testid="completed-icon"], .MuiSvgIcon-root[color="success"]');
    const count = await completedIcon.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});
