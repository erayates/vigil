import { describe, expect, it } from 'vitest';
import { calculateRank } from './rank';

describe('calculateRank', () => {
  it('starts at Tiro with no points', () => {
    const r = calculateRank(0);
    expect(r.name).toBe('Tiro');
    expect(r.romanNumeral).toBe('I');
    expect(r.index).toBe(0);
    expect(r.pointsForNext).toBe(50);
  });

  it('advances to the highest reached threshold', () => {
    const r = calculateRank(200); // past Immunis (150), before Decanus (350)
    expect(r.name).toBe('Immunis');
    expect(r.index).toBe(2);
    expect(r.pointsIntoRank).toBe(50); // 200 - 150
    expect(r.pointsForNext).toBe(150); // 350 - 200
  });

  it('caps at the top rank with no next threshold', () => {
    const r = calculateRank(99999);
    expect(r.name).toBe('Primus Pilus');
    expect(r.pointsForNext).toBeNull();
  });
});
