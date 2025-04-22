import React, { useCallback, useMemo, useRef } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

export const getBalancedColumnCount = (count) => {
  if (count <= 1) return 1;
  if (count <= 4) return 2;

  for (let rows = Math.floor(Math.sqrt(count)); rows >= 2; rows -= 1) {
    if (count % rows === 0) return count / rows;
  }

  return Math.ceil(count / 2);
};

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
  const balancedColumns = getBalancedColumnCount(memoizedPokemonCards.length);
  const gridStyle = {
    '--balanced-grid-width': `${balancedColumns * 110 + Math.max(0, balancedColumns - 1) * 12 + 32}px`,
    '--balanced-grid-width-wide': `${balancedColumns * 110 + Math.max(0, balancedColumns - 1) * 16 + 32}px`,
    '--balanced-grid-width-compact': `${balancedColumns * 96 + Math.max(0, balancedColumns - 1) * 8 + 16}px`,
  };

  return (
    <div
      className={`pokemon-grid ${denseGrid ? 'is-dense-grid' : ''}`}
      data-count={memoizedPokemonCards.length}
      data-columns={balancedColumns}
      style={gridStyle}
    >
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;
