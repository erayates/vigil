import { beforeEach, describe, expect, it } from 'vitest';
import { useDoctrineStore } from './use-doctrine-store';

describe('useDoctrineStore (browser mode)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDoctrineStore.setState({ shortBreakMinutes: 5, longBreakMinutes: 15 });
  });

  it('updates break lengths', () => {
    useDoctrineStore.getState().setDoctrine(3, 20);
    expect(useDoctrineStore.getState().shortBreakMinutes).toBe(3);
    expect(useDoctrineStore.getState().longBreakMinutes).toBe(20);
  });

  it('clamps out-of-range values', () => {
    useDoctrineStore.getState().setDoctrine(0, 999);
    expect(useDoctrineStore.getState().shortBreakMinutes).toBe(1);
    expect(useDoctrineStore.getState().longBreakMinutes).toBe(120);
  });
});
