import { expect, test } from '@playwright/test';

import { mockDashboardApis } from './helpers/dashboard-api';

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardApis(page);
  });

  test('renders overview statistics for an admin session', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Overview' })).toHaveClass(/is-active/);
    await expect(page.getByRole('heading', { name: 'Site statistics' })).toBeVisible();
    await expect(page.getByText('Total users')).toBeVisible();
    const visitsCard = page.locator('.stat-card').filter({
      has: page.getByText('User Visits', { exact: true })
    }).first();

    await expect(page.getByText('User Visits', { exact: true })).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
    await expect(visitsCard).toContainText('421');
    await page.getByRole('button', { name: 'View cadence' }).click();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page.getByText('This month', { exact: true })).toBeVisible();
    await expect(page.getByText('This year', { exact: true })).toBeVisible();
    await expect(page.getByText('241')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top routes' })).toBeVisible();
    await expect(page.getByText('/projects')).toBeVisible();
    await expect(page.getByText('91 unique visitors')).toBeVisible();
  });

  test('paginates and sorts 100 unique visitors in the users directory', async ({ page }) => {
    await page.goto('/dashboard/users');

    await expect(page.getByRole('heading', { name: 'Registered accounts' })).toBeVisible();
    await expect(page.getByText('Showing 1-10 of 100')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('Visitor 100');
    await expect(page.locator('tbody tr').first()).toContainText('visitor100@example.com');
    await expect(page.locator('tbody tr').first()).toContainText('102');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Showing 11-20 of 100')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('Visitor 090');

    await page.getByRole('group', { name: 'Rows per page' }).getByRole('button', { name: '25' }).click();
    await expect(page.getByText('Showing 1-25 of 100')).toBeVisible();
    await expect(page.getByRole('button', { name: '4' })).toBeVisible();

    await page.locator('th').filter({ hasText: 'Visits' }).getByRole('button').click();
    await expect(page.getByText('Sorted by visits, descending')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('102');

    await page.locator('th').filter({ hasText: 'Last Seen' }).getByRole('button').click();
    await expect(page.getByText('Sorted by last seen, descending')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('Visitor 100');

    await page.locator('th').filter({ hasText: 'Last Seen' }).getByRole('button').click();
    await expect(page.getByText('Sorted by last seen, ascending')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('Visitor 001');
    await expect(page.locator('tbody tr').nth(24)).toContainText('Visitor 025');
  });
});
