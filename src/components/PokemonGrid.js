import React from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

function PokemonGrid({ pokemonList, onPokemonClick }) {
  return (
    <div className="pokemon-grid">
      {pokemonList.map(pokemon => (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={() => onPokemonClick(pokemon)}
        />
      ))}
    </div>
  );
}

export default PokemonGrid;