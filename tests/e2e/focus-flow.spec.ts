import { expect, test } from '@playwright/test';

// Critical happy path in browser (local) mode: mission -> start -> focusing ->
// pause -> resume -> the watch elapses and auto-completes. Persistence and
// restart recovery are Tauri-only (they need the Rust core) and are exercised by
// the Rust integration tests + a tauri dev walkthrough, not this browser run.
test('a full watch runs from mission through pause/resume to completion', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-07-18T09:00:00Z') });
  await page.goto('/');

  await page.getByLabel('Active mission').fill('Ship the vertical slice');
  await page.getByRole('button', { name: 'Start' }).click();

  // Preparing -> Focusing after the 900ms cosmetic delay.
  await page.clock.fastForward(1000);
  await expect(page.getByText('Stay focused. Build your empire.')).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Formation held. Resume when ready.')).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText('Stay focused. Build your empire.')).toBeVisible();

  // Let the 25-minute standard watch elapse; the timer auto-completes.
  await page.clock.fastForward(26 * 60 * 1000);
  await expect(page.getByText('Watch complete. Debrief the result.')).toBeVisible();

  // Debrief: open it, log the outcome, record, and return to idle.
  await page.getByRole('button', { name: 'Debrief' }).click();
  await page.getByLabel('Result').fill('Shipped the vertical slice');
  await page.getByLabel('Next action').fill('Start the daily-use alpha');
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Define one mission, then hold the line.')).toBeVisible();
});
