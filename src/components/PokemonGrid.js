import React, { useMemo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const PokemonGrid = React.memo(function PokemonGrid({ pokemonList, visiblePokemon, onPokemonClick, currentPokemon, animatingCards, isGameOver, totalAvailablePokemon, allShiny }) {
  const memoizedPokemonCards = useMemo(() => {
    return pokemonList.map(pokemon => {
      const animationInfo = animatingCards.get(pokemon.id);
      const isVisible = visiblePokemon.some(p => p.id === pokemon.id);
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
  }, [pokemonList, visiblePokemon, onPokemonClick, animatingCards, isGameOver, totalAvailablePokemon, allShiny]);

  return (
    <div className="pokemon-grid">
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;