import { loadPokemonTypes } from './pokemonTypes';

test('loads ordered type colors only for the supported generations', async () => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    text: () => Promise.resolve([
      'pokemon_id,type_id,slot',
      '1,12,1',
      '1,4,2',
      '4,10,1',
      '650,18,1',
    ].join('\n')),
  }));

  await expect(loadPokemonTypes()).resolves.toEqual({
    1: ['grass', 'poison'],
    4: ['fire'],
  });
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('pokemon_types.csv'), {
    cache: 'force-cache',
    referrerPolicy: 'no-referrer',
  });
});
