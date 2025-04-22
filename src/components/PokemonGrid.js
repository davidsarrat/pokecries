import React, { useCallback, useMemo, useRef } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';
import { EAGER_DENSE_POKEMON } from '../utils/renderPerformance';

export const getBalancedColumnCount = (count) => {
  if (count <= 1) return 1;
  if (count <= 4) return 2;

  if (count > 30) {
    let bestColumns = 9;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let columns = 9; columns <= 11; columns += 1) {
      const lastRowCount = count % columns || columns;
      const emptySlots = columns - lastRowCount;
      const sparseRowPenalty = lastRowCount <= 2 ? count : 0;
      const score = sparseRowPenalty + emptySlots + (11 - columns) * 2;

      if (score < bestScore) {
        bestColumns = columns;
        bestScore = score;
      }
    }

    return bestColumns;
  }

  const minimumColumns = Math.ceil(Math.sqrt(count));
  const maximumColumns = Math.min(Math.ceil(count / 2), 9);
  let bestColumns = minimumColumns;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let columns = minimumColumns; columns <= maximumColumns; columns += 1) {
    const rows = Math.ceil(count / columns);
    const lastRowCount = count - (rows - 1) * columns;
    const emptySlots = columns - lastRowCount;
    const orphanPenalty = lastRowCount === 1 ? count : 0;
    const score = orphanPenalty + emptySlots * 2 + Math.abs(columns - rows) * 0.5;

    if (score < bestScore) {
      bestColumns = columns;
      bestScore = score;
    }
  }

  return bestColumns;
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
  pokemonTypes = {},
  className = '',
  gridRef,
}) {
  const onPokemonClickRef = useRef(onPokemonClick);
  onPokemonClickRef.current = onPokemonClick;
  const handlePokemonClick = useCallback((pokemon) => {
    return onPokemonClickRef.current(pokemon);
  }, []);

  const memoizedPokemonCards = useMemo(() => {
    const pokemonById = new Map(pokemonList.map(pokemon => [pokemon.id, pokemon]));
    return visiblePokemonIds.map(id => pokemonById.get(id)).filter(Boolean).map((pokemon, index) => {
      return (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onClick={handlePokemonClick}
          isGameOver={isGameOver}
          allShiny={allShiny}
          animated={animatedSprites}
          imageLoading={denseGrid && index >= EAGER_DENSE_POKEMON ? 'lazy' : 'eager'}
          showAnswerFeedback={showAnswerFeedback}
          types={pokemonTypes[pokemon.id]}
        />
      );
    });
  }, [pokemonList, visiblePokemonIds, handlePokemonClick, isGameOver, allShiny, animatedSprites, showAnswerFeedback, denseGrid, pokemonTypes]);
  const balancedColumns = getBalancedColumnCount(memoizedPokemonCards.length);
  const gridStyle = {
    '--balanced-grid-width': `${balancedColumns * 110 + Math.max(0, balancedColumns - 1) * 12 + 32}px`,
    '--balanced-grid-width-compact': `${balancedColumns * 96 + Math.max(0, balancedColumns - 1) * 8 + 16}px`,
  };

  return (
    <div
      ref={gridRef}
      className={`pokemon-grid ${denseGrid ? 'is-dense-grid' : ''} ${className}`.trim()}
      data-count={memoizedPokemonCards.length}
      data-columns={balancedColumns}
      data-compact-tail={memoizedPokemonCards.length >= 7 && memoizedPokemonCards.length % 3 === 1 ? 'split-four' : undefined}
      style={gridStyle}
    >
      {memoizedPokemonCards}
    </div>
  );
});

export default PokemonGrid;
