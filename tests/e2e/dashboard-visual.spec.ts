import { expect, test } from '@playwright/test';

// Deterministic seed for the useFocusStore persist key: idle phase, a fixed
// mission, empty history. No ticking timer and no date-dependent output, so the
// dashboard renders identically every run. Shape/version must match the store's
// persist config (name 'vigil-focus-state', version 2).
const seededState = {
  state: {
    missionTitle: 'Ship the vertical slice',
    victoryCondition: 'All P1 acceptance tests pass',
    modeId: 'standard-watch',
    customDurationMinutes: 40,
    phase: 'idle',
    plannedDurationSeconds: 1500,
    remainingSeconds: 1500,
    startedAtMs: null,
    pauseStartedAtMs: null,
    totalPausedMs: 0,
    history: [],
  },
  version: 2,
};

test('main dashboard is visually stable', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-01T09:00:00Z'));
  await page.addInitScript((state) => {
    window.localStorage.setItem('vigil-focus-state', JSON.stringify(state));
  }, seededState);

  await page.goto('/');

  // Anchor on stable, rehydrated content before capturing.
  await expect(page.getByRole('heading', { name: 'Focus Time' })).toBeVisible();
  await expect(page.getByLabel('Active mission')).toHaveValue('Ship the vertical slice');

  await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
});
