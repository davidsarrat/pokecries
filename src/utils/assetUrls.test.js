import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  pokemonCryUrl,
  pokemonSpriteUrl,
} from './assetUrls';

test('builds pinned external asset URLs', () => {
  expect(pokemonSpriteUrl('25')).toMatch(/PokeAPI\/sprites\/[a-f0-9]{40}\/.*\/25\.png$/);
  expect(pokemonSpriteUrl('25', true)).toMatch(/black-white\/shiny\/25\.png$/);
  expect(pokemonCryUrl('25')).toMatch(/PokeAPI\/cries\/[a-f0-9]{40}\/.*\/25\.ogg$/);
  expect(animatedPokemonSpriteUrl('441')).toMatch(/animated\/441\.gif$/);
  expect(animatedPokemonSpriteUrl('272', true)).toMatch(/animated\/shiny\/272\.gif$/);
  expect(generationIconUrl('571')).toMatch(/generation-v\/icons\/571\.png$/);
});
