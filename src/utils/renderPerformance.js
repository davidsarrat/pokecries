export const MAX_ANIMATED_POKEMON = 10;
export const EAGER_DENSE_POKEMON = 44;

export const shouldAnimatePokemon = count => count <= MAX_ANIMATED_POKEMON;

export const getEagerDensePokemonCount = (viewportWidth = (
  typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth
)) => {
  if (viewportWidth <= 576) return 18;
  if (viewportWidth <= 1000) return 30;
  return EAGER_DENSE_POKEMON;
};
