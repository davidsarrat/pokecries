import React from 'react';
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
  const cardClassName = `pokemon-card ${isVisible ? '' : 'hidden'} ${isAnimating ? (isCorrect ? 'correct-animation' : 'incorrect-animation') : ''}`;
  
  const spritePath = (allShiny && !isGameOver) 
    ? `${process.env.PUBLIC_URL}/media/sprites/shiny/${pokemon.id}.png`
    : `${process.env.PUBLIC_URL}/media/sprites/${pokemon.id}.png`;

  return (
    <div 
      className={cardClassName}
      onClick={isVisible ? onClick : undefined}
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