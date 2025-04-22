import React, { useState } from 'react';
import './PokemonCard.css';
import { animatedPokemonSpriteUrl, pokemonSpriteUrl } from '../utils/assetUrls';
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
  animated = true,
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
      setTimeout(() => setIsTapping(false), 380);
    }
    onClick(pokemon);
  };

  const cardClassName = `
    pokemon-card 
    ${isShaking ? 'shake-animation' : ''}
    ${isTapping ? 'tap-animation' : ''}
    ${isAnimating ? (isCorrect ? 'answer-correct' : 'answer-wrong') : ''}
  `;
  
  const isShiny = allShiny && !isGameOver;
  const spritePath = animated
    ? animatedPokemonSpriteUrl(pokemon.id, isShiny)
    : pokemonSpriteUrl(pokemon.id, isShiny);
  const primaryColor = pokemonTypeColors[types[0]] || pokemonTypeColors.normal;
  const secondaryColor = pokemonTypeColors[types[1]] || primaryColor;
  const cardStyle = {
    '--card-type-primary': colorWithOpacity(primaryColor, 0.18),
    '--card-type-secondary': colorWithOpacity(secondaryColor, 0.12),
  };

  return (
    <button
      type="button"
      className={cardClassName}
      onClick={handleClick}
      style={cardStyle}
    >
      <span className="pokemon-sprite-frame">
        <img
          src={spritePath}
          alt={pokemon.name}
          className="pokemon-image"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = pokemonSpriteUrl(pokemon.id, isShiny);
          }}
        />
      </span>
      <p className="pokemon-name">{pokemon.name}</p>
    </button>
  );
});

export default PokemonCard;
