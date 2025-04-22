import { shouldAnimatePokemon } from './renderPerformance';

test('uses static sprites above ten visible Pokémon', () => {
  expect(shouldAnimatePokemon(10)).toBe(true);
  expect(shouldAnimatePokemon(11)).toBe(false);
});
