import React, { useEffect, useState } from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect, isVisible }) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isAnimating) {
      setAnimationClass(isCorrect ? 'correct-animation' : 'incorrect-animation');
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 1000); // Duración de la animación aumentada a 1 segundo
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isCorrect]);

  const visibilityClass = isVisible ? '' : 'hidden';

  return (
    <div 
      className={`pokemon-card ${animationClass} ${visibilityClass}`} 
      onClick={onClick}
    >
      <div className="card-inner">
        <div className="card-front">
          <img 
            src={`/media/sprites/${pokemon.id}.png`} 
            alt={pokemon.name} 
            className="pokemon-image"
          />
          <p className="pokemon-name">{pokemon.name}</p>
        </div>
        <div className="card-back">
          <div className="feedback-icon"></div>
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;