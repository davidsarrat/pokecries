import React, { useState } from 'react';
import './PokemonCard.css';
import { pokemonSpriteUrl } from '../utils/assetUrls';

const PokemonCard = React.memo(function PokemonCard({ 
  pokemon, 
  onClick, 
  isAnimating, 
  isCorrect, 
  isGameOver, 
  allShiny
}) {
  const [isShaking, setIsShaking] = useState(false);
  const [isTapping, setIsTapping] = useState(false);

  const handleClick = () => {
    if (isGameOver) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      setIsTapping(true);
      setTimeout(() => setIsTapping(false), 150);
    }
    onClick();
  };

  const cardClassName = `
    pokemon-card 
    ${isShaking ? 'shake-animation' : ''}
    ${isTapping ? 'tap-animation' : ''}
  `;
  
  const spritePath = pokemonSpriteUrl(pokemon.id, allShiny && !isGameOver);

  return (
    <div 
      className={cardClassName}
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
});

export default PokemonCard;
