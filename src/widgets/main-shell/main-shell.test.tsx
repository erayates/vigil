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

    expect(screen.getByLabelText('50 minutes remaining')).toHaveTextContent('50:00');
  });

  it('gives every control an accessible name', () => {
    render(<MainShell />);

    // A name filter of /\S/ keeps only controls with a computed accessible
    // name, so any control that grows an icon and loses its label fails here.
    for (const role of ['button', 'radio', 'textbox'] as const) {
      const named = screen.getAllByRole(role, { name: /\S/ });
      expect(screen.getAllByRole(role)).toHaveLength(named.length);
    }
  });

  it('announces the session phase without a per-second live region', () => {
    render(<MainShell />);

    // The seconds-updating timer must not sit inside a live region.
    expect(screen.getByText('25:00').closest('[aria-live]')).toBeNull();
    // A dedicated status region carries phase changes instead.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says plainly that unbuilt controls are unavailable, without promising a version', () => {
    render(<MainShell />);

    for (const name of [/Statistics — not available yet/i, /Settings — not available yet/i]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    // A version promise in a label rots the moment the version ships.
    expect(screen.queryByRole('button', { name: /available in v\d/i })).toBeNull();
  });

  it('starts a recovery break from the header break tab', () => {
    render(<MainShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Short Break' }));

    expect(useFocusStore.getState().phase).toBe('break');
  });

  it('offers an abandon control during a session that grants no completed record', () => {
    useFocusStore.setState({ phase: 'focusing', missionTitle: 'Ship it', startedAtMs: null });
    render(<MainShell />);

    fireEvent.click(screen.getByRole('button', { name: /abandon watch/i }));

    expect(useFocusStore.getState().phase).toBe('abandoned');
    expect(useFocusStore.getState().history).toHaveLength(0);
  });
});
