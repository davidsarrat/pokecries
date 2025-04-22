import React from 'react';
import './PokemonCard.css';
import { animatedPokemonSpriteUrl, pokemonSpriteUrl } from '../utils/assetUrls';
import pokemonTypeColors from '../data/pokemonTypeColors';

const tapTimers = new WeakMap();
const answerTimers = new WeakMap();

const colorWithOpacity = (hexColor, opacity) => {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const cardStyles = new Map();

const getCardStyle = (types) => {
  const primaryColor = pokemonTypeColors[types[0]] || pokemonTypeColors.normal;
  const secondaryColor = pokemonTypeColors[types[1]] || primaryColor;
  const cacheKey = `${primaryColor}:${secondaryColor}`;

  if (!cardStyles.has(cacheKey)) {
    cardStyles.set(cacheKey, {
      '--card-type-primary': colorWithOpacity(primaryColor, 0.18),
      '--card-type-secondary': colorWithOpacity(secondaryColor, 0.12),
    });
  }

  return cardStyles.get(cacheKey);
};

const showTemporaryClass = (card, className, duration, timers) => {
  const previousTimer = timers.get(card);
  if (previousTimer) clearTimeout(previousTimer);

  card.classList.add(className);
  const timer = setTimeout(() => {
    card.classList.remove(className);
    timers.delete(card);
  }, duration);
  timers.set(card, timer);
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
  const triggerTap = (card) => {
    showTemporaryClass(card, 'tap-animation', 380, tapTimers);
  };

  const setTapOrigin = (event) => {
    const card = event.currentTarget;
    const { offsetX, offsetY } = event.nativeEvent || {};
    if (Number.isFinite(offsetX) && Number.isFinite(offsetY)) {
      card.style.setProperty('--tap-x', `${offsetX}px`);
      card.style.setProperty('--tap-y', `${offsetY}px`);
      return;
    }
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--tap-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--tap-y', `${event.clientY - bounds.top}px`);
  };

  const handleClick = (event) => {
    const card = event.currentTarget;
    if (isGameOver) {
      onClick(pokemon);
      triggerTap(card);
      return;
    }

    const isCorrect = onClick(pokemon);
    if (typeof isCorrect !== 'boolean') return;

    triggerTap(card);
    if (showAnswerFeedback) {
      card.classList.remove('answer-correct', 'answer-wrong');
      showTemporaryClass(
        card,
        isCorrect ? 'answer-correct' : 'answer-wrong',
        500,
        answerTimers
      );
    }
  };
  
  const isShiny = Boolean(allShiny || pokemon.isShiny);
  const spritePath = animated
    ? animatedPokemonSpriteUrl(pokemon.id, isShiny, pokemon.spriteVariant)
    : pokemonSpriteUrl(pokemon.id, isShiny, pokemon.spriteVariant);
  const cardStyle = getCardStyle(types);

  return (
    <button
      type="button"
      className="pokemon-card"
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
