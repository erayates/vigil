import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { CompanionOverlay } from './companion-overlay';

describe('CompanionOverlay', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.clear();
    // startedAtMs stays null so the display tick is a no-op in tests.
    useFocusStore.setState({
      phase: 'idle',
      missionTitle: '',
      remainingSeconds: 1500,
      startedAtMs: null,
      pauseStartedAtMs: null,
    });
  });

  it('reflects the focusing state with pause and complete controls', () => {
    useFocusStore.setState({ phase: 'focusing', missionTitle: 'Ship the slice' });
    render(<CompanionOverlay />);

    expect(screen.getByRole('img', { name: 'Roman companion is focusing' })).toBeInTheDocument();
    expect(screen.getByText('Ship the slice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause focus session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete focus session' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resume focus session' })).toBeNull();
  });

  it('reflects the paused state with resume and complete controls', () => {
    useFocusStore.setState({ phase: 'paused', missionTitle: 'Ship the slice' });
    render(<CompanionOverlay />);

    expect(screen.getByRole('img', { name: 'Roman companion is paused' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume focus session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete focus session' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause focus session' })).toBeNull();
  });

  it('shows no session controls when idle', () => {
    render(<CompanionOverlay />);

    expect(screen.getByRole('img', { name: 'Roman companion is idle' })).toBeInTheDocument();
    expect(screen.getByText('Awaiting orders')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause focus session' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Complete focus session' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resume focus session' })).toBeNull();
  });
});
