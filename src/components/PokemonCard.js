import React from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick }) {
  return (
    <div className="pokemon-card" onClick={onClick}>
      <img src={`/media/sprites/${pokemon.id}.png`} alt={pokemon.name} />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;