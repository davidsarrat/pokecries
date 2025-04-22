import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getPokemonCryAudio } from './utils/assetUrls';

const mockMenuAudio = {
  currentTime: 0,
  onended: null,
  onerror: null,
  pause: jest.fn(),
  play: jest.fn().mockResolvedValue(undefined),
  readyState: 4,
};

jest.mock('./utils/assetUrls', () => {
  const actual = jest.requireActual('./utils/assetUrls');
  return {
    ...actual,
    getPokemonCryAudio: jest.fn(() => mockMenuAudio),
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

beforeEach(() => {
  localStorage.clear();
  getPokemonCryAudio.mockImplementation(() => mockMenuAudio);
  mockMenuAudio.pause.mockClear();
  mockMenuAudio.play.mockResolvedValue(undefined);
  mockMenuAudio.onerror = null;
});

test('identifies the project as unofficial and links its legal notice', async () => {
  render(<App />);
  expect(screen.getByText(/unofficial, non-commercial fan project/i)).toBeInTheDocument();
  expect(screen.getByText(/legal/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
});

test('plays and immediately replaces menu cries from generation and hardcore controls', async () => {
  render(<App />);
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: 'Gen II icon Gen II' }));
  expect(getPokemonCryAudio).toHaveBeenLastCalledWith('250', { forceReload: false });
  expect(mockMenuAudio.play).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Gen II icon Gen II' }));
  expect(getPokemonCryAudio).toHaveBeenCalledTimes(1);
  expect(mockMenuAudio.play).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('checkbox', { name: /hardcore/i }));
  expect(getPokemonCryAudio).toHaveBeenLastCalledWith('491', { forceReload: false });
  expect(mockMenuAudio.pause).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('checkbox', { name: /hardcore/i }));
  expect(getPokemonCryAudio).toHaveBeenLastCalledWith('441', { forceReload: false });
  expect(mockMenuAudio.pause).toHaveBeenCalledTimes(2);
  expect(mockMenuAudio.play).toHaveBeenCalledTimes(3);
});

test('replaces a failed menu cry once without queuing playback', async () => {
  const playbackError = new Error('stale audio');
  const failedAudio = {
    ...mockMenuAudio,
    onended: null,
    onerror: null,
    pause: jest.fn(),
    play: jest.fn().mockRejectedValue(playbackError),
  };
  const replacementAudio = {
    ...mockMenuAudio,
    onended: null,
    onerror: null,
    pause: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
  };
  getPokemonCryAudio
    .mockReturnValueOnce(failedAudio)
    .mockReturnValueOnce(replacementAudio);

  render(<App />);
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Gen II icon Gen II' }));

  await waitFor(() => {
    expect(getPokemonCryAudio).toHaveBeenNthCalledWith(1, '250', { forceReload: false });
    expect(getPokemonCryAudio).toHaveBeenNthCalledWith(2, '250', { forceReload: true });
  });
  expect(failedAudio.pause).toHaveBeenCalledTimes(1);
  expect(replacementAudio.play).toHaveBeenCalledTimes(1);
});
