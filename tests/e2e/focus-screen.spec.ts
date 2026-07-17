import { expect, test } from '@playwright/test';

test('focus dashboard exposes the primary mission and timer controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Focus Time' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Today's Campaign" })).toBeVisible();

  const startButton = page.getByRole('button', { name: 'Start' });
  await expect(startButton).toBeDisabled();

  await page.getByLabel('Active mission').fill('Ship the local vertical slice');
  await expect(startButton).toBeEnabled();
  await expect(page.getByText('Ship the local vertical slice')).toBeVisible();
});
