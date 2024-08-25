import React from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect }) {
  const feedback = isAnimating ? (isCorrect ? 'correct' : 'incorrect') : '';

  return (
    <div className={`pokemon-card ${feedback}`} onClick={onClick}>
      <img src={`/media/sprites/${pokemon.id}.png`} alt={pokemon.name} />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;