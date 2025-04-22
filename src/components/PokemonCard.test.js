import { fireEvent, render, screen } from '@testing-library/react';
import PokemonCard from './PokemonCard';

const pokemon = { id: 25, name: 'Pikachu' };

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('keeps limited-answer feedback neutral', () => {
  render(
    <PokemonCard
      pokemon={pokemon}
      onClick={() => false}
      isGameOver={false}
      allShiny={false}
      animated={false}
      showAnswerFeedback={false}
    />
  );

  const card = screen.getByRole('button');
  fireEvent.click(card);

  expect(card).toHaveClass('tap-animation');
  expect(card).not.toHaveClass('answer-correct');
  expect(card).not.toHaveClass('answer-wrong');
});

test('keeps colored feedback in no-limited mode', () => {
  render(
    <PokemonCard
      pokemon={pokemon}
      onClick={() => true}
      isGameOver={false}
      allShiny={false}
      animated={false}
      showAnswerFeedback={true}
    />
  );

  const card = screen.getByRole('button');
  fireEvent.click(card);

  expect(card).toHaveClass('tap-animation');
  expect(card).toHaveClass('answer-correct');
});

test('starts pointer feedback at the exact pressed position', () => {
  render(
    <PokemonCard
      pokemon={pokemon}
      onClick={() => true}
      isGameOver={false}
      allShiny={false}
      animated={false}
    />
  );

  const card = screen.getByRole('button');
  jest.spyOn(card, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 30 });
  fireEvent(card, new MouseEvent('pointerdown', {
    bubbles: true,
    clientX: 45,
    clientY: 75,
  }));

  expect(card.style.getPropertyValue('--tap-x')).toBe('25px');
  expect(card.style.getPropertyValue('--tap-y')).toBe('45px');
});

test('keeps the missed form and shiny state on the game-over card', () => {
  render(
    <PokemonCard
      pokemon={{ id: 422, name: 'Shellos', spriteVariant: 'east', isShiny: true }}
      onClick={() => {}}
      isGameOver={true}
      animated={true}
    />
  );

  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/animated\/shiny\/422-east\.gif$/)
  );
});
