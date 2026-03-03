import { expect, test } from '@playwright/test';

const projectsResponse = [
  {
    id: 1,
    title: 'Project One',
    content: 'A short description for project one.',
    previewImageUrl: 'https://images.example.com/project-1.jpg',
    externalUrl: 'https://example.com/project-1',
    likeCount: 4,
    likedByCurrentUser: false
  },
  {
    id: 2,
    title: 'Project Two',
    content: 'A short description for project two.',
    previewImageUrl: 'https://images.example.com/project-2.jpg',
    externalUrl: 'https://example.com/project-2',
    likeCount: 8,
    likedByCurrentUser: false
  },
  {
    id: 3,
    title: 'Project Three',
    content: 'A short description for project three.',
    previewImageUrl: 'https://images.example.com/project-3.jpg',
    externalUrl: 'https://example.com/project-3',
    likeCount: 15,
    likedByCurrentUser: true
  },
  {
    id: 4,
    title: 'Project Four',
    content: 'A short description for project four.',
    previewImageUrl: 'https://images.example.com/project-4.jpg',
    externalUrl: 'https://example.com/project-4',
    likeCount: 16,
    likedByCurrentUser: false
  }
];

test.describe('home page', () => {
  test('@smoke renders hero and loaded project cards', async ({ page }) => {
    await page.route('**/api/public/posts/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projectsResponse)
      });
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'lukerykta.io' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Learn more' })).toBeVisible();
    await expect(page.locator('.projects-grid:not(.projects-grid--skeleton) .project-card')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Project One' })).toBeVisible();
  });
});
