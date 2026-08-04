export function forEachCombination(values, size, callback) {
  const buffer = [];
  function visit(start) {
    if (buffer.length === size) {
      callback(buffer);
      return;
    }
    const remaining = size - buffer.length;
    for (let index = start; index <= values.length - remaining; index += 1) {
      buffer.push(values[index]);
      visit(index + 1);
      buffer.pop();
    }
  }
  visit(0);
}

export function chooseCount(n, k) {
  if (k < 0 || n < k) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

export function gameKey(game) {
  return game.map((number) => String(number).padStart(2, "0")).join("-");
}

export function pairKey(a, b, universeSize = 60) {
  return a * (universeSize + 1) + b;
}

export function tripleKey(a, b, c, universeSize = 60) {
  const base = universeSize + 1;
  return (a * base + b) * base + c;
}

export function quadrupleKey(a, b, c, d, universeSize = 60) {
  const base = universeSize + 1;
  return ((a * base + b) * base + c) * base + d;
}
