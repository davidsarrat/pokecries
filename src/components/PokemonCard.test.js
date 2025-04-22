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
