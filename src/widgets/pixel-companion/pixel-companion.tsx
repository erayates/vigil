import type { FocusPhase } from '@/entities/focus-session/model/types';

interface PixelCompanionProps {
  phase: FocusPhase;
  size?: 'small' | 'large';
}

const stateFile: Record<FocusPhase, string> = {
  idle: 'idle',
  preparing: 'preparing',
  focusing: 'focus',
  paused: 'paused',
  break: 'break',
  complete: 'complete',
  abandoned: 'idle',
  debrief: 'complete',
};

export function PixelCompanion({ phase, size = 'large' }: PixelCompanionProps) {
  const spriteName = stateFile[phase];
  return (
    <div
      className={`legionary-sprite legionary-sprite--${size} legionary-sprite--${spriteName}`}
      role="img"
      aria-label={`Roman companion is ${phase}`}
    />
  );
}
