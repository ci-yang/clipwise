import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login page with Google sign-in button', async ({ page }) => {
      await page.goto('/login');

      // Check page title
      await expect(page).toHaveTitle(/登入|Clipwise/);

      // Check for Google login button
      const googleButton = page.getByRole('button', { name: /Google|登入/ });
      await expect(googleButton).toBeVisible();
    });

    test('should redirect to login when accessing protected route while unauthenticated', async ({
      page,
    }) => {
      await page.goto('/bookmarks');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Landing Page', () => {
    test('should show CTA button when not logged in', async ({ page }) => {
      await page.goto('/');

      // Check for call-to-action button
      const ctaButton = page.getByRole('link', { name: /開始使用|免費試用|登入/ });
      await expect(ctaButton).toBeVisible();
    });
  });

  test.describe('User Menu', () => {
    // Note: These tests require mocked authentication
    // In real E2E, we would use test fixtures or bypass OAuth

    test.skip('should display user avatar when logged in', async ({ page }) => {
      // This test would require authentication setup
      await page.goto('/bookmarks');

      const userAvatar = page.getByTestId('user-avatar');
      await expect(userAvatar).toBeVisible();
    });

    test.skip('should show logout option in user menu', async ({ page }) => {
      // This test would require authentication setup
      await page.goto('/bookmarks');

      // Click user menu
      await page.getByTestId('user-menu-trigger').click();

      // Check for logout option
      const logoutButton = page.getByRole('menuitem', { name: /登出/ });
      await expect(logoutButton).toBeVisible();
    });
  });
});
