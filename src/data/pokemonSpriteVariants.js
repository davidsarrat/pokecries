import pokemonData from './pokemon.json';

const GENDER_DIFFERENCE_IDS = new Set([
  3, 12, 19, 20, 25, 26, 41, 42, 44, 45, 64, 65, 84, 85, 97, 111,
  112, 118, 119, 123, 129, 130, 154, 165, 166, 178, 185, 186, 190,
  194, 195, 198, 202, 203, 207, 208, 212, 214, 215, 217, 221, 224,
  229, 232, 255, 256, 257, 267, 269, 272, 274, 275, 307, 308, 315,
  316, 317, 322, 323, 332, 350, 369, 396, 397, 398, 399, 400, 401,
  402, 403, 404, 405, 407, 415, 417, 418, 419, 424, 443, 444, 445,
  449, 450, 453, 454, 456, 457, 459, 460, 461, 464, 465, 473, 521,
  592, 593,
]);

const UNOWN_FORMS = [
  'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'question', 'exclamation',
];

const FORM_VARIANTS = {
  201: UNOWN_FORMS,
  351: ['rainy', 'snowy', 'sunny'],
  386: ['attack', 'defense', 'speed'],
  412: ['sandy', 'trash'],
  413: ['sandy', 'trash'],
  421: ['sunshine'],
  422: ['east'],
  423: ['east'],
  479: ['fan', 'frost', 'heat', 'mow', 'wash'],
  487: ['origin'],
  492: ['sky'],
  493: [
    'bug', 'dark', 'dragon', 'electric', 'fighting', 'fire', 'flying',
    'ghost', 'grass', 'ground', 'ice', 'poison', 'psychic', 'rock',
    'steel', 'water',
  ],
  550: ['blue_striped'],
  555: ['zen'],
  585: ['autumn', 'summer', 'winter'],
  586: ['autumn', 'summer', 'winter'],
  641: ['therian'],
  642: ['therian'],
  645: ['therian'],
  646: ['black', 'white'],
  647: ['resolute'],
  648: ['pirouette'],
  649: ['burn', 'chill', 'douse', 'shock'],
};

const ANIMATED_BASE_FORMS = {
  201: 'a',
  386: 'normal',
  412: 'plant',
  413: 'plant',
  421: 'overcast',
  422: 'west',
  423: 'west',
  487: 'altered',
  492: 'land',
  493: 'normal',
  550: 'red-striped',
  555: 'standard',
  585: 'spring',
  586: 'spring',
  641: 'incarnate',
  642: 'incarnate',
  645: 'incarnate',
  647: 'ordinary',
  648: 'aria',
};

const POKEMON_SLUGS = new Map(
  Object.values(pokemonData).flat().map(pokemon => [
    String(pokemon.id),
    pokemon.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, ''),
  ])
);

const publicFormName = form => (
  form === 'blue_striped' ? 'bluestriped' : form
);

const pokeApiFormName = form => form.replace(/_/g, '-');

export const getPokemonSpriteVariants = (pokemonId) => {
  const id = String(pokemonId);
  const variants = ['base'];
  if (GENDER_DIFFERENCE_IDS.has(Number(id))) variants.push('female');
  if (FORM_VARIANTS[id]) variants.push(...FORM_VARIANTS[id]);
  return variants;
};

export const selectPokemonSpriteVariant = (pokemonId, random = Math.random) => {
  const variants = getPokemonSpriteVariants(pokemonId);
  if (variants.length === 1) return undefined;
  const index = Math.min(variants.length - 1, Math.floor(random() * variants.length));
  return variants[index];
};

export const getPokemonSpriteVariantData = (pokemonId, variant) => {
  const id = String(pokemonId);
  if (!variant || !getPokemonSpriteVariants(id).includes(variant)) return null;

  const pokemonSlug = POKEMON_SLUGS.get(id);
  if (!pokemonSlug) return null;

  if (variant === 'base') {
    return {
      kind: 'base',
      publicSlug: pokemonSlug,
      animatedFilename: ANIMATED_BASE_FORMS[id]
        ? `${id}-${ANIMATED_BASE_FORMS[id]}`
        : id,
    };
  }

  if (variant === 'female') {
    return {
      kind: 'female',
      publicSlug: `${pokemonSlug}-f`,
    };
  }

  return {
    kind: 'form',
    publicSlug: `${pokemonSlug}-${publicFormName(variant)}`,
    animatedFilename: `${id}-${pokeApiFormName(variant)}`,
  };
};
