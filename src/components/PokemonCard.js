import React, { useState, useEffect } from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isCorrect, isIncorrect }) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isCorrect) {
      setFeedback('correct');
    } else if (isIncorrect) {
      setFeedback('incorrect');
    } else {
      setFeedback('');
    }

    const timer = setTimeout(() => {
      setFeedback('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [isCorrect, isIncorrect]);

  return (
    <div className={`pokemon-card ${feedback}`} onClick={onClick}>
      <img src={`/media/sprites/${pokemon.id}.png`} alt={pokemon.name} />
      <p>{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;