import {
  getPokemonSpriteVariantData,
  getPokemonSpriteVariants,
} from '../data/pokemonSpriteVariants';

const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon/versions/generation-v';
const POKEMON_SPRITES_ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon';
const SHOWDOWN_STATIC_SPRITES_BASE = 'https://play.pokemonshowdown.com/sprites';
const LEGACY_CRIES_BASE = 'https://cdn.jsdelivr.net/gh/pkelly10439594/pokemon-cries@ac7823370ac9090aa0f7d05c97fec58f1afc17a7/public/cries/old';
const LEGACY_CRY_FILENAMES = {
  492: '492_land',
  641: '641_incarnate',
  642: '642_incarnate',
  645: '645_incarnate',
};
const GENERATION_ICON_IDS = {
  gen1: '25',
  gen2: '250',
  gen3: '384',
  gen4: '448',
  gen5: '571',
};
const preloadRequests = new Map();
const audioAssets = new Map();
const decodedAudioBuffers = new Map();
const audioDecodeRequests = new Map();
const pendingPreloads = new Set();
const preloadQueue = [];
const MAX_RETAINED_ASSETS = 128;
const MAX_RETAINED_AUDIO = 48;
const MAX_RETAINED_AUDIO_BUFFERS = 48;
const MAX_CONCURRENT_PRELOADS = 8;
const MAX_CONCURRENT_BACKGROUND_PRELOADS = 1;
const MAX_QUEUED_PRELOADS = 64;
const BACKGROUND_PRIORITY = 10;
const CRITICAL_PRIORITY = 100;
const PRELOAD_CANCELLED_ERROR_NAME = 'PreloadCancelledError';
const IMAGE_ASSET_PATTERN = /\.(?:gif|png|jpe?g|webp)$/i;
const AUDIO_ASSET_PATTERN = /\.(?:mp3|ogg)$/i;
let activePreloads = 0;
let activeBackgroundPreloads = 0;
let preloadSequence = 0;
let audioBufferGeneration = 0;
let lowLatencyAudioContext = null;
let lowLatencyAudioUnavailable = false;

const createPreloadCancelledError = () => {
  const error = new Error('Asset preload cancelled');
  error.name = PRELOAD_CANCELLED_ERROR_NAME;
  return error;
};

export const pokemonSpriteUrl = (pokemonId, shiny = false, variant) => {
  const variantData = getPokemonSpriteVariantData(pokemonId, variant);
  if (variantData?.kind === 'female') {
    return `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}female/${pokemonId}.png`;
  }
  if (variantData?.kind === 'form' && String(pokemonId) === '201') {
    return `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}${variantData.animatedFilename}.png`;
  }
  if (variantData?.kind === 'form') {
    return `${SHOWDOWN_STATIC_SPRITES_BASE}/${shiny ? 'gen5-shiny' : 'gen5'}/${variantData.publicSlug}.png`;
  }
  return `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}${pokemonId}.png`;
};

export const pokemonCryUrl = (pokemonId) => {
  const id = String(pokemonId);
  const filename = LEGACY_CRY_FILENAMES[id] || id.padStart(3, '0');
  return `${LEGACY_CRIES_BASE}/${filename}.mp3`;
};

export const restartPokemonCry = (audio) => {
  if (audio.readyState > 0 && audio.currentTime > 0) audio.currentTime = 0;
};

const getLowLatencyAudioContext = () => {
  if (lowLatencyAudioUnavailable || typeof window === 'undefined') return null;
  if (lowLatencyAudioContext && lowLatencyAudioContext.state !== 'closed') {
    return lowLatencyAudioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextClass !== 'function') {
    lowLatencyAudioUnavailable = true;
    return null;
  }

  try {
    lowLatencyAudioContext = new AudioContextClass({ latencyHint: 'interactive' });
    return lowLatencyAudioContext;
  } catch (error) {
    lowLatencyAudioUnavailable = true;
    return null;
  }
};

export const unlockPokemonCryAudio = () => {
  const context = getLowLatencyAudioContext();
  if (!context || context.state === 'running') return Promise.resolve();
  return context.resume().catch(() => undefined);
};

const refreshCacheEntry = (cache, key) => {
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
};

const trimDecodedAudioCache = () => {
  while (decodedAudioBuffers.size > MAX_RETAINED_AUDIO_BUFFERS) {
    const disposableUrl = decodedAudioBuffers.keys().next().value;
    decodedAudioBuffers.delete(disposableUrl);
    preloadRequests.delete(disposableUrl);
  }
};

