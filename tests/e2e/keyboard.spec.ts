import { expect, test, type Page } from '@playwright/test';

// Idle with a mission set so the Start control is enabled (and therefore in the
// tab order). Shape/version match the useFocusStore persist config.
const seededState = {
  state: {
    missionTitle: 'Ship the vertical slice',
    victoryCondition: '',
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

interface FocusInfo {
  id: string | null;
  label: string | null;
  text: string;
  disabled: boolean;
}

async function walkTabOrder(page: Page, steps: number): Promise<Array<FocusInfo | null>> {
  const seq: Array<FocusInfo | null> = [];
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate<FocusInfo | null>(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      return {
        id: a.id || null,
        label: a.getAttribute('aria-label'),
        text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24),
        disabled: a.hasAttribute('disabled'),
      };
    });
    seq.push(info);
  }
  return seq;
}

test('keyboard tab order preserves visual meaning and skips disabled roadmap controls', async ({
  page,
}) => {
  await page.addInitScript(
    (state) => window.localStorage.setItem('vigil-focus-state', JSON.stringify(state)),
    seededState,
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();

  const seq = await walkTabOrder(page, 20);
  const keys = seq.map((e) => (e ? e.id || e.label || e.text : ''));

  const missionIdx = keys.findIndex((k) => k === 'mission-title');
  const startIdx = keys.findIndex((k) => /Start/.test(k));

  // Both essential controls are keyboard reachable.
  expect(missionIdx).toBeGreaterThanOrEqual(0);
  expect(startIdx).toBeGreaterThanOrEqual(0);
  // The mission (left column) is reached before Start (centre) — visual order holds.
  expect(missionIdx).toBeLessThan(startIdx);
  // Disabled roadmap controls (accessible name carries "… v0.2.0") never take focus.
  expect(keys.some((k) => /v0\.2\.0/.test(k))).toBe(false);
  expect(seq.some((e) => e?.disabled)).toBe(false);
});
