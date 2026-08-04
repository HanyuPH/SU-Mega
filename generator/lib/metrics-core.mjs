import { forEachCombination, gameKey, pairKey, quadrupleKey, tripleKey } from "./combinations.mjs";

function populationStandardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function computeMetrics(games, options = {}) {
  const universeSize = options.universeSize ?? 60;
  const numbersPerGame = options.numbersPerGame ?? 6;
  const base = universeSize + 1;
  const pairCounts = new Uint16Array(base * base);
  const frequency = new Uint16Array(base);
  const tripleCounts = new Map();
  const quadrupleCounts = new Map();
  const gameCounts = new Map();
  let invalidGameSizes = 0;
  let invalidNumbers = 0;
  let repeatedNumbersInsideGames = 0;

  for (const originalGame of games) {
    const game = [...originalGame].sort((a, b) => a - b);
    if (game.length !== numbersPerGame) invalidGameSizes += 1;
    const unique = new Set(game);
    if (unique.size !== game.length) repeatedNumbersInsideGames += 1;
    for (const number of game) {
      if (!Number.isInteger(number) || number < 1 || number > universeSize) invalidNumbers += 1;
      else frequency[number] += 1;
    }
    const key = gameKey(game);
    gameCounts.set(key, (gameCounts.get(key) ?? 0) + 1);
    if (unique.size === game.length && game.length === numbersPerGame) {
      forEachCombination(game, 2, ([a, b]) => {
        pairCounts[pairKey(a, b, universeSize)] += 1;
      });
      forEachCombination(game, 3, ([a, b, c]) => {
        const key3 = tripleKey(a, b, c, universeSize);
        tripleCounts.set(key3, (tripleCounts.get(key3) ?? 0) + 1);
      });
      forEachCombination(game, 4, ([a, b, c, d]) => {
        const key4 = quadrupleKey(a, b, c, d, universeSize);
        quadrupleCounts.set(key4, (quadrupleCounts.get(key4) ?? 0) + 1);
      });
    }
  }

  const allPairCounts = [];
  for (let a = 1; a <= universeSize; a += 1) {
    for (let b = a + 1; b <= universeSize; b += 1) {
      allPairCounts.push(pairCounts[pairKey(a, b, universeSize)]);
    }
  }

  let maximumIntersection = 0;
  for (let i = 0; i < games.length; i += 1) {
    const left = new Set(games[i]);
    for (let j = i + 1; j < games.length; j += 1) {
      let intersection = 0;
      for (const number of games[j]) if (left.has(number)) intersection += 1;
      if (intersection > maximumIntersection) maximumIntersection = intersection;
    }
  }

  const frequencies = Array.from(frequency.slice(1));
  const duplicatedGames = [...gameCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const repeatedQuadruples = [...quadrupleCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const repeatedTriples = [...tripleCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);

  return {
    games: games.length,
    uniqueGames: gameCounts.size,
    duplicatedGames,
    invalidGameSizes,
    invalidNumbers,
    repeatedNumbersInsideGames,
    pairs: {
      totalPossible: allPairCounts.length,
      covered: allPairCounts.filter((count) => count > 0).length,
      missing: allPairCounts.filter((count) => count === 0).length,
      multiplicityMinimum: Math.min(...allPairCounts),
      multiplicityMaximum: Math.max(...allPairCounts),
      multiplicityMean: allPairCounts.reduce((sum, count) => sum + count, 0) / allPairCounts.length,
      multiplicityStandardDeviation: populationStandardDeviation(allPairCounts),
    },
    triples: {
      distinct: tripleCounts.size,
      repeatedOccurrences: repeatedTriples,
    },
    quadruples: {
      distinct: quadrupleCounts.size,
      repeatedOccurrences: repeatedQuadruples,
    },
    maximumIntersection,
    frequencies: {
      minimum: Math.min(...frequencies),
      maximum: Math.max(...frequencies),
      mean: frequencies.reduce((sum, count) => sum + count, 0) / frequencies.length,
      standardDeviation: populationStandardDeviation(frequencies),
      byNumber: Object.fromEntries(frequencies.map((count, index) => [String(index + 1).padStart(2, "0"), count])),
    },
  };
}
