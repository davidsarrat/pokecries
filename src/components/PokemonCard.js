import React, { useEffect, useRef, useState } from 'react';
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
  isGameOver, 
  allShiny,
  animated = true,
  imageLoading = 'eager',
  showAnswerFeedback = true,
  types = []
}) {
  const [isTapping, setIsTapping] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const tapTimeoutRef = useRef(null);
  const answerTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
  }, []);

  const triggerTap = () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    setIsTapping(true);
    tapTimeoutRef.current = setTimeout(() => setIsTapping(false), 380);
  };

  const setTapOrigin = (event) => {
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--tap-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--tap-y', `${event.clientY - bounds.top}px`);
  };

  const handleClick = () => {
    if (isGameOver) {
      triggerTap();
      onClick(pokemon);
      return;
    }

    const isCorrect = onClick(pokemon);
    if (typeof isCorrect !== 'boolean') return;

    triggerTap();
    if (showAnswerFeedback) {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
      answerTimeoutRef.current = setTimeout(() => setAnswerFeedback(null), 500);
    }
  };

  const cardClassName = `
    pokemon-card 
    ${isTapping ? 'tap-animation' : ''}
    ${answerFeedback ? `answer-${answerFeedback}` : ''}
  `;
  
  const isShiny = isGameOver ? Boolean(pokemon.isShiny) : allShiny;
  const spritePath = animated
    ? animatedPokemonSpriteUrl(pokemon.id, isShiny, pokemon.spriteVariant)
    : pokemonSpriteUrl(pokemon.id, isShiny, pokemon.spriteVariant);
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
      data-pokemon-id={pokemon.id}
      onClick={handleClick}
      onPointerDown={setTapOrigin}
      style={cardStyle}
    >
      <span className="pokemon-sprite-frame">
        <img
          src={spritePath}
          alt={pokemon.name}
          className="pokemon-image"
          decoding="async"
          loading={imageLoading}
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
