import React, { useEffect, useRef, useState } from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect, isVisible, isGameOver }) {
  const cardRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      const card = cardRef.current;
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = null;
      card.classList.remove('correct-animation', 'incorrect-animation', 'shake-animation');
      void card.offsetWidth;
      if (isGameOver) {
        card.classList.add('shake-animation');
      } else {
        card.classList.add(isCorrect ? 'correct-animation' : 'incorrect-animation');
      }
    }
  }, [isAnimating, isCorrect, isGameOver]);

  const handleClick = () => {
    const card = cardRef.current;
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = null;
    card.classList.remove('correct-animation', 'incorrect-animation', 'shake-animation');
    onClick();
    if (isGameOver) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Reset shaking after 0.5s
    }
  };

  const visibilityClass = isVisible ? '' : 'hidden';
  const shakeClass = isShaking ? 'shake-animation' : '';

  return (
    <div 
      ref={cardRef}
      className={`pokemon-card ${visibilityClass} ${shakeClass}`} 
      onClick={handleClick}
    >
      <img 
        src={`${process.env.PUBLIC_URL}/media/sprites/${pokemon.id}.png`} 
        alt={pokemon.name} 
        className="pokemon-image"
      />
      <p className="pokemon-name">{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;