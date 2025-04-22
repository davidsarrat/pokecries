import {
  EAGER_DENSE_POKEMON,
  getEagerDensePokemonCount,
  shouldAnimatePokemon,
} from './renderPerformance';

test('uses static sprites above ten visible Pokémon', () => {
  expect(shouldAnimatePokemon(10)).toBe(true);
  expect(shouldAnimatePokemon(11)).toBe(false);
});

test('preloads fewer dense-grid sprites on smaller screens', () => {
  expect(getEagerDensePokemonCount(390)).toBe(18);
  expect(getEagerDensePokemonCount(800)).toBe(30);
  expect(getEagerDensePokemonCount(1440)).toBe(EAGER_DENSE_POKEMON);
});
