import { forEachCombination, gameKey, pairKey, quadrupleKey, tripleKey } from "./combinations.mjs";
import { SeededRng } from "./rng.mjs";

function randomGame(rng, universeSize, numbersPerGame, forcedNumbers = []) {
  const selected = new Set(forcedNumbers);
  while (selected.size < numbersPerGame) selected.add(1 + rng.integer(universeSize));
  return [...selected].sort((a, b) => a - b);
}

function lexicographicallySmaller(left, right) {
  return left.key < right.key;
}

function isBetterCandidate(candidate, currentBest) {
  if (!currentBest) return true;
  const descending = ["score", "newPairs", "newTriples"];
  for (const field of descending) {
    if (candidate[field] !== currentBest[field]) return candidate[field] > currentBest[field];
  }
  const ascending = ["maximumFrequencyAfter", "maximumPairAfter", "frequencySum", "pairMultiplicitySum"];
  for (const field of ascending) {
    if (candidate[field] !== currentBest[field]) return candidate[field] < currentBest[field];
  }
  return lexicographicallySmaller(candidate, currentBest);
}

export function generatePortfolio(config, hooks = {}) {
  const startNs = process.hrtime.bigint();
  const universeSize = config.universeSize;
  const numbersPerGame = config.numbersPerGame;
  const targetGames = config.targetGames;
  const base = universeSize + 1;
  const rng = new SeededRng(config.seed);
  const games = [];
  const gameSet = new Set();
  const usedQuadruples = new Set();
  const usedTriples = new Set();
  const pairCounts = new Uint16Array(base * base);
  const frequency = new Uint16Array(base);
  const phaseAccepted = { A: 0, B: 0, C: 0 };
  const rejectionReasons = {
    invalidGameSize: 0,
    numberOutsideUniverse: 0,
    repeatedNumberInsideCandidate: 0,
    duplicateGame: 0,
    repeatedQuadrupleOrIntersectionAboveThree: 0,
    noNewPairDuringPhaseB: 0,
    lowerScore: 0,
  };
  let candidatesEvaluated = 0;
  let uncoveredPairs = listUncoveredPairs();
  const phaseTransitions = [];
  let previousPhase = null;

  function listUncoveredPairs() {
    const missing = [];
    for (let a = 1; a <= universeSize; a += 1) {
      for (let b = a + 1; b <= universeSize; b += 1) {
        if (pairCounts[pairKey(a, b, universeSize)] === 0) missing.push([a, b]);
      }
    }
    return missing;
  }

  function resolvePhase() {
    if (games.length < config.phases.A.coreGames) return "A";
    if (uncoveredPairs.length > 0) return "B";
    return "C";
  }

  function constructCandidate(phase) {
    const settings = config.phases[phase];
    const shouldForcePair = uncoveredPairs.length > 0 && rng.next() < settings.forcedPairProbability;
    if (!shouldForcePair) return randomGame(rng, universeSize, numbersPerGame);

    const primaryPair = rng.pick(uncoveredPairs);
    const forced = [...primaryPair];
    if (rng.next() < settings.multiPairProbability) {
      for (let attempt = 0; attempt < settings.multiPairAttempts && forced.length < numbersPerGame; attempt += 1) {
        const pair = rng.pick(uncoveredPairs);
        for (const number of pair) {
          if (!forced.includes(number) && forced.length < numbersPerGame) forced.push(number);
        }
      }
    }
    return randomGame(rng, universeSize, numbersPerGame, forced);
  }

  function evaluateCandidate(game, phase) {
    candidatesEvaluated += 1;
    if (game.length !== numbersPerGame) {
      rejectionReasons.invalidGameSize += 1;
      return null;
    }
    if (game.some((number) => !Number.isInteger(number) || number < 1 || number > universeSize)) {
      rejectionReasons.numberOutsideUniverse += 1;
      return null;
    }
    if (new Set(game).size !== game.length) {
      rejectionReasons.repeatedNumberInsideCandidate += 1;
      return null;
    }
    const key = gameKey(game);
    if (gameSet.has(key)) {
      rejectionReasons.duplicateGame += 1;
      return null;
    }

    let repeatedQuadruple = false;
    forEachCombination(game, 4, ([a, b, c, d]) => {
      if (usedQuadruples.has(quadrupleKey(a, b, c, d, universeSize))) repeatedQuadruple = true;
    });
    if (repeatedQuadruple) {
      rejectionReasons.repeatedQuadrupleOrIntersectionAboveThree += 1;
      return null;
    }

    let newPairs = 0;
    let pairMultiplicitySum = 0;
    let pairSquareDelta = 0;
    let maximumPairAfter = 0;
    forEachCombination(game, 2, ([a, b]) => {
      const count = pairCounts[pairKey(a, b, universeSize)];
      if (count === 0) newPairs += 1;
      pairMultiplicitySum += count;
      pairSquareDelta += (2 * count) + 1;
      maximumPairAfter = Math.max(maximumPairAfter, count + 1);
    });

    if (phase === "B" && newPairs === 0) {
      rejectionReasons.noNewPairDuringPhaseB += 1;
      return null;
    }

    let newTriples = 0;
    forEachCombination(game, 3, ([a, b, c]) => {
      if (!usedTriples.has(tripleKey(a, b, c, universeSize))) newTriples += 1;
    });

    let frequencySum = 0;
    let frequencySquareDelta = 0;
    let maximumFrequencyAfter = 0;
    for (const number of game) {
      frequencySum += frequency[number];
      frequencySquareDelta += (2 * frequency[number]) + 1;
      maximumFrequencyAfter = Math.max(maximumFrequencyAfter, frequency[number] + 1);
    }

    const weights = config.phases[phase].weights;
    const score =
      (newPairs * weights.newPairs)
      + (newTriples * weights.newTriples)
      - (frequencySquareDelta * weights.frequencyBalance)
      - (pairSquareDelta * weights.pairMultiplicity)
      - (maximumFrequencyAfter * weights.maximumFrequency);

    return {
      game,
      key,
      score,
      newPairs,
      newTriples,
      frequencySum,
      pairMultiplicitySum,
      maximumPairAfter,
      maximumFrequencyAfter,
    };
  }

  function acceptCandidate(candidate, phase) {
    games.push(candidate.game);
    gameSet.add(candidate.key);
    phaseAccepted[phase] += 1;
    for (const number of candidate.game) frequency[number] += 1;
    forEachCombination(candidate.game, 2, ([a, b]) => {
      pairCounts[pairKey(a, b, universeSize)] += 1;
    });
    forEachCombination(candidate.game, 3, ([a, b, c]) => {
      usedTriples.add(tripleKey(a, b, c, universeSize));
    });
    forEachCombination(candidate.game, 4, ([a, b, c, d]) => {
      usedQuadruples.add(quadrupleKey(a, b, c, d, universeSize));
    });
    uncoveredPairs = listUncoveredPairs();
  }

  while (games.length < targetGames) {
    const phase = resolvePhase();
    if (phase !== previousPhase) {
      phaseTransitions.push({ phase, acceptedGames: games.length, missingPairs: uncoveredPairs.length });
      previousPhase = phase;
    }
    if (phase === "B" && games.length >= config.phases.B.maximumGamesBeforeFailure) {
      throw new Error(`A Fase B atingiu ${games.length} jogos com ${uncoveredPairs.length} pares ainda ausentes.`);
    }

    const poolSize = config.phases[phase].candidatePoolSize;
    let best = null;
    let validCandidates = 0;
    for (let index = 0; index < poolSize; index += 1) {
      const candidate = evaluateCandidate(constructCandidate(phase), phase);
      if (!candidate) continue;
      validCandidates += 1;
      if (isBetterCandidate(candidate, best)) best = candidate;
    }

    if (!best) {
      throw new Error(`Nenhuma candidata válida encontrada na Fase ${phase}, após ${poolSize} avaliações.`);
    }
    rejectionReasons.lowerScore += Math.max(0, validCandidates - 1);
    acceptCandidate(best, phase);

    hooks.onAccepted?.({
      phase,
      acceptedGames: games.length,
      missingPairs: uncoveredPairs.length,
      candidate: best,
      frequencyMinimum: Math.min(...frequency.slice(1)),
      frequencyMaximum: Math.max(...frequency.slice(1)),
    });
  }

  const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
  return {
    games,
    audit: {
      seed: String(config.seed),
      candidatesEvaluated,
      candidatesAccepted: games.length,
      candidatesRejected: candidatesEvaluated - games.length,
      rejectionReasons,
      phaseAccepted,
      phaseTransitions,
      durationSeconds,
      finalMissingPairs: uncoveredPairs.length,
    },
  };
}
