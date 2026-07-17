import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useFocusStore } from '@/features/focus-session/model/useFocusStore';
import { MainShell } from './MainShell';

const initialState = {
  missionTitle: '',
  victoryCondition: '',
  modeId: 'standard-watch' as const,
  customDurationMinutes: 40,
  phase: 'idle' as const,
  plannedDurationSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  startedAtMs: null,
  pauseStartedAtMs: null,
  totalPausedMs: 0,
  history: [],
};

describe('MainShell', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.clear();
    useFocusStore.setState(initialState);
  });

  it('keeps the primary action disabled until one active mission is defined', () => {
    render(<MainShell />);

    const startButton = screen.getByRole('button', { name: 'Start' });
    expect(startButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Active mission'), {
      target: { value: 'Complete the focus vertical slice' },
    });

    expect(startButton).toBeEnabled();
    expect(screen.getByText('Complete the focus vertical slice')).toBeInTheDocument();
  });

  it('updates the timer when a different focus formation is selected', () => {
    render(<MainShell />);

    fireEvent.click(screen.getByRole('radio', { name: 'Deep Formation, 50 minutes' }));

    expect(screen.getByLabelText('3000 seconds remaining')).toHaveTextContent('50:00');
  });
});
