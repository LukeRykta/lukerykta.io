import { expect, test } from '@playwright/test';

test.describe('projects page', () => {
  test('@smoke renders and navigates animated sections', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.locator('a.nav-link', { hasText: 'Projects' })).toHaveClass(/is-active/);
    await expect(page.getByTestId('projects-page')).toBeVisible();
    await expect(page.getByTestId('projects-heading-0')).toBeVisible();
    await page.waitForTimeout(1300);

    await page.mouse.wheel(0, 1200);
    await expect(page.getByTestId('projects-heading-1')).toBeVisible();

    await page.mouse.wheel(0, -1200);
    await expect(page.getByTestId('projects-heading-0')).toBeVisible();
  });
});
