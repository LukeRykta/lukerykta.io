import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('@smoke renders hero and footer links', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('a.nav-link', { hasText: 'Home' })).toHaveClass(/is-active/);
    await expect(page.getByRole('heading', { name: 'Luke Ryktarsyk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Learn more' })).toBeVisible();
    await expect(page.getByTestId('hero-cursor')).toBeVisible();

    await page.getByTestId('site-footer').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('site-footer')).toBeVisible();
    await expect(page.getByTestId('footer-linkedin')).toHaveAttribute(
      'href',
      /linkedin\.com\/in\/luke-ryktarsyk/
    );
    await expect(page.getByTestId('footer-github')).toHaveAttribute(
      'href',
      /github\.com\/LukeRykta/
    );
    await expect(page.getByTestId('footer-devpost')).toHaveAttribute(
      'href',
      /devpost\.com\/LukeRykta/
    );
  });

  test('renders footer content in tall portrait viewports', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 2800 });
    await page.goto('/');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.getByText(/Building software that scales and stays reliable\./)).toBeVisible();
    await expect(page.getByTestId('footer-linkedin')).toBeVisible();
  });
});
