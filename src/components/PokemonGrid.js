import React from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

function PokemonGrid({ pokemonList, onPokemonClick, currentPokemon, animatingCards }) {
  return (
    <div className="pokemon-grid">
      {pokemonList.map(pokemon => {
        const animationInfo = animatingCards.get(pokemon.id);
        return (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onClick={() => onPokemonClick(pokemon)}
            isAnimating={!!animationInfo}
            isCorrect={animationInfo?.isCorrect}
          />
        );
      })}
    </div>
  );
}

export default PokemonGrid;