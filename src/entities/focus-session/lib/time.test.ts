import { describe, expect, it } from 'vitest';
import { calculateRemainingSeconds, describeDuration, formatDuration } from './time';

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(1500)).toBe('25:00');
  });

  it('formats hours when required', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });
});

describe('describeDuration', () => {
  it('speaks whole minutes without trailing zero seconds', () => {
    expect(describeDuration(1500)).toBe('25 minutes');
  });

  it('singularises and keeps both parts when both are present', () => {
    expect(describeDuration(61)).toBe('1 minute 1 second');
  });

  it('still says something at zero', () => {
    expect(describeDuration(0)).toBe('0 seconds');
  });
});

describe('calculateRemainingSeconds', () => {
  it('uses timestamps and excludes paused duration', () => {
    expect(
      calculateRemainingSeconds({
        plannedDurationSeconds: 1500,
        startedAtMs: 1_000,
        nowMs: 61_000,
        totalPausedMs: 30_000,
      }),
    ).toBe(1470);
  });
});
