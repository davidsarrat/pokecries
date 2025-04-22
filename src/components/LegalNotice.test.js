import { act, fireEvent, render, screen } from '@testing-library/react';
import LegalNotice from './LegalNotice';

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('keeps the legal content mounted while its closing animation runs', () => {
  render(<LegalNotice />);
  const summary = screen.getByText('Legal information');
  const details = summary.closest('details');

  fireEvent.click(summary);
  expect(details).toHaveAttribute('open');

  fireEvent.click(summary);
  expect(details).toHaveAttribute('open');
  expect(details).toHaveClass('is-closing');

  act(() => jest.advanceTimersByTime(300));
  expect(details).not.toHaveAttribute('open');
  expect(details).not.toHaveClass('is-closing');
});
