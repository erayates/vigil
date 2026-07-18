import { beforeEach, describe, expect, it } from 'vitest';
import { useCompanionPrefsStore } from './use-companion-prefs-store';

describe('useCompanionPrefsStore (browser mode)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useCompanionPrefsStore.setState({ side: 'right', scale: 1, opacity: 1 });
  });

  it('sets side, scale and opacity', () => {
    useCompanionPrefsStore.getState().setPrefs('left', 1.5, 0.6);
    const { side, scale, opacity } = useCompanionPrefsStore.getState();
    expect(side).toBe('left');
    expect(scale).toBe(1.5);
    expect(opacity).toBe(0.6);
  });

  it('clamps scale and opacity to safe ranges', () => {
    useCompanionPrefsStore.getState().setPrefs('right', 5, 0.1);
    const { scale, opacity } = useCompanionPrefsStore.getState();
    expect(scale).toBe(2); // clamped from 5
    expect(opacity).toBe(0.3); // clamped from 0.1
  });
});
