import {
  getPokemonSpriteVariantData,
  getPokemonSpriteVariants,
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

test('maps exceptional form filenames correctly', () => {
  expect(getPokemonSpriteVariantData('201', 'f')).toEqual({
    kind: 'form',
    publicSlug: 'unown-f',
    animatedFilename: '201-f',
  });
  expect(getPokemonSpriteVariantData('550', 'blue_striped').publicSlug)
    .toBe('basculin-bluestriped');
});
