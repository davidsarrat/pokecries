import React from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

function PokemonGrid({ pokemonList, onPokemonClick, currentPokemon, selectedPokemon, onAnimationEnd }) {
  return (
    <div className="pokemon-grid">
      {pokemonList.map(pokemon => (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={() => onPokemonClick(pokemon)}
          isCorrect={selectedPokemon && pokemon.id === selectedPokemon.id && pokemon.id === currentPokemon.id}
          isIncorrect={selectedPokemon && pokemon.id === selectedPokemon.id && pokemon.id !== currentPokemon.id}
          onAnimationEnd={onAnimationEnd}
        />
      ))}
    </div>
  );
}

export default PokemonGrid;