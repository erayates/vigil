import type { FocusMode } from './types';

export const focusModes: readonly FocusMode[] = [
  {
    id: 'quick-drill',
    label: 'Quick Drill',
    durationSeconds: 15 * 60,
    description: 'Reduce resistance and begin a small concrete action.',
  },
  {
    id: 'standard-watch',
    label: 'Standard Watch',
    durationSeconds: 25 * 60,
    description: 'A classic, contained focus interval.',
  },
  {
    id: 'deep-formation',
    label: 'Deep Formation',
    durationSeconds: 50 * 60,
    description: 'Default formation for code, design and research.',
  },
  {
    id: 'long-march',
    label: 'Long March',
    durationSeconds: 90 * 60,
    description: 'Extended deep work with deliberate recovery afterward.',
  },
] as const;
