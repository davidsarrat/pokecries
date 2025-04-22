const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon/versions/generation-v';
const CRIES_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/ef687b18f0ce17169b4b4c09175819f7ade92f0f/cries/pokemon/legacy';

export const pokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}${pokemonId}.png`;

export const pokemonCryUrl = (pokemonId) => `${CRIES_BASE}/${pokemonId}.ogg`;

export const animatedPokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}${pokemonId}.gif`;

export const generationIconUrl = (pokemonId) =>
  `${SPRITES_BASE}/icons/${pokemonId}.png`;
