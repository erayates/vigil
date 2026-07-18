import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { MainShell } from './main-shell';

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

  it('announces the session phase without a per-second live region', () => {
    render(<MainShell />);

    // The seconds-updating timer must not sit inside a live region.
    expect(screen.getByText('25:00').closest('[aria-live]')).toBeNull();
    // A dedicated status region carries phase changes instead.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('names the target version on disabled roadmap controls', () => {
    render(<MainShell />);

    for (const name of [/Short Break.*v0\.2\.0/i, /Settings.*v0\.2\.0/i, /Skip.*v0\.2\.0/i]) {
      const control = screen.getByRole('button', { name });
      expect(control).toBeDisabled();
    }
  });

  it('offers an abandon control during a session that grants no completed record', () => {
    useFocusStore.setState({ phase: 'focusing', missionTitle: 'Ship it', startedAtMs: null });
    render(<MainShell />);

    fireEvent.click(screen.getByRole('button', { name: /abandon watch/i }));

    expect(useFocusStore.getState().phase).toBe('abandoned');
    expect(useFocusStore.getState().history).toHaveLength(0);
  });
});
