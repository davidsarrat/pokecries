import React, { useEffect, useRef } from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect, isVisible }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (isAnimating) {
      const card = cardRef.current;
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = null;
      card.classList.remove('correct-animation', 'incorrect-animation');
      void card.offsetWidth;
      card.classList.add(isCorrect ? 'correct-animation' : 'incorrect-animation');
    }
  }, [isAnimating, isCorrect]);

  const handleClick = () => {
    const card = cardRef.current;
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = null;
    card.classList.remove('correct-animation', 'incorrect-animation');
    onClick();
  };

  const visibilityClass = isVisible ? '' : 'hidden';

  return (
    <div 
      ref={cardRef}
      className={`pokemon-card ${visibilityClass}`} 
      onClick={handleClick}
    >
      <img 
        src={`/media/sprites/${pokemon.id}.png`} 
        alt={pokemon.name} 
        className="pokemon-image"
      />
      <p className="pokemon-name">{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;