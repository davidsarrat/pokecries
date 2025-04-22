import { getBalancedColumnCount } from './PokemonGrid';

test.each([
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 3],
  [6, 3],
  [7, 4],
  [8, 4],
  [9, 3],
  [10, 5],
  [12, 4],
])('balances %i cards across %i columns', (cardCount, expectedColumns) => {
  expect(getBalancedColumnCount(cardCount)).toBe(expectedColumns);
});
