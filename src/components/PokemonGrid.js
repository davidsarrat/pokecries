import React, { useCallback, useMemo, useRef } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const PokemonGrid = React.memo(function PokemonGrid({ 
  pokemonList, 
  visiblePokemonIds, 
  onPokemonClick, 
  isGameOver, 
  allShiny,
  animatedSprites = true,
  showAnswerFeedback = true,
  denseGrid = false,
  pokemonTypes = {}
}) {
  const onPokemonClickRef = useRef(onPokemonClick);
  onPokemonClickRef.current = onPokemonClick;
  const handlePokemonClick = useCallback((pokemon) => {
    return onPokemonClickRef.current(pokemon);
  }, []);

  const memoizedPokemonCards = useMemo(() => {
    const pokemonById = new Map(pokemonList.map(pokemon => [pokemon.id, pokemon]));
    return visiblePokemonIds.map(id => pokemonById.get(id)).filter(Boolean).map(pokemon => {
      return (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={handlePokemonClick}
          isGameOver={isGameOver}
          allShiny={allShiny}
          animated={animatedSprites}
          showAnswerFeedback={showAnswerFeedback}
          types={pokemonTypes[pokemon.id]}
        />
      );
    });
  }, [pokemonList, visiblePokemonIds, handlePokemonClick, isGameOver, allShiny, animatedSprites, showAnswerFeedback, pokemonTypes]);

  return (
    <div className={`pokemon-grid ${denseGrid ? 'is-dense-grid' : ''}`} data-count={memoizedPokemonCards.length}>
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;
