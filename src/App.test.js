import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./utils/assetUrls', () => {
  const actual = jest.requireActual('./utils/assetUrls');
  return {
    ...actual,
    preloadAssets: (urls, onProgress) => {
      onProgress(100);
      return Promise.resolve([]);
    },
  };
});

jest.mock('./utils/pokemonTypes', () => ({
  loadPokemonTypes: () => Promise.resolve({}),
}));

jest.mock('./utils/scrollUtils', () => ({
  scrollToTop: () => {},
}));

test('identifies the project as unofficial and links its legal notice', async () => {
  render(<App />);
  expect(screen.getByText(/unofficial, non-commercial fan project/i)).toBeInTheDocument();
  expect(screen.getByText(/legal/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
});
