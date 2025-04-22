const POKEMON_TYPES_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/9bea2b6eaa1f8f2c8d068b535f61dd75fce4a205/data/v2/csv/pokemon_types.csv';

const TYPE_NAMES = {
  1: 'normal',
  2: 'fighting',
  3: 'flying',
  4: 'poison',
  5: 'ground',
  6: 'rock',
  7: 'bug',
  8: 'ghost',
  9: 'steel',
  10: 'fire',
  11: 'water',
  12: 'grass',
  13: 'electric',
  14: 'psychic',
  15: 'ice',
  16: 'dragon',
  17: 'dark',
  18: 'fairy',
};

let pokemonTypesRequest;

export const loadPokemonTypes = () => {
  if (!pokemonTypesRequest) {
    pokemonTypesRequest = fetch(POKEMON_TYPES_URL, {
      cache: 'force-cache',
      referrerPolicy: 'no-referrer',
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rows = (await response.text()).trim().split('\n').slice(1);
      return rows.reduce((typesByPokemon, row) => {
        const [pokemonId, typeId, slot] = row.trim().split(',');
        if (Number(pokemonId) > 649) return typesByPokemon;

        if (!typesByPokemon[pokemonId]) typesByPokemon[pokemonId] = [];
        typesByPokemon[pokemonId][Number(slot) - 1] = TYPE_NAMES[typeId];
        return typesByPokemon;
      }, {});
    }).catch(error => {
      pokemonTypesRequest = undefined;
      throw error;
    });
  }

  return pokemonTypesRequest;
};
