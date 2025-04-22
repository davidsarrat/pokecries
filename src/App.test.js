import { render, screen } from '@testing-library/react';
import App from './App';

test('identifies the project as unofficial and links its legal notice', () => {
  render(<App />);
  expect(screen.getByText(/unofficial, non-commercial fan project/i)).toBeInTheDocument();
  expect(screen.getByText(/legal/i)).toBeInTheDocument();
});
