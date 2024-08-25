import React from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect }) {
  const feedbackClass = isAnimating ? (isCorrect ? 'correct' : 'incorrect') : '';

  return (
    <div className={`pokemon-card ${feedbackClass}`} onClick={onClick}>
      <img src={`/media/sprites/${pokemon.id}.png`} alt={pokemon.name} />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;