const decodeAudioAsset = (url) => {
  if (decodedAudioBuffers.has(url)) {
    return Promise.resolve(refreshCacheEntry(decodedAudioBuffers, url));
  }
  if (audioDecodeRequests.has(url)) return audioDecodeRequests.get(url);

  const context = getLowLatencyAudioContext();
  if (!context) return Promise.reject(new Error('Low-latency audio is unavailable'));

  const generation = audioBufferGeneration;
  const request = fetch(url, {
    cache: 'force-cache',
    referrerPolicy: 'no-referrer',
  })
    .then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const encodedAudio = await response.arrayBuffer();
      return context.decodeAudioData(encodedAudio);
    })
    .then(decodedAudio => {
      if (generation === audioBufferGeneration) {
        decodedAudioBuffers.set(url, decodedAudio);
        trimDecodedAudioCache();
      }
      return decodedAudio;
    })
    .finally(() => {
      if (audioDecodeRequests.get(url) === request) audioDecodeRequests.delete(url);
    });

  audioDecodeRequests.set(url, request);
  return request;
};

const createBufferedAudioAsset = (url, decodedAudio, context) => {
  let source = null;
  let playbackPosition = 0;
  let playbackStartedAt = 0;
  let playbackVersion = 0;

  const stopSource = () => {
    if (!source) return;
    source.onended = null;
    try {
      source.stop();
    } catch (error) {
      // The source may already have ended between the click and this cleanup.
    }
    source.disconnect();
    source = null;
  };

  const audio = {
    error: null,
    networkState: 1,
    onended: null,
    onerror: null,
    onplaying: null,
    onstalled: null,
    onwaiting: null,
    paused: true,
    preload: 'auto',
    readyState: 4,
    src: url,
    load: () => {},
    removeAttribute: attribute => {
      if (attribute === 'src') audio.src = '';
    },
    pause: () => {
      playbackVersion += 1;
      if (!audio.paused) {
        playbackPosition = Math.min(
          decodedAudio.duration,
          Math.max(0, context.currentTime - playbackStartedAt)
        );
      }
      audio.paused = true;
      stopSource();
    },
    play: async () => {
      const requestedVersion = playbackVersion + 1;
      playbackVersion = requestedVersion;
      stopSource();

      if (context.state !== 'running') await context.resume();
      if (requestedVersion !== playbackVersion) return;

      const nextSource = context.createBufferSource();
      nextSource.buffer = decodedAudio;
      nextSource.connect(context.destination);
      source = nextSource;
      audio.paused = false;
      playbackStartedAt = context.currentTime - playbackPosition;
      nextSource.onended = () => {
        if (source !== nextSource) return;
        source.disconnect();
        source = null;
        playbackPosition = decodedAudio.duration;
        audio.paused = true;
        if (typeof audio.onended === 'function') audio.onended();
      };
      nextSource.start(0, playbackPosition);
      if (typeof audio.onplaying === 'function') audio.onplaying();
    },
  };

  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => (
      audio.paused
        ? playbackPosition
        : Math.min(decodedAudio.duration, context.currentTime - playbackStartedAt)
    ),
    set: value => {
      playbackPosition = Math.min(decodedAudio.duration, Math.max(0, Number(value) || 0));
    },
  });

  return audio;
};

const trimPreloadCache = () => {
  while (preloadRequests.size > MAX_RETAINED_ASSETS) {
    const disposableUrl = [...preloadRequests.keys()]
      .find(url => !pendingPreloads.has(url));
    if (!disposableUrl) return;
    preloadRequests.delete(disposableUrl);
  }
};

const trimAudioCache = () => {
  while (audioAssets.size > MAX_RETAINED_AUDIO) {
    const disposableEntry = [...audioAssets.entries()]
      .find(([url, audio]) => (
        !pendingPreloads.has(url)
        && audio.onended === null
        && audio.paused
        && audio.readyState >= 3
      ));
    if (!disposableEntry) return;

    const [url, audio] = disposableEntry;
    audio.onended = null;
    audio.removeAttribute('src');
    audio.load();
    audioAssets.delete(url);
    preloadRequests.delete(url);
  }
};

const releaseAudioElement = (audio) => {
  audio.onended = null;
  audio.onerror = null;
  audio.onplaying = null;
  audio.onstalled = null;
  audio.onwaiting = null;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
};

const deferAudioRelease = (audioElements) => {
  const scheduleBatch = () => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(releaseBatch, { timeout: 1000 });
    } else {
      setTimeout(releaseBatch, 32);
    }
  };
  const releaseBatch = () => {
    audioElements.splice(0, 4).forEach(releaseAudioElement);
    if (audioElements.length > 0) scheduleBatch();
  };

  scheduleBatch();
};

