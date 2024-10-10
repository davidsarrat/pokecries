import React, { useMemo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const PokemonGrid = React.memo(function PokemonGrid({ 
  pokemonList, 
  visiblePokemonIds, 
  onPokemonClick, 
  currentPokemon, 
  animatingCards, 
  isGameOver, 
  totalAvailablePokemon, 
  allShiny 
}) {
  const memoizedPokemonCards = useMemo(() => {
    return pokemonList.map(pokemon => {
      const animationInfo = animatingCards.get(pokemon.id);
      const isVisible = visiblePokemonIds.includes(pokemon.id);
      return (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={() => onPokemonClick(pokemon)}
          isAnimating={!!animationInfo}
          isCorrect={animationInfo?.isCorrect}
          isVisible={isVisible}
          isGameOver={isGameOver}
          totalAvailablePokemon={totalAvailablePokemon}
          allShiny={allShiny}
        />
      );
    });
  }, [pokemonList, visiblePokemonIds, onPokemonClick, animatingCards, isGameOver, totalAvailablePokemon, allShiny]);

  return (
    <div className="pokemon-grid">
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;