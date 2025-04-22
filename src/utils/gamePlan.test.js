import { createGamePlan } from './gamePlan';

const pokemonList = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  name: `Pokémon ${index + 1}`,
}));

test('plans unique questions and valid limited answers', () => {
  const plan = createGamePlan({
    pokemonList,
    roundCount: 4,
    dontRepeat: true,
    limitedAnswers: true,
    numberOfAnswers: 3,
    random: () => 0.25,
  });

  expect(new Set(plan.map(round => round.pokemon.id)).size).toBe(4);
  plan.forEach(round => {
    expect(round.visiblePokemon).toHaveLength(3);
    expect(new Set(round.visiblePokemon.map(pokemon => pokemon.id)).size).toBe(3);
    expect(round.visiblePokemon).toContainEqual(round.pokemon);
  });
});

test('avoids consecutive repeats in normal mode', () => {
  const plan = createGamePlan({
    pokemonList,
    roundCount: 8,
    dontRepeat: false,
    limitedAnswers: true,
    numberOfAnswers: 4,
    previousPokemonId: 1,
    random: () => 0,
  });

  expect(plan).toHaveLength(8);
  plan.forEach((round, index) => {
    const previousId = index === 0 ? 1 : plan[index - 1].pokemon.id;
    expect(round.pokemon.id).not.toBe(previousId);
  });
});

test('preserves Pokédex order for the full answer list', () => {
  const plan = createGamePlan({
    pokemonList,
    roundCount: 1,
    dontRepeat: false,
    limitedAnswers: false,
    numberOfAnswers: 4,
    random: () => 0,
  });

  expect(plan[0].visiblePokemon.map(pokemon => pokemon.id)).toEqual(
    pokemonList.map(pokemon => pokemon.id)
  );
  expect(new Set(plan[0].visiblePokemon.map(pokemon => pokemon.id)).size).toBe(pokemonList.length);
});
