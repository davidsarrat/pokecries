import { render, waitFor } from '@testing-library/react';
import GameOverScreen from './GameOverScreen';
import { pokemonCryUrl, preloadAssets } from '../utils/assetUrls';

jest.mock('../utils/assetUrls', () => {
  const actual = jest.requireActual('../utils/assetUrls');
  return {
    ...actual,
    preloadAssets: jest.fn().mockResolvedValue([]),
  };
});

jest.mock('../utils/scrollUtils', () => ({
  scrollToTop: jest.fn(),
}));

test('preloads the first result cries at high priority', async () => {
  preloadAssets.mockResolvedValue([]);
  const failedPokemon = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    name: `Pokémon ${index + 1}`,
  }));

  render(
    <GameOverScreen
      stats={{ correctCount: 0, incorrectCount: 30, progressCount: 30 }}
      failedPokemon={failedPokemon}
      onPlayAgain={() => {}}
      startTime={0}
      endTime={1000}
    />
  );

  await waitFor(() => {
    expect(preloadAssets).toHaveBeenCalledWith(
      failedPokemon.slice(0, 24).map(pokemon => pokemonCryUrl(pokemon.id)),
      undefined,
      { priority: 100 }
    );
  });
});
