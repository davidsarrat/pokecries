import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  pokemonAssetUrls,
  pokemonCryUrl,
  pokemonSpriteAssetUrls,
  pokemonSpriteUrl,
  preloadAssets,
  unknownPokemonSpriteUrl,
} from './assetUrls';

test('builds pinned external asset URLs', () => {
  expect(pokemonSpriteUrl('25')).toMatch(/PokeAPI\/sprites\/[a-f0-9]{40}\/.*\/25\.png$/);
  expect(pokemonSpriteUrl('25', true)).toMatch(/black-white\/shiny\/25\.png$/);
  expect(pokemonCryUrl('25')).toMatch(/PokeAPI\/cries\/[a-f0-9]{40}\/.*\/25\.ogg$/);
  expect(animatedPokemonSpriteUrl('441')).toMatch(/animated\/441\.gif$/);
  expect(animatedPokemonSpriteUrl('272', true)).toMatch(/animated\/shiny\/272\.gif$/);
  expect(generationIconUrl('gen2')).toMatch(/animated\/250\.gif$/);
  expect(unknownPokemonSpriteUrl()).toMatch(/sprites\/pokemon\/0\.png$/);
  expect(pokemonAssetUrls('25')).toHaveLength(3);
  expect(pokemonSpriteAssetUrls('25')).toEqual([
    expect.stringMatching(/animated\/25\.gif$/),
    expect.stringMatching(/animated\/shiny\/25\.gif$/),
  ]);
});

test('preloads every unique asset and reports completion', async () => {
  const originalFetch = global.fetch;
  const progress = [];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    const [failedUrls, duplicateFailures] = await Promise.all([
      preloadAssets(['one', 'two', 'one'], value => progress.push(value)),
      preloadAssets(['one']),
    ]);

    expect(failedUrls).toEqual([]);
    expect(duplicateFailures).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(progress.at(-1)).toBe(100);
  } finally {
    global.fetch = originalFetch;
  }
});
