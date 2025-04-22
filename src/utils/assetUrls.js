const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/1435ac9b294901a0d3e8874aa69d76d038c1d65d/sprites/pokemon/versions/generation-v';
const CRIES_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/ef687b18f0ce17169b4b4c09175819f7ade92f0f/cries/pokemon/legacy';
const GENERATION_ICON_IDS = {
  gen1: '25',
  gen2: '250',
  gen3: '384',
  gen4: '448',
  gen5: '571',
};
const preloadRequests = new Map();

export const pokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/${shiny ? 'shiny/' : ''}${pokemonId}.png`;

export const pokemonCryUrl = (pokemonId) => `${CRIES_BASE}/${pokemonId}.ogg`;

export const animatedPokemonSpriteUrl = (pokemonId, shiny = false) =>
  `${SPRITES_BASE}/black-white/animated/${shiny ? 'shiny/' : ''}${pokemonId}.gif`;

export const generationIconUrl = (generationKey) =>
  animatedPokemonSpriteUrl(GENERATION_ICON_IDS[generationKey]);

export const pokemonAssetUrls = (pokemonId) => [
  pokemonSpriteUrl(pokemonId),
  pokemonSpriteUrl(pokemonId, true),
  pokemonCryUrl(pokemonId),
];

const preloadUrl = (url) => {
  if (!preloadRequests.has(url)) {
    const request = fetch(url, {
      cache: 'force-cache',
      referrerPolicy: 'no-referrer',
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
    }).catch(error => {
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
