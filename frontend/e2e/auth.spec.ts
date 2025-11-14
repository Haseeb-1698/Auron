import { test, expect, type Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for user registration, login, logout, and 2FA flows
 */

const TEST_USER = {
  email: 'testuser@auron.dev',
  username: 'testuser',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

// Helper function to register a new user
async function registerUser(page: Page) {
  await page.goto('/register');
  await expect(page).toHaveURL(/.*register/);

  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="username"]', TEST_USER.username);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.fill('input[name="firstName"]', TEST_USER.firstName);
  await page.fill('input[name="lastName"]', TEST_USER.lastName);

  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

// Helper function to login
async function loginUser(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  await page.goto('/login');
  await expect(page).toHaveURL(/.*login/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Auron/);
    await expect(page.locator('h1, h2, h4, h5').getByText(/login/i)).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Auron/);
    await expect(page.locator('h1, h2, h4, h5').getByText(/register|sign up/i)).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=/required|fill in|enter/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'nonexistent@test.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully register a new user', async ({ page }) => {
    const uniqueEmail = `test${Date.now()}@auron.dev`;
    const uniqueUsername = `testuser${Date.now()}`;

    await page.goto('/register');

    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="firstName"]', TEST_USER.firstName);
    await page.fill('input[name="lastName"]', TEST_USER.lastName);

    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Verify user is logged in
    await expect(page.locator(`text=/${uniqueUsername}/i`)).toBeVisible({ timeout: 5000 });
  });

  test('should successfully log in an existing user', async ({ page }) => {
    // This test assumes a user already exists in the database
    // In a real scenario, you'd set up test users in a beforeAll hook

    await page.goto('/login');

    // Use test credentials
    await page.fill('input[name="email"]', 'admin@auron.dev');
    await page.fill('input[name="password"]', 'admin123');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should successfully log out', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@auron.dev');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Then logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
    await page.goto('/labs');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@auron.dev');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be logged in and on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Two-Factor Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should enable 2FA from profile page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@auron.dev');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Navigate to profile
    await page.goto('/profile');

    // Find and click enable 2FA button
    const enable2FAButton = page.locator('button:has-text("Enable")').first();
    await enable2FAButton.click();

    // Should show QR code dialog
    await expect(page.locator('text=/qr code|authenticator/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show 2FA input after login when enabled', async ({ page }) => {
    // This test assumes a user with 2FA enabled exists
    // In production, you'd need to set this up in test fixtures

    await page.goto('/login');
    await page.fill('input[name="email"]', '2fa-user@auron.dev');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should show 2FA code input
    await expect(page.locator('input[name="twoFactorCode"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Password Reset', () => {
  test('should display password reset page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1, h2, h4').getByText(/forgot|reset/i)).toBeVisible();
  });

  test('should send password reset email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[name="email"]', TEST_USER.email);
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/sent|check your email/i')).toBeVisible({ timeout: 5000 });
  });
});