const discardAudioAsset = (url) => {
  const audio = audioAssets.get(url);
  if (audio) {
    releaseAudioElement(audio);
    audioAssets.delete(url);
  }
  decodedAudioBuffers.delete(url);
  preloadRequests.delete(url);
};

const getAudioAsset = (url) => {
  const cachedAudio = audioAssets.get(url);
  if (cachedAudio && (cachedAudio.error || cachedAudio.networkState === 3)) {
    discardAudioAsset(url);
  }

  if (audioAssets.has(url)) return refreshCacheEntry(audioAssets, url);

  const context = getLowLatencyAudioContext();
  const decodedAudio = decodedAudioBuffers.get(url);
  const canUseDecodedAudio = Boolean(context && decodedAudio);
  const audio = canUseDecodedAudio
    ? createBufferedAudioAsset(url, decodedAudio, context)
    : new Audio();
  if (!canUseDecodedAudio) {
    audio.preload = 'auto';
    audio.src = url;
  }
  audioAssets.set(url, audio);
  trimAudioCache();
  return audio;
};

export const getPokemonCryAudio = (pokemonId, { forceReload = false } = {}) => {
  const url = pokemonCryUrl(pokemonId);
  if (forceReload) discardAudioAsset(url);
  return getAudioAsset(url);
};

const preloadNativeAudioAsset = url => new Promise((resolve, reject) => {
  const audio = getAudioAsset(url);
  if (audio.readyState >= 3) {
    resolve();
    return;
  }

  const cleanup = () => {
    audio.removeEventListener('canplay', handleReady);
    audio.removeEventListener('error', handleError);
  };
  const handleReady = () => {
    cleanup();
    trimAudioCache();
    resolve();
  };
  const handleError = () => {
    cleanup();
    audioAssets.delete(url);
    reject(new Error('Audio preload failed'));
  };

  audio.addEventListener('canplay', handleReady);
  audio.addEventListener('error', handleError);
  audio.load();
});

export const unknownPokemonSpriteUrl = () => `${POKEMON_SPRITES_ROOT}/0.png`;

export const animatedPokemonSpriteUrl = (pokemonId, shiny = false, variant) => {
  const resolvedVariant = variant || (String(pokemonId) === '493' ? 'base' : undefined);
  const variantData = getPokemonSpriteVariantData(pokemonId, resolvedVariant);
  if (variantData?.kind === 'female') {
    return `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}female/${pokemonId}.gif`;
  }
  if (variantData) {
    return `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}${variantData.animatedFilename}.gif`;
  }
  return `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}${pokemonId}.gif`;
};

export const generationIconUrl = (generationKey) =>
  animatedPokemonSpriteUrl(GENERATION_ICON_IDS[generationKey]);

export const pokemonSpriteAssetUrls = (pokemonId) => [
  animatedPokemonSpriteUrl(pokemonId),
  animatedPokemonSpriteUrl(pokemonId, true),
];

export const pokemonVariantSpriteAssetUrls = (pokemonId, { animated = true } = {}) => {
  const variants = getPokemonSpriteVariants(pokemonId);
  if (variants.length === 1) return [];
  const getUrl = animated ? animatedPokemonSpriteUrl : pokemonSpriteUrl;
  return variants.flatMap(variant => [
    getUrl(pokemonId, false, variant),
    getUrl(pokemonId, true, variant),
  ]);
};

export const pokemonAssetUrls = (pokemonId) => [
  ...pokemonSpriteAssetUrls(pokemonId),
  pokemonCryUrl(pokemonId),
];

function runNextPreload(nextPreload) {
  const isBackgroundPreload = nextPreload.priority <= BACKGROUND_PRIORITY;
  activePreloads += 1;
  if (isBackgroundPreload) activeBackgroundPreloads += 1;

  Promise.resolve()
    .then(nextPreload.load)
    .then(nextPreload.resolve, nextPreload.reject)
    .finally(() => {
      activePreloads -= 1;
      if (isBackgroundPreload) activeBackgroundPreloads -= 1;
      startQueuedPreloads();
    });
}

const canStartQueuedPreload = entry => (
  entry.priority > BACKGROUND_PRIORITY
  || activeBackgroundPreloads < MAX_CONCURRENT_BACKGROUND_PRELOADS
);

function startQueuedPreloads() {
  while (activePreloads < MAX_CONCURRENT_PRELOADS && preloadQueue.length > 0) {
    const nextIndex = preloadQueue.findIndex(canStartQueuedPreload);
    if (nextIndex === -1) return;
    const [nextPreload] = preloadQueue.splice(nextIndex, 1);
    runNextPreload(nextPreload);
  }
}

