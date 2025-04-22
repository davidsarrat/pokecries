import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  pokemonAssetUrls,
  pokemonCryUrl,
  pokemonSpriteAssetUrls,
  pokemonSpriteUrl,
  preloadAssets,
  resetRuntimeAssetCache,
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

test('releases old preload entries instead of growing without a limit', async () => {
  const originalFetch = global.fetch;
  const urls = Array.from({ length: 130 }, (_, index) => `bounded-cache-${index}`);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    await preloadAssets(urls);
    global.fetch.mockClear();

    await preloadAssets([urls[0], urls.at(-1)]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('caps concurrent asset work across a preload batch', async () => {
  const originalFetch = global.fetch;
  let activeRequests = 0;
  let peakRequests = 0;
  global.fetch = jest.fn().mockImplementation(async () => {
    activeRequests += 1;
    peakRequests = Math.max(peakRequests, activeRequests);
    await new Promise(resolve => setTimeout(resolve, 1));
    activeRequests -= 1;
    return {
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
  });

  try {
    await preloadAssets(Array.from({ length: 24 }, (_, index) => `concurrent-${index}`));
    expect(peakRequests).toBeLessThanOrEqual(8);
  } finally {
    global.fetch = originalFetch;
  }
});

test('keeps background preloads from occupying every asset slot', async () => {
  const originalFetch = global.fetch;
  let activeRequests = 0;
  let peakRequests = 0;
  global.fetch = jest.fn().mockImplementation(async () => {
    activeRequests += 1;
    peakRequests = Math.max(peakRequests, activeRequests);
    await new Promise(resolve => setTimeout(resolve, 1));
    activeRequests -= 1;
    return {
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
  });

  try {
    await preloadAssets(
      Array.from({ length: 12 }, (_, index) => `background-${index}`),
      undefined,
      { priority: 10 }
    );
    expect(peakRequests).toBeLessThanOrEqual(2);
  } finally {
    global.fetch = originalFetch;
  }
});

test('bounds queued preload work on slow connections', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, 1));
    return {
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
  });

  try {
    await preloadAssets(Array.from({ length: 100 }, (_, index) => `bounded-queue-${index}`));
    expect(global.fetch.mock.calls.length).toBeLessThanOrEqual(72);
  } finally {
    resetRuntimeAssetCache();
    global.fetch = originalFetch;
  }
});

test('never drops critical preload work', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    await preloadAssets(
      Array.from({ length: 80 }, (_, index) => `critical-${index}`),
      undefined,
      { priority: 100 }
    );
    expect(global.fetch).toHaveBeenCalledTimes(80);
  } finally {
    resetRuntimeAssetCache();
    global.fetch = originalFetch;
  }
});

test('releases retained runtime assets between games', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    await preloadAssets(['runtime-reset']);
    resetRuntimeAssetCache();
    global.fetch.mockClear();

    await preloadAssets(['runtime-reset']);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally {
    resetRuntimeAssetCache();
    global.fetch = originalFetch;
  }
});
