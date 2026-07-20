/**
 * The watch ticks a few times a second. A pause far longer than that means the
 * clock ran on without us — the machine slept, or the process was frozen.
 *
 * This is a heuristic, so it is deliberately safe: a detected gap only *offers*
 * the user a choice. Ignoring the offer keeps the existing behaviour (the time
 * counts as focus), so a false positive can never silently remove focus time.
 */
export const SUSPEND_GAP_THRESHOLD_MS = 120_000; // 2 minutes

export function detectSuspendGap(
  lastTickMs: number | null,
  nowMs: number,
  thresholdMs: number = SUSPEND_GAP_THRESHOLD_MS,
): number | null {
  if (lastTickMs === null) return null;
  const gap = nowMs - lastTickMs;
  return gap >= thresholdMs ? gap : null;
}
