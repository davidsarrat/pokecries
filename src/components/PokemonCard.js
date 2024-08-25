import React from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect, isVisible }) {
  const feedbackClass = isAnimating ? (isCorrect ? 'correct' : 'incorrect') : '';
  const visibilityClass = isVisible ? '' : 'hidden';

  return (
    <div className={`pokemon-card ${feedbackClass} ${visibilityClass}`} onClick={onClick}>
      <img src={`/media/sprites/${pokemon.id}.png`} alt={pokemon.name} />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;