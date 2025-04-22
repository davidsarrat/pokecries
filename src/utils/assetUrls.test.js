import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  getPokemonCryAudio,
  pokemonAssetUrls,
  pokemonCryUrl,
  pokemonSpriteAssetUrls,
  pokemonSpriteUrl,
  pokemonVariantSpriteAssetUrls,
  preloadAssets,
  resetRuntimeAssetCache,
  restartPokemonCry,
  unknownPokemonSpriteUrl,
} from './assetUrls';

test('builds pinned external asset URLs', () => {
  expect(pokemonSpriteUrl('25')).toMatch(/PokeAPI\/sprites\/[a-f0-9]{40}\/.*\/25\.png$/);
  expect(pokemonSpriteUrl('25', true)).toMatch(/black-white\/shiny\/25\.png$/);
  expect(pokemonCryUrl('25')).toMatch(/pokemon-cries@[a-f0-9]{40}\/public\/cries\/old\/025\.mp3$/);
  expect(pokemonCryUrl('274')).toMatch(/public\/cries\/old\/274\.mp3$/);
  expect(pokemonCryUrl('432')).toMatch(/public\/cries\/old\/432\.mp3$/);
  expect(pokemonCryUrl('649')).toMatch(/public\/cries\/old\/649\.mp3$/);
  expect(pokemonCryUrl('492')).toMatch(/public\/cries\/old\/492_land\.mp3$/);
  expect(pokemonCryUrl('641')).toMatch(/public\/cries\/old\/641_incarnate\.mp3$/);
  expect(animatedPokemonSpriteUrl('441')).toMatch(/animated\/441\.gif$/);
  expect(animatedPokemonSpriteUrl('272', true)).toMatch(/animated\/shiny\/272\.gif$/);
  expect(animatedPokemonSpriteUrl('493')).toMatch(/animated\/493-normal\.gif$/);
  expect(animatedPokemonSpriteUrl('493', true)).toMatch(/animated\/shiny\/493-normal\.gif$/);
  expect(animatedPokemonSpriteUrl('422', true, 'east')).toMatch(/animated\/shiny\/422-east\.gif$/);
  expect(animatedPokemonSpriteUrl('201', true, 'f')).toMatch(/animated\/shiny\/201-f\.gif$/);
  expect(animatedPokemonSpriteUrl('25', true, 'female')).toMatch(/animated\/shiny\/female\/25\.gif$/);
  expect(pokemonSpriteUrl('649', true, 'burn')).toBe(
    'https://play.pokemonshowdown.com/sprites/gen5-shiny/genesect-burn.png'
  );
  expect(generationIconUrl('gen2')).toMatch(/animated\/250\.gif$/);
  expect(unknownPokemonSpriteUrl()).toMatch(/sprites\/pokemon\/0\.png$/);
  expect(pokemonAssetUrls('25')).toHaveLength(3);
  expect(pokemonSpriteAssetUrls('25')).toEqual([
    expect.stringMatching(/animated\/25\.gif$/),
    expect.stringMatching(/animated\/shiny\/25\.gif$/),
  ]);
  expect(pokemonVariantSpriteAssetUrls('493')).toHaveLength(34);
  expect(pokemonVariantSpriteAssetUrls('1')).toEqual([]);
});

test('restarts a played cry without seeking a fresh one', () => {
  let freshSeekCount = 0;
  const freshAudio = { readyState: 4 };
  Object.defineProperty(freshAudio, 'currentTime', {
    get: () => 0,
    set: () => {
      freshSeekCount += 1;
    },
  });
  restartPokemonCry(freshAudio);
  expect(freshSeekCount).toBe(0);

  const playedAudio = { currentTime: 0.4, readyState: 4 };
  restartPokemonCry(playedAudio);
  expect(playedAudio.currentTime).toBe(0);
});

