// 10 rank thresholds (streak required to reach each rank)
const THRESHOLDS = [0, 3, 7, 14, 21, 30, 40, 50, 65, 100];

/**
 * Returns rank info based on streak count.
 * { index, name, current, next, progress (0–1) }
 */
export function getRank(streak, ranks) {
  let index = 0;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (streak >= THRESHOLDS[i]) { index = i; break; }
  }

  const isMax = index === THRESHOLDS.length - 1;
  const current = THRESHOLDS[index];
  const next = isMax ? null : THRESHOLDS[index + 1];
  const progress = isMax ? 1 : (streak - current) / (next - current);

  return {
    index,
    name: ranks[index],
    nextName: isMax ? null : ranks[index + 1],
    progress,
    streak,
    next,
    isMax,
  };
}
