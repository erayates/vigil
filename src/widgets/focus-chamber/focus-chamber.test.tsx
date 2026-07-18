import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '@/entities/focus-session/model/types';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { FocusChamber } from './focus-chamber';

const { hide } = vi.hoisted(() => ({ hide: vi.fn() }));

vi.mock('@/shared/lib/native-bridge', () => ({
  nativeBridge: { showCompanion: vi.fn(), hideCompanion: hide },
}));

function finishedRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'a',
    missionTitle: 'Ship the debrief',
    victoryCondition: '',
    plannedDurationSeconds: 1500,
    focusedDurationSeconds: 1500,
    completedAtIso: new Date().toISOString(),
    outcome: 'completed',
    ...overrides,
  };
}

describe('FocusChamber debrief flow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  beforeEach(() => {
    window.localStorage.clear();
    useFocusStore.setState({
      phase: 'complete',
      missionTitle: 'Ship the debrief',
      history: [finishedRecord()],
    });
  });

  it('opens the debrief from a finished watch and records the fields', () => {
    render(<FocusChamber />);

    fireEvent.click(screen.getByRole('button', { name: /debrief/i }));
    fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'Shipped it' } });
    fireEvent.change(screen.getByLabelText('Next action'), { target: { value: 'Write tests' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));

    const state = useFocusStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.history[0]?.result).toBe('Shipped it');
    expect(state.history[0]?.nextAction).toBe('Write tests');
    expect(state.history[0]?.blocker).toBeUndefined(); // left blank -> absent
    expect(hide).toHaveBeenCalled();
  });

  it('skips the debrief without attaching fields', () => {
    render(<FocusChamber />);

    fireEvent.click(screen.getByRole('button', { name: /debrief/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    const state = useFocusStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.history[0]?.result).toBeUndefined();
    expect(hide).toHaveBeenCalled();
  });
});
