const shuffle = (items, random) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const selectAnswers = ({
  pokemonList,
  currentPokemon,
  limitedAnswers,
  numberOfAnswers,
  random,
}) => {
  if (!limitedAnswers || numberOfAnswers >= pokemonList.length) {
    return pokemonList;
  }

  const distractors = shuffle(
    pokemonList.filter(pokemon => pokemon.id !== currentPokemon.id),
    random
  ).slice(0, numberOfAnswers - 1);

  return shuffle([...distractors, currentPokemon], random);
};

export const createGamePlan = ({
  pokemonList,
  roundCount,
  dontRepeat,
  limitedAnswers,
  numberOfAnswers,
  previousPokemonId,
  random = Math.random,
}) => {
  if (pokemonList.length === 0 || roundCount <= 0) return [];

  const totalRounds = dontRepeat
    ? Math.min(roundCount, pokemonList.length)
    : roundCount;
  const questions = dontRepeat ? shuffle(pokemonList, random).slice(0, totalRounds) : [];

  if (!dontRepeat) {
    let previousId = previousPokemonId;
    for (let index = 0; index < totalRounds; index += 1) {
      const candidates = [];
      for (const pokemon of pokemonList) {
        if (pokemonList.length === 1 || pokemon.id !== previousId) {
          candidates.push(pokemon);
        }
      }
      const nextPokemon = candidates[Math.floor(random() * candidates.length)];
      questions.push(nextPokemon);
      previousId = nextPokemon.id;
    }
  }

  return questions.map(pokemon => ({
    pokemon,
    visiblePokemon: selectAnswers({
      pokemonList,
      currentPokemon: pokemon,
      limitedAnswers,
      numberOfAnswers,
      random,
    }),
  }));
};
