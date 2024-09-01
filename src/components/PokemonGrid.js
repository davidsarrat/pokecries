import React from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

function PokemonGrid({ pokemonList, visiblePokemon, onPokemonClick, currentPokemon, animatingCards, isGameOver, totalAvailablePokemon, allShiny }) {
  return (
    <div className="pokemon-grid">
      {pokemonList.map(pokemon => {
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
      })}
    </div>
  );
}

export default PokemonGrid;