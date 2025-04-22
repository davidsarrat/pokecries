import {
  getPokemonSpriteVariantData,
  getPokemonSpriteVariants,
  RANDOM_SHINY_RATE,
  selectFullListShinyIndex,
  selectRandomPokemonShiny,
  selectPokemonSpriteVariant,
} from './pokemonSpriteVariants';

test('lists generation-five forms and gender differences', () => {
  expect(getPokemonSpriteVariants('201')).toHaveLength(28);
  expect(getPokemonSpriteVariants('25')).toEqual(['base', 'female']);
  expect(getPokemonSpriteVariants('422')).toEqual(['base', 'east']);
  expect(getPokemonSpriteVariants('493')).toHaveLength(17);
  expect(getPokemonSpriteVariants('649')).toEqual(['base', 'burn', 'chill', 'douse', 'shock']);
});

test('selects a stable variant key from the supplied random value', () => {
  expect(selectPokemonSpriteVariant('422', () => 0)).toBe('base');
  expect(selectPokemonSpriteVariant('422', () => 0.999)).toBe('east');
  expect(selectPokemonSpriteVariant('1', () => 0.999)).toBeUndefined();
});

test('uses an explicit one-in-1000 shiny rate per appearance', () => {
  expect(RANDOM_SHINY_RATE).toBe(1 / 1000);
  expect(selectRandomPokemonShiny(() => 0)).toBe(true);
  expect(selectRandomPokemonShiny(() => RANDOM_SHINY_RATE)).toBe(false);
});

test('aggregates the shiny rate into at most one stable full-list appearance', () => {
  const hitsFirst = jest.fn()
    .mockReturnValueOnce(0.648)
    .mockReturnValueOnce(0);
  const hitsLast = jest.fn()
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(0.999);

  expect(selectFullListShinyIndex(649, hitsFirst)).toBe(0);
  expect(selectFullListShinyIndex(649, hitsLast)).toBe(648);
  expect(selectFullListShinyIndex(649, () => 0.649)).toBe(-1);
  expect(selectFullListShinyIndex(0, () => 0)).toBe(-1);
});

test('maps exceptional form filenames correctly', () => {
  expect(getPokemonSpriteVariantData('201', 'f')).toEqual({
    kind: 'form',
    publicSlug: 'unown-f',
    animatedFilename: '201-f',
  });
  expect(getPokemonSpriteVariantData('550', 'blue_striped').publicSlug)
    .toBe('basculin-bluestriped');
});
