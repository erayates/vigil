export type FocusModeId =
  'quick-drill' | 'standard-watch' | 'deep-formation' | 'long-march' | 'custom';

export type FocusPhase =
  'idle' | 'preparing' | 'focusing' | 'paused' | 'break' | 'complete' | 'abandoned';

export interface FocusMode {
  id: FocusModeId;
  label: string;
  durationSeconds: number;
  description: string;
}

export interface SessionRecord {
  id: string;
  missionTitle: string;
  victoryCondition: string;
  plannedDurationSeconds: number;
  focusedDurationSeconds: number;
  completedAtIso: string;
  outcome: 'completed' | 'abandoned';
}
