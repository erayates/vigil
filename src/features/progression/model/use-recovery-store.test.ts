import { beforeEach, describe, expect, it } from 'vitest';
import { useRecoveryStore } from './use-recovery-store';

describe('useRecoveryStore (browser mode)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useRecoveryStore.setState({ recoveryDays: [] });
  });

  it('toggles a recovery day on and off', () => {
    useRecoveryStore.getState().toggleDay('2026-07-18');
    expect(useRecoveryStore.getState().recoveryDays).toEqual(['2026-07-18']);
    useRecoveryStore.getState().toggleDay('2026-07-18');
    expect(useRecoveryStore.getState().recoveryDays).toEqual([]);
  });
});
