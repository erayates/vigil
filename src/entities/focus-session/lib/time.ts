export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

/** Spoken form of a duration, for accessible names. "25 minutes", "1 minute 30 seconds". */
export function describeDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (seconds > 0 || minutes === 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function calculateRemainingSeconds(input: {
  plannedDurationSeconds: number;
  startedAtMs: number;
  nowMs: number;
  totalPausedMs: number;
}): number {
  const elapsedActiveMs = Math.max(0, input.nowMs - input.startedAtMs - input.totalPausedMs);
  return Math.max(0, Math.ceil(input.plannedDurationSeconds - elapsedActiveMs / 1000));
}
