import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  pokemonAssetUrls,
  pokemonCryUrl,
  pokemonSpriteUrl,
  preloadAssets,
} from './assetUrls';

test('builds pinned external asset URLs', () => {
  expect(pokemonSpriteUrl('25')).toMatch(/PokeAPI\/sprites\/[a-f0-9]{40}\/.*\/25\.png$/);
  expect(pokemonSpriteUrl('25', true)).toMatch(/black-white\/shiny\/25\.png$/);
  expect(pokemonCryUrl('25')).toMatch(/PokeAPI\/cries\/[a-f0-9]{40}\/.*\/25\.ogg$/);
  expect(animatedPokemonSpriteUrl('441')).toMatch(/animated\/441\.gif$/);
  expect(animatedPokemonSpriteUrl('272', true)).toMatch(/animated\/shiny\/272\.gif$/);
  expect(generationIconUrl('gen2')).toMatch(/Ho-Oh_icon\.gif$/);
  expect(pokemonAssetUrls('25')).toHaveLength(3);
});

test('preloads every unique asset and reports completion', async () => {
  const originalFetch = global.fetch;
  const progress = [];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    const failedUrls = await preloadAssets(['one', 'two', 'one'], value => progress.push(value));

    expect(failedUrls).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(progress.at(-1)).toBe(100);
  } finally {
    global.fetch = originalFetch;
  }
});
