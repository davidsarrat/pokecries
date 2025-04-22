import { act, render, waitFor } from '@testing-library/react';
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

test('warms result cries before scrolled cards become clickable', async () => {
  const originalIntersectionObserver = global.IntersectionObserver;
  const observedCards = [];
  let intersectionCallback;
  const unobserve = jest.fn();
  global.IntersectionObserver = jest.fn().mockImplementation(callback => {
    intersectionCallback = callback;
    return {
      disconnect: jest.fn(),
      observe: card => observedCards.push(card),
      unobserve,
    };
  });
  preloadAssets.mockResolvedValue([]);

  try {
    render(
      <GameOverScreen
        stats={{ correctCount: 0, incorrectCount: 2, progressCount: 2 }}
        failedPokemon={[
          { id: 25, name: 'Pikachu' },
          { id: 250, name: 'Ho-Oh' },
        ]}
        onPlayAgain={() => {}}
        startTime={0}
        endTime={1000}
      />
    );

    expect(observedCards).toHaveLength(2);
    await act(async () => {
      intersectionCallback([{ isIntersecting: true, target: observedCards[1] }]);
    });

    expect(unobserve).toHaveBeenCalledWith(observedCards[1]);
    expect(preloadAssets).toHaveBeenCalledWith(
      [pokemonCryUrl('250')],
      undefined,
      { priority: 100 }
    );
  } finally {
    global.IntersectionObserver = originalIntersectionObserver;
  }
});

test('renders the exact missed form and shiny state', () => {
  preloadAssets.mockResolvedValue([]);
  render(
    <GameOverScreen
      stats={{ correctCount: 0, incorrectCount: 1, progressCount: 1 }}
      failedPokemon={[
        { id: 422, name: 'Shellos', spriteVariant: 'east', isShiny: true },
      ]}
      onPlayAgain={() => {}}
      startTime={0}
      endTime={1000}
    />
  );

  expect(document.querySelector('.failed-pokemon-grid img')).toHaveAttribute(
    'src',
    expect.stringMatching(/animated\/shiny\/422-east\.gif$/)
  );
});
