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
const pendingPreloads = new Set();
const preloadQueue = [];
const MAX_RETAINED_ASSETS = 128;
const MAX_RETAINED_AUDIO = 24;
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

const refreshCacheEntry = (cache, key) => {
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
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

const discardAudioAsset = (url) => {
  const audio = audioAssets.get(url);
  if (!audio) return;

  audio.onended = null;
  audio.onerror = null;
  audio.onplaying = null;
  audio.onstalled = null;
  audio.onwaiting = null;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  audioAssets.delete(url);
  preloadRequests.delete(url);
};

const getAudioAsset = (url) => {
  const cachedAudio = audioAssets.get(url);
  if (cachedAudio && (cachedAudio.error || cachedAudio.networkState === 3)) {
    discardAudioAsset(url);
  }

  if (audioAssets.has(url)) return refreshCacheEntry(audioAssets, url);

  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  audioAssets.set(url, audio);
  trimAudioCache();
  return audio;
};

export const getPokemonCryAudio = (pokemonId, { forceReload = false } = {}) => {
  const url = pokemonCryUrl(pokemonId);
  if (forceReload) discardAudioAsset(url);
  return getAudioAsset(url);
};

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

export const resetRuntimeAssetCache = () => {
  const cancelledPreloads = preloadQueue.splice(0);
  cancelledPreloads.forEach(entry => {
    entry.reject(createPreloadCancelledError());
  });

  audioAssets.forEach((audio, url) => {
    if (pendingPreloads.has(url)) return;
    audio.onended = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  });
  audioAssets.clear();
  preloadRequests.clear();
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
      ? new Promise((resolve, reject) => {
        const audio = getAudioAsset(url);
        if (audio.readyState >= 3) {
          resolve(audio);
          return;
        }

        const cleanup = () => {
          audio.removeEventListener('canplay', handleReady);
          audio.removeEventListener('error', handleError);
        };
        const handleReady = () => {
          cleanup();
          trimAudioCache();
          resolve(audio);
        };
        const handleError = () => {
          cleanup();
          audioAssets.delete(url);
          reject(new Error('Audio preload failed'));
        };

        audio.addEventListener('canplay', handleReady);
        audio.addEventListener('error', handleError);
        audio.load();
      })
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
