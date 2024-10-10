import React, { useState } from 'react';
import './PokemonCard.css';

const PokemonCard = React.memo(function PokemonCard({ 
  pokemon, 
  onClick, 
  isAnimating, 
  isCorrect, 
  isVisible, 
  isGameOver, 
  totalAvailablePokemon, 
  allShiny 
}) {
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = () => {
    if (isGameOver) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    onClick();
  };

  const cardClassName = `
    pokemon-card 
    ${isVisible ? '' : 'hidden'} 
    ${isAnimating && isCorrect && !isGameOver ? 'correct-animation' : ''}
    ${isAnimating && !isCorrect && !isGameOver ? 'incorrect-animation' : ''}
    ${isShaking ? 'shake-animation' : ''}
  `;
  
  const spritePath = (allShiny && !isGameOver) 
    ? `${process.env.PUBLIC_URL}/media/sprites/shiny/${pokemon.id}.png`
    : `${process.env.PUBLIC_URL}/media/sprites/${pokemon.id}.png`;

  return (
    <div 
      className={cardClassName}
      onClick={isVisible || isGameOver ? handleClick : undefined}
    >
      <img 
        src={spritePath} 
        alt={pokemon.name} 
        className="pokemon-image"
      />
      <p className="pokemon-name">{pokemon.name}</p>
    </div>
  );
});

export default PokemonCard;