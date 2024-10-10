import React, { useMemo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const PokemonGrid = React.memo(function PokemonGrid({ pokemonList, visiblePokemon, onPokemonClick, currentPokemon, animatingCards, isGameOver, totalAvailablePokemon, allShiny }) {
  console.log("PokemonGrid rendering with visiblePokemon:", visiblePokemon);

  const memoizedPokemonCards = useMemo(() => {
    return visiblePokemon.map(pokemon => {
      const animationInfo = animatingCards.get(pokemon.id);
      return (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={() => onPokemonClick(pokemon)}
          isAnimating={!!animationInfo}
          isCorrect={animationInfo?.isCorrect}
          isVisible={true}
          isGameOver={isGameOver}
          totalAvailablePokemon={totalAvailablePokemon}
          allShiny={allShiny}
        />
      );
    });
  }, [visiblePokemon, onPokemonClick, animatingCards, isGameOver, totalAvailablePokemon, allShiny]);

  return (
    <div className="pokemon-grid">
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;