import React, { useMemo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const PokemonGrid = React.memo(function PokemonGrid({ 
  pokemonList, 
  visiblePokemonIds, 
  onPokemonClick, 
  animatingCards, 
  isGameOver, 
  allShiny,
  pokemonTypes = {}
}) {
  const memoizedPokemonCards = useMemo(() => {
    return pokemonList.filter(pokemon => visiblePokemonIds.includes(pokemon.id)).map(pokemon => {
      const animationInfo = animatingCards.get(pokemon.id);
      return (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={() => onPokemonClick(pokemon)}
          isAnimating={!!animationInfo}
          isCorrect={animationInfo?.isCorrect}
          isGameOver={isGameOver}
          allShiny={allShiny}
          types={pokemonTypes[pokemon.id]}
        />
      );
    });
  }, [pokemonList, visiblePokemonIds, onPokemonClick, animatingCards, isGameOver, allShiny, pokemonTypes]);

  return (
    <div className="pokemon-grid" data-count={memoizedPokemonCards.length}>
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;
