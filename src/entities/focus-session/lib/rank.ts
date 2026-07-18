export interface Rank {
  name: string;
  romanNumeral: string;
  index: number;
  pointsIntoRank: number;
  pointsForNext: number | null; // null at the top rank
}

// Roman ranks earned by accumulated Disciplina points. Thresholds only rise, and
// points never decay, so a rank can only advance — never demote on a missed day.
const RANKS = [
  { name: 'Tiro', at: 0 },
  { name: 'Miles', at: 50 },
  { name: 'Immunis', at: 150 },
  { name: 'Decanus', at: 350 },
  { name: 'Tesserarius', at: 700 },
  { name: 'Optio', at: 1200 },
  { name: 'Centurio', at: 2000 },
  { name: 'Primus Pilus', at: 3500 },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export function calculateRank(points: number): Rank {
  const index = RANKS.reduce((highest, rank, i) => (points >= rank.at ? i : highest), 0);
  const current = RANKS[index] ?? RANKS[0] ?? { name: 'Tiro', at: 0 };
  const next = RANKS[index + 1];
  return {
    name: current.name,
    romanNumeral: ROMAN[index] ?? `${index + 1}`,
    index,
    pointsIntoRank: points - current.at,
    pointsForNext: next ? next.at - points : null,
  };
}