const runQueuedPreload = (load, priority) => new Promise((resolve, reject) => {
  const queuedPreload = {
    load,
    priority,
    sequence: preloadSequence,
    resolve,
    reject,
  };
  preloadSequence += 1;

  const insertionIndex = preloadQueue.findIndex(entry => (
    entry.priority < priority
    || (entry.priority === priority && entry.sequence > queuedPreload.sequence)
  ));
  if (insertionIndex === -1) preloadQueue.push(queuedPreload);
  else preloadQueue.splice(insertionIndex, 0, queuedPreload);

  while (preloadQueue.length > MAX_QUEUED_PRELOADS) {
    let disposableIndex = preloadQueue.length - 1;
    while (
      disposableIndex >= 0
      && preloadQueue[disposableIndex].priority >= CRITICAL_PRIORITY
    ) {
      disposableIndex -= 1;
    }
    if (disposableIndex < 0) break;

    const [disposablePreload] = preloadQueue.splice(disposableIndex, 1);
    disposablePreload.reject(createPreloadCancelledError());
  }

  startQueuedPreloads();
});

export const resetRuntimeAssetCache = ({ deferAudio = false } = {}) => {
  const cancelledPreloads = preloadQueue.splice(0);
  cancelledPreloads.forEach(entry => {
    entry.reject(createPreloadCancelledError());
  });

  const disposableAudio = [];
  audioAssets.forEach((audio, url) => {
    if (pendingPreloads.has(url)) return;
    disposableAudio.push(audio);
  });
  audioAssets.clear();
  audioBufferGeneration += 1;
  decodedAudioBuffers.clear();
  audioDecodeRequests.clear();
  preloadRequests.clear();

  if (deferAudio && disposableAudio.length > 0) deferAudioRelease(disposableAudio);
  else disposableAudio.forEach(releaseAudioElement);
};

const preloadUrl = (url, priority) => {
  if (preloadRequests.has(url)) return refreshCacheEntry(preloadRequests, url);

  const canPreloadAsImage = priority > BACKGROUND_PRIORITY
    && process.env.NODE_ENV !== 'test'
    && typeof Image === 'function'
    && IMAGE_ASSET_PATTERN.test(url);
  const canPreloadAsAudio = process.env.NODE_ENV !== 'test'
    && typeof Audio === 'function'
    && AUDIO_ASSET_PATTERN.test(url);
  pendingPreloads.add(url);
  const request = runQueuedPreload(() => (canPreloadAsImage
    ? new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.onload = () => {
        image.onload = null;
        image.onerror = null;
        const decodeRequest = typeof image.decode === 'function'
          ? image.decode().catch(() => undefined)
          : Promise.resolve();
        decodeRequest.then(resolve);
      };
      image.onerror = () => {
        image.onload = null;
        image.onerror = null;
        reject(new Error('Image preload failed'));
      };
      image.src = url;
    })
    : canPreloadAsAudio
      ? (() => {
        const context = getLowLatencyAudioContext();
        return context
          ? decodeAudioAsset(url).catch(() => preloadNativeAudioAsset(url))
          : preloadNativeAudioAsset(url);
      })()
    : fetch(url, {
      cache: 'force-cache',
      referrerPolicy: 'no-referrer',
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
    })
  ), priority).catch(error => {
    if (preloadRequests.get(url) === request) preloadRequests.delete(url);
    throw error;
  }).finally(() => {
    pendingPreloads.delete(url);
    trimPreloadCache();
    trimAudioCache();
  });

  preloadRequests.set(url, request);
  trimPreloadCache();
  return request;
};

export const preloadAssets = async (urls, onProgress = () => {}, { priority = 0 } = {}) => {
  const uniqueUrls = [...new Set(urls)];
  const failedUrls = [];
  let completed = 0;
  let lastProgress = -1;

  const reportProgress = () => {
    const progress = uniqueUrls.length === 0
      ? 100
      : Math.round((completed / uniqueUrls.length) * 100);
    if (progress !== lastProgress) {
      lastProgress = progress;
      onProgress(progress);
    }
  };

  reportProgress();

  await Promise.all(uniqueUrls.map(async url => {
    try {
      await preloadUrl(url, priority);
    } catch (error) {
      if (error.name !== PRELOAD_CANCELLED_ERROR_NAME) failedUrls.push(url);
    }

    completed += 1;
    reportProgress();
  }));
  return failedUrls;
};
