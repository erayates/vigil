import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompanionStage } from './companion-stage';

const { show, setClickThrough } = vi.hoisted(() => ({
  show: vi.fn(),
  setClickThrough: vi.fn(),
}));

vi.mock('@/shared/lib/native-bridge', () => ({
  nativeBridge: { showCompanion: show, setCompanionClickThrough: setClickThrough },
}));

describe('CompanionStage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('recovers a stuck companion by showing it and disabling click-through', () => {
    render(<CompanionStage />);

    fireEvent.click(screen.getByRole('button', { name: /recall companion/i }));

    expect(show).toHaveBeenCalledTimes(1);
    expect(setClickThrough).toHaveBeenCalledWith(false);
  });
});
