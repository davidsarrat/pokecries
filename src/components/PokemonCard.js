import React, { useState } from 'react';
import './PokemonCard.css';
import { pokemonSpriteUrl } from '../utils/assetUrls';
import pokemonTypeColors from '../data/pokemonTypeColors';

const colorWithOpacity = (hexColor, opacity) => {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const PokemonCard = React.memo(function PokemonCard({ 
  pokemon, 
  onClick, 
  isAnimating, 
  isCorrect, 
  isGameOver, 
  allShiny,
  types = []
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
  const primaryColor = pokemonTypeColors[types[0]] || pokemonTypeColors.normal;
  const secondaryColor = pokemonTypeColors[types[1]] || primaryColor;
  const cardStyle = {
    '--card-type-primary': colorWithOpacity(primaryColor, 0.18),
    '--card-type-secondary': colorWithOpacity(secondaryColor, 0.12),
  };

  return (
    <div 
      className={cardClassName}
      onClick={handleClick}
      style={cardStyle}
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
