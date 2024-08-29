import React, { useEffect, useRef, useState } from 'react';
import './PokemonCard.css';

function PokemonCard({ pokemon, onClick, isAnimating, isCorrect, isVisible, isGameOver }) {
  const cardRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isShiny, setIsShiny] = useState(false);

  useEffect(() => {
    setIsShiny(Math.random() < 1/8192);
  }, []);

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
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const visibilityClass = isVisible ? '' : 'hidden';
  const shakeClass = isShaking ? 'shake-animation' : '';
  const spritePath = isShiny 
    ? `${process.env.PUBLIC_URL}/media/sprites/shiny/${pokemon.id}.png`
    : `${process.env.PUBLIC_URL}/media/sprites/${pokemon.id}.png`;

  return (
    <div 
      ref={cardRef}
      className={`pokemon-card ${visibilityClass} ${shakeClass}`} 
      onClick={handleClick}
    >
      <img 
        src={spritePath} 
        alt={pokemon.name} 
        className="pokemon-image"
      />
      <p className="pokemon-name">{pokemon.name}</p>
    </div>
  );
}

export default PokemonCard;