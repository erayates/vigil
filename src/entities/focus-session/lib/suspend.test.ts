import { describe, expect, it } from 'vitest';
import { SUSPEND_GAP_THRESHOLD_MS, detectSuspendGap } from './suspend';

describe('detectSuspendGap', () => {
  it('ignores normal tick intervals', () => {
    expect(detectSuspendGap(1_000, 1_250)).toBeNull();
    expect(detectSuspendGap(1_000, 1_000 + SUSPEND_GAP_THRESHOLD_MS - 1)).toBeNull();
  });

  it('reports the gap once the threshold is reached', () => {
    const gap = detectSuspendGap(1_000, 1_000 + SUSPEND_GAP_THRESHOLD_MS);
    expect(gap).toBe(SUSPEND_GAP_THRESHOLD_MS);
  });

  it('reports a long sleep', () => {
    const thirtyMinutes = 30 * 60_000;
    expect(detectSuspendGap(0, thirtyMinutes)).toBe(thirtyMinutes);
  });

  it('reports nothing before the first tick', () => {
    expect(detectSuspendGap(null, 999_999)).toBeNull();
  });
});
