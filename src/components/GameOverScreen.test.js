import { act, fireEvent, render, waitFor } from '@testing-library/react';
import GameOverScreen from './GameOverScreen';
import { getPokemonCryAudio, pokemonCryUrl, preloadAssets } from '../utils/assetUrls';
import { getEagerDensePokemonCount } from '../utils/renderPerformance';

jest.mock('../utils/assetUrls', () => {
  const actual = jest.requireActual('../utils/assetUrls');
  return {
    ...actual,
    getPokemonCryAudio: jest.fn(),
    preloadAssets: jest.fn().mockResolvedValue([]),
  };
});

jest.mock('../utils/scrollUtils', () => ({
  scrollToTop: jest.fn(),
}));

test('preloads the first result cries without competing with direct playback', async () => {
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
      failedPokemon
        .slice(0, getEagerDensePokemonCount())
        .map(pokemon => pokemonCryUrl(pokemon.id)),
      undefined,
      { priority: 10 }
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
      { priority: 10 }
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

test('starts a selected result cry and immediately cuts the previous one', async () => {
  jest.useFakeTimers();
  preloadAssets.mockResolvedValue([]);
  const createAudio = () => ({
    currentTime: 0,
    error: null,
    networkState: 1,
    onended: null,
    onerror: null,
    onplaying: null,
    onstalled: null,
    onwaiting: null,
    pause: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
    readyState: 4,
  });
  const firstAudio = createAudio();
  const secondAudio = createAudio();
  getPokemonCryAudio
    .mockReset()
    .mockReturnValueOnce(firstAudio)
    .mockReturnValueOnce(secondAudio);

  try {
    const { container } = render(
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
    const cards = container.querySelectorAll('.pokemon-card');

    fireEvent.pointerUp(cards[0], { button: 0 });
    fireEvent.click(cards[0]);
    fireEvent.pointerUp(cards[1], { button: 0 });
    fireEvent.click(cards[1]);
    await act(async () => Promise.resolve());

    expect(firstAudio.play).toHaveBeenCalledTimes(1);
    expect(firstAudio.pause).toHaveBeenCalledTimes(1);
    expect(secondAudio.play).toHaveBeenCalledTimes(1);
  } finally {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  }
});
