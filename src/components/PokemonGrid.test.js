import { render } from '@testing-library/react';
import PokemonGrid, { getBalancedColumnCount } from './PokemonGrid';

test.each([
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 3],
  [6, 3],
  [7, 4],
  [8, 4],
  [9, 3],
  [10, 5],
  [11, 4],
  [12, 4],
  [13, 7],
  [14, 7],
  [15, 5],
  [16, 4],
  [17, 6],
  [18, 6],
  [19, 5],
  [20, 5],
  [21, 7],
  [22, 6],
  [23, 6],
  [24, 6],
  [25, 5],
  [26, 9],
  [27, 9],
  [28, 7],
  [29, 6],
  [30, 6],
])('balances %i cards across %i columns', (cardCount, expectedColumns) => {
  expect(getBalancedColumnCount(cardCount)).toBe(expectedColumns);
});

test('defers off-screen sprites in dense lists', () => {
  const pokemonList = Array.from({ length: 46 }, (_, index) => ({
    id: index + 1,
    name: `Pokémon ${index + 1}`,
  }));
  const { container } = render(
    <PokemonGrid
      pokemonList={pokemonList}
      visiblePokemonIds={pokemonList.map(pokemon => pokemon.id)}
      onPokemonClick={() => false}
      denseGrid={true}
      animatedSprites={false}
    />
  );
  const images = container.querySelectorAll('.pokemon-image');
  const grid = container.querySelector('.pokemon-grid');

  expect(grid).toHaveAttribute('data-compact-tail', 'split-four');
  expect(images[0]).toHaveAttribute('loading', 'eager');
  expect(images[43]).toHaveAttribute('loading', 'eager');
  expect(images[44]).toHaveAttribute('loading', 'lazy');
});

test('avoids orphaned final rows in balanced layouts', () => {
  for (let cardCount = 5; cardCount <= 30; cardCount += 1) {
    expect(cardCount % getBalancedColumnCount(cardCount)).not.toBe(1);
  }
});

test.each([
  [31, 11],
  [36, 9],
  [40, 10],
  [44, 11],
  [151, 11],
  [156, 10],
  [251, 11],
  [649, 11],
])('uses the available width harmoniously for %i cards', (cardCount, expectedColumns) => {
  expect(getBalancedColumnCount(cardCount)).toBe(expectedColumns);
});
