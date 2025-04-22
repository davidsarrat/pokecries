const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon/versions/generation-v';
const POKEMON_SPRITES_ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon';
const CRIES_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/ef687b18f0ce17169b4b4c09175819f7ade92f0f/cries/pokemon/legacy';
const GENERATION_ICON_IDS = {
  gen1: '25',
  gen2: '250',
  gen3: '384',
  gen4: '448',
  gen5: '571',
};
const preloadRequests = new Map();
const audioAssets = new Map();
const IMAGE_ASSET_PATTERN = /\.(?:gif|png|jpe?g|webp)$/i;
const AUDIO_ASSET_PATTERN = /\.ogg$/i;

export const pokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}${pokemonId}.png`;

export const pokemonCryUrl = (pokemonId) => `${CRIES_BASE}/${pokemonId}.ogg`;

const getAudioAsset = (url) => {
  if (!audioAssets.has(url)) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audioAssets.set(url, audio);
  }
  return audioAssets.get(url);
};

export const getPokemonCryAudio = (pokemonId) => getAudioAsset(pokemonCryUrl(pokemonId));

export const unknownPokemonSpriteUrl = () => `${POKEMON_SPRITES_ROOT}/0.png`;

export const animatedPokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}${pokemonId}.gif`;

export const generationIconUrl = (generationKey) =>
  animatedPokemonSpriteUrl(GENERATION_ICON_IDS[generationKey]);

export const pokemonSpriteAssetUrls = (pokemonId) => [
  animatedPokemonSpriteUrl(pokemonId),
  animatedPokemonSpriteUrl(pokemonId, true),
];

export const pokemonAssetUrls = (pokemonId) => [
  ...pokemonSpriteAssetUrls(pokemonId),
  pokemonCryUrl(pokemonId),
];

const preloadUrl = (url) => {
  if (!preloadRequests.has(url)) {
    const canPreloadAsImage = process.env.NODE_ENV !== 'test'
      && typeof Image === 'function'
      && IMAGE_ASSET_PATTERN.test(url);
    const canPreloadAsAudio = process.env.NODE_ENV !== 'test'
      && typeof Audio === 'function'
      && AUDIO_ASSET_PATTERN.test(url);
    const request = (canPreloadAsImage
      ? new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => {
          const decodeRequest = typeof image.decode === 'function'
            ? image.decode().catch(() => undefined)
            : Promise.resolve();
          decodeRequest.then(() => resolve(image));
        };
        image.onerror = () => reject(new Error('Image preload failed'));
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
    ).catch(error => {
      preloadRequests.delete(url);
      throw error;
    });

    preloadRequests.set(url, request);
  }

  return preloadRequests.get(url);
};

export const preloadAssets = async (urls, onProgress = () => {}) => {
  const uniqueUrls = [...new Set(urls)];
  const failedUrls = [];
  let nextIndex = 0;
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

  const preloadNext = async () => {
    while (nextIndex < uniqueUrls.length) {
      const url = uniqueUrls[nextIndex];
      nextIndex += 1;

      try {
        await preloadUrl(url);
      } catch (error) {
        failedUrls.push(url);
      }

      completed += 1;
      reportProgress();
    }
  };

  const workerCount = Math.min(12, uniqueUrls.length);
  await Promise.all(Array.from({ length: workerCount }, preloadNext));
  return failedUrls;
};