test('plays a preloaded cry from a decoded low-latency buffer', async () => {
  const originalAudioContext = window.AudioContext;
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const decodedAudio = { duration: 0.8 };
  const source = {
    buffer: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: null,
    start: jest.fn(),
    stop: jest.fn(),
  };
  const context = {
    createBufferSource: jest.fn(() => source),
    currentTime: 1,
    decodeAudioData: jest.fn().mockResolvedValue(decodedAudio),
    destination: {},
    resume: jest.fn().mockResolvedValue(undefined),
    state: 'running',
  };
  window.AudioContext = jest.fn(() => context);
  process.env.NODE_ENV = 'development';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  });

  try {
    await preloadAssets([pokemonCryUrl('432')], undefined, { priority: 100 });
    const audio = getPokemonCryAudio('432');
    const onplaying = jest.fn();
    audio.onplaying = onplaying;

    await audio.play();

    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(source.start).toHaveBeenCalledWith(0, 0);
    expect(onplaying).toHaveBeenCalledTimes(1);

    audio.pause();
    expect(source.stop).toHaveBeenCalledTimes(1);
  } finally {
    resetRuntimeAssetCache();
    window.AudioContext = originalAudioContext;
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
  }
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
    expect(peakRequests).toBeLessThanOrEqual(1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('downloads background images without creating or decoding image elements', async () => {
  const originalImage = global.Image;
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const images = [];

  class MockImage {
    constructor() {
      this.decode = jest.fn().mockResolvedValue(undefined);
      images.push(this);
    }

    set src(value) {
      this.currentSrc = value;
      Promise.resolve().then(() => this.onload());
    }
  }

  process.env.NODE_ENV = 'development';
  global.Image = MockImage;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });

  try {
    await preloadAssets(['background-lifecycle.gif'], undefined, { priority: 10 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(images).toHaveLength(0);

    await preloadAssets(['critical-lifecycle.gif'], undefined, { priority: 100 });

    expect(images).toHaveLength(1);
    expect(images[0].decode).toHaveBeenCalledTimes(1);
    expect(images[0].onload).toBeNull();
    expect(images[0].onerror).toBeNull();
  } finally {
    resetRuntimeAssetCache();
    global.Image = originalImage;
    global.fetch = originalFetch;
    process.env.NODE_ENV = originalNodeEnv;
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

test('can defer bulk audio teardown until after the UI transition', () => {
  jest.useFakeTimers();
  const originalAudio = global.Audio;
  const audio = {
    error: null,
    load: jest.fn(),
    networkState: 1,
    onended: null,
    onerror: null,
    onplaying: null,
    onstalled: null,
    onwaiting: null,
    pause: jest.fn(),
    readyState: 4,
    removeAttribute: jest.fn(),
  };
  global.Audio = jest.fn(() => audio);

  try {
    getPokemonCryAudio('25');
    resetRuntimeAssetCache({ deferAudio: true });

    expect(audio.pause).not.toHaveBeenCalled();
    jest.advanceTimersByTime(32);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
  } finally {
    resetRuntimeAssetCache();
    global.Audio = originalAudio;
    jest.useRealTimers();
  }
});

test('replaces a stuck cry audio element when playback requests a reload', () => {
  const originalAudio = global.Audio;
  const audioInstances = [];
  global.Audio = jest.fn(() => {
    const audio = {
      error: null,
      load: jest.fn(),
      networkState: 1,
      onended: null,
      onerror: null,
      onplaying: null,
      onstalled: null,
      onwaiting: null,
      pause: jest.fn(),
      readyState: 0,
      removeAttribute: jest.fn(),
    };
    audioInstances.push(audio);
    return audio;
  });

  try {
    const firstAudio = getPokemonCryAudio('432');
    expect(getPokemonCryAudio('432')).toBe(firstAudio);

    const replacementAudio = getPokemonCryAudio('432', { forceReload: true });
    expect(replacementAudio).not.toBe(firstAudio);
    expect(firstAudio.pause).toHaveBeenCalledTimes(1);
    expect(firstAudio.removeAttribute).toHaveBeenCalledWith('src');
    expect(audioInstances).toHaveLength(2);
  } finally {
    resetRuntimeAssetCache();
    global.Audio = originalAudio;
  }
});